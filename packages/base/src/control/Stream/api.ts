import type { Cause } from "../../data/Cause";
import type { Lazy } from "../../data/function";
import type { Predicate } from "../../data/Predicate";
import type { Refinement } from "../../data/Refinement";
import type { Has } from "../../prelude";
import type { Fiber } from "../Fiber";
import type { PHub } from "../Hub";
import type { Canceler, UIO } from "../IO";
import type { UManaged } from "../Managed";
import type { PQueue } from "../Queue";
import type { SinkEndReason } from "./SinkEndReason";

import { Conc } from "../../collection/immutable/Conc";
import { HashMap } from "../../collection/immutable/HashMap";
import { Either } from "../../data/Either";
import { IllegalArgumentError } from "../../data/exceptions";
import { Exit } from "../../data/Exit";
import { constVoid, identity, tuple } from "../../data/function";
import { Just, Maybe, Nothing } from "../../data/Maybe";
import { Channel } from "../Channel";
import { MergeDecision } from "../Channel/internal/MergeDecision";
import { Clock } from "../Clock";
import { Future } from "../Future";
import { Hub } from "../Hub";
import { IO, left } from "../IO";
import { Managed } from "../Managed";
import { Queue } from "../Queue";
import { Ref } from "../Ref";
import { Schedule } from "../Schedule";
import { Sink } from "../Sink";
import { TSemaphore } from "../TSemaphore";
import { DebounceState } from "./DebounceState";
import { DEFAULT_CHUNK_SIZE, Stream, StreamTypeId } from "./definition";
import { EmitTypeId, EndTypeId, HaltTypeId, Handoff, HandoffSignal } from "./Handoff";
import { Pull } from "./Pull";
import {
  ScheduleEnd,
  ScheduleEndTypeId,
  ScheduleTimeout,
  ScheduleTimeoutTypeId,
  SinkEnd,
  SinkEndTypeId,
  UpstreamEnd,
  UpstreamEndTypeId,
} from "./SinkEndReason";
import { Take } from "./Take";

/**
 * Submerges the error case of an `Either` into the `Stream`.
 *
 * @tsplus getter fncts.control.Stream absolve
 */
export function absolve<R, E, E2, A>(self: Stream<R, E, Either<E2, A>>): Stream<R, E | E2, A> {
  return self.mapIO((either) => IO.fromEither(either));
}

/**
 * Aggregates elements of this stream using the provided sink for as long
 * as the downstream operators on the stream are busy.
 *
 * This operator divides the stream into two asynchronous "islands". Operators upstream
 * of this operator run on one fiber, while downstream operators run on another. Whenever
 * the downstream fiber is busy processing elements, the upstream fiber will feed elements
 * into the sink until it signals completion.
 *
 * Any sink can be used here, but see `Sink.foldWeightedM` and `Sink.foldUntilM` for
 * sinks that cover the common usecases.
 *
 * @tsplus fluent fncts.control.Stream aggregateAsync
 */
export function aggregateAsync_<R, E, A extends A1, R1, E1, A1, B>(
  stream: Stream<R, E, A>,
  sink: Sink<R1, E1, A1, A1, B>,
): Stream<R & R1 & Has<Clock>, E | E1, B> {
  return stream.aggregateAsyncWithin(sink, Schedule.forever);
}

/**
 * Like `aggregateAsyncWithinEither`, but only returns the `Right` results.
 *
 * @tsplus fluent fncts.control.Stream aggregateAsyncWithin
 */
export function aggregateAsyncWithin_<R, E, A extends A1, R1, E1, A1, B, R2, C>(
  stream: Stream<R, E, A>,
  sink: Sink<R1, E1, A1, A1, B>,
  schedule: Schedule<R2, Maybe<B>, C>,
): Stream<R & R1 & R2 & Has<Clock>, E | E1, B> {
  return stream.aggregateAsyncWithinEither(sink, schedule).filterMap((cb) => cb.match(() => Nothing(), Maybe.just));
}

/**
 * Aggregates elements using the provided sink until it completes, or until the
 * delay signalled by the schedule has passed.
 *
 * This operator divides the stream into two asynchronous islands. Operators upstream
 * of this operator run on one fiber, while downstream operators run on another. Elements
 * will be aggregated by the sink until the downstream fiber pulls the aggregated value,
 * or until the schedule's delay has passed.
 *
 * Aggregated elements will be fed into the schedule to determine the delays between
 * pulls.
 *
 * @tsplus fluent fncts.control.Stream aggregateAsyncWithinEither
 */
export function aggregateAsyncWithinEither_<R, E, A extends A1, R1, E1, A1, B, R2, C>(
  stream: Stream<R, E, A>,
  sink: Sink<R1, E1, A1, A1, B>,
  schedule: Schedule<R2, Maybe<B>, C>,
): Stream<R & R1 & R2 & Has<Clock>, E | E1, Either<C, B>> {
  type LocalHandoffSignal = HandoffSignal<C, E | E1, A1>;
  type LocalSinkEndReason = SinkEndReason<C>;

  const deps = IO.sequenceT(
    Handoff<LocalHandoffSignal>(),
    Ref.make<LocalSinkEndReason>(new SinkEnd()),
    Ref.make(Conc.empty<A1>()),
    schedule.driver,
  );

  return Stream.fromIO(deps).chain(([handoff, sinkEndReason, sinkLeftovers, scheduleDriver]) => {
    const handoffProducer: Channel<unknown, E | E1, Conc<A1>, unknown, never, never, any> = Channel.readWithCause(
      (_in: Conc<A1>) => Channel.fromIO(handoff.offer(HandoffSignal.Emit(_in))).apSecond(handoffProducer),
      (cause: Cause<E | E1>) => Channel.fromIO(handoff.offer(HandoffSignal.Halt(cause))),
      (_: any) => Channel.fromIO(handoff.offer(HandoffSignal.End(new UpstreamEnd()))),
    );

    const handoffConsumer: Channel<unknown, unknown, unknown, unknown, E | E1, Conc<A1>, void> = Channel.unwrap(
      sinkLeftovers.getAndSet(Conc.empty<A>()).chain((leftovers) => {
        if (leftovers.isEmpty) {
          return IO.succeedNow(Channel.writeNow(leftovers).apSecond(handoffConsumer));
        } else {
          return handoff.take.map((signal) => {
            switch (signal._tag) {
              case EmitTypeId:
                return Channel.writeNow(signal.els).apSecond(handoffConsumer);
              case HaltTypeId:
                return Channel.failCause(signal.error);
              case EndTypeId:
                return Channel.fromIO(sinkEndReason.set(signal.reason));
            }
          });
        }
      }),
    );

    const scheduledAggregator = (
      lastB: Maybe<B>,
    ): Channel<R1 & R2 & Has<Clock>, unknown, unknown, unknown, E | E1, Conc<Either<C, B>>, any> => {
      const timeout = scheduleDriver.next(lastB).matchCauseIO(
        (_) =>
          _.failureOrCause.match(
            (_) => handoff.offer(HandoffSignal.End(new ScheduleTimeout())),
            (cause) => handoff.offer(HandoffSignal.Halt(cause)),
          ),
        (c) => handoff.offer(HandoffSignal.End(new ScheduleEnd(c))),
      );

      return Channel.managed(timeout.forkManaged, (fiber) => {
        return handoffConsumer.pipeToOrFail(sink.channel).doneCollect.chain(([leftovers, b]) => {
          return Channel.fromIO(fiber.interrupt.apSecond(sinkLeftovers.set(leftovers.flatten))).apSecond(
            Channel.unwrap(
              sinkEndReason.modify((reason) => {
                switch (reason._tag) {
                  case ScheduleEndTypeId:
                    return tuple(Channel.writeNow(Conc.from([Either.right(b), Either.left(reason.c)])).as(Just(b)), new SinkEnd());
                  case ScheduleTimeoutTypeId:
                    return tuple(Channel.writeNow(Conc.single(Either.right(b))).as(Just(b)), new SinkEnd());
                  case SinkEndTypeId:
                    return tuple(Channel.writeNow(Conc.single(Either.right(b))).as(Just(b)), new SinkEnd());
                  case UpstreamEndTypeId:
                    return tuple(Channel.writeNow(Conc.single(Either.right(b))).as(Nothing()), new UpstreamEnd());
                }
              }),
            ),
          );
        });
      }).chain((_: Maybe<B>) =>
        _.match(
          () => Channel.unit,
          () => scheduledAggregator(_),
        ),
      );
    };

    return Stream.fromManaged(stream.channel.pipeTo(handoffProducer).runManaged.fork).apSecond(new Stream(scheduledAggregator(Nothing())));
  });
}

/**
 * Composes this stream with the specified stream to create a cartesian product of elements,
 * but keeps only elements from this stream.
 * The `that` stream would be run multiple times, for every element in the `this` stream.
 *
 * @tsplus fluent fncts.control.Stream apFirst
 */
export function apFirst_<R, R1, E, E1, A, A1>(stream: Stream<R, E, A>, that: Stream<R1, E1, A1>): Stream<R & R1, E | E1, A> {
  return stream.crossWith(that, (a, _) => a);
}

/**
 * Composes this stream with the specified stream to create a cartesian product of elements,
 * but keeps only elements from the other stream.
 * The `that` stream would be run multiple times, for every element in the `this` stream.
 *
 * @tsplus fluent fncts.control.Stream apSecond
 */
export function apSecond_<R, R1, E, E1, A, A1>(stream: Stream<R, E, A>, that: Stream<R1, E1, A1>): Stream<R & R1, E | E1, A1> {
  return stream.crossWith(that, (_, b) => b);
}

/**
 * Maps the success values of this stream to the specified constant value.
 *
 * @tsplus fluent fncts.control.Stream as
 */
export function as_<R, E, A, B>(stream: Stream<R, E, A>, b: Lazy<B>): Stream<R, E, B> {
  return stream.map(() => b());
}

/**
 * @tsplus static fncts.control.StreamOps asyncInterrupt
 */
export function asyncInterrupt<R, E, A>(
  register: (
    resolve: (next: IO<R, Maybe<E>, Conc<A>>, offerCb?: (e: Exit<never, boolean>) => void) => void,
  ) => Either<Canceler<R>, Stream<R, E, A>>,
  outputBuffer = 16,
): Stream<R, E, A> {
  return Stream.unwrapManaged(
    Managed.gen(function* (_) {
      const output       = yield* _(Managed.bracket(Queue.makeBounded<Take<E, A>>(outputBuffer), (queue) => queue.shutdown));
      const runtime      = yield* _(IO.runtime<R>());
      const eitherStream = yield* _(
        Managed.succeed(() =>
          register((k, cb) => {
            const effect = Take.fromPull(k).chain((a) => output.offer(a));
            return runtime.unsafeRunAsyncWith(effect, cb || constVoid);
          }),
        ),
      );
      return eitherStream.match(
        (canceler) => {
          const loop: Channel<unknown, unknown, unknown, unknown, E, Conc<A>, void> = Channel.unwrap(
            output.take
              .chain((take) => take.done)
              .match(
                (maybeError) => maybeError.match(() => Channel.endNow(undefined), Channel.failNow),
                (as) => Channel.writeNow(as).apSecond(loop),
              ),
          );
          return new Stream(loop).ensuring(canceler);
        },
        (stream) => Stream.unwrap(output.shutdown.as(stream)),
      );
    }),
  );
}

/**
 * Creates a stream from an asynchronous callback that can be called multiple times.
 * The registration of the callback can possibly return the stream synchronously.
 * The optionality of the error type `E` can be used to signal the end of the stream,
 * by setting it to `None`.
 *
 * @tsplus static fncts.control.StreamOps asyncMaybe
 */
export function asyncMaybe<R, E, A>(
  register: (resolve: (next: IO<R, Maybe<E>, Conc<A>>, offerCb?: (e: Exit<never, boolean>) => void) => void) => Maybe<Stream<R, E, A>>,
  outputBuffer = 16,
): Stream<R, E, A> {
  return Stream.asyncInterrupt((k) => register(k).match(() => Either.left(IO.unit), Either.right), outputBuffer);
}

/**
 * @tsplus static fncts.control.StreamOps async
 */
export function async<R, E, A>(
  register: (resolve: (next: IO<R, Maybe<E>, Conc<A>>, offerCb?: (e: Exit<never, boolean>) => void) => void) => void,
  outputBuffer = 16,
): Stream<R, E, A> {
  return Stream.asyncMaybe((cb) => {
    register(cb);
    return Nothing();
  }, outputBuffer);
}

/**
 * @tsplus static fncts.control.StreamOps asyncIO
 */
export function asyncIO<R, E, A, R1 = R, E1 = E>(
  register: (resolve: (next: IO<R, Maybe<E>, Conc<A>>, offerCb?: (e: Exit<never, boolean>) => void) => void) => IO<R1, E1, unknown>,
  outputBuffer = 16,
): Stream<R & R1, E | E1, A> {
  return new Stream(
    Channel.unwrapManaged(
      Managed.gen(function* (_) {
        const output  = yield* _(Managed.bracket(Queue.makeBounded<Take<E, A>>(outputBuffer), (_) => _.shutdown));
        const runtime = yield* _(IO.runtime<R>());
        yield* _(
          register((k, cb) =>
            runtime.unsafeRunAsyncWith(
              Take.fromPull(k).chain((a) => output.offer(a)),
              cb || constVoid,
            ),
          ),
        );
        const loop: Channel<unknown, unknown, unknown, unknown, E, Conc<A>, void> = Channel.unwrap(
          output.take
            .chain((take) => take.done)
            .matchCauseIO(
              (cause) =>
                output.shutdown.as(
                  cause.failureOrCause.match(
                    (maybeError) => maybeError.match(() => Channel.endNow(undefined), Channel.failNow),
                    Channel.failCauseNow,
                  ),
                ),
              (as) => IO.succeed(Channel.writeNow(as).apSecond(loop)),
            ),
        );
        return loop;
      }),
    ),
  );
}

/**
 * Returns a stream whose failure and success channels have been mapped by
 * the specified pair of functions, `f` and `g`.
 */
export function bimap_<R, E, E1, A, A1>(stream: Stream<R, E, A>, f: (e: E) => E1, g: (a: A) => A1): Stream<R, E1, A1> {
  return stream.mapError(f).map(g);
}

/**
 * Creates a stream from a single value that will get cleaned up after the
 * stream is consumed
 *
 * @tsplus static fncts.control.StreamOps bracket
 */
export function bracket_<R, E, A, R1>(acquire: IO<R, E, A>, release: (a: A) => IO<R1, never, unknown>): Stream<R & R1, E, A> {
  return Stream.fromManaged(Managed.bracket(acquire, release));
}

/**
 * Creates a stream from a single value that will get cleaned up after the
 * stream is consumed
 *
 * @tsplus static fncts.control.StreamOps bracketExit
 */
export function bracketExit_<R, E, A, R1>(
  acquire: IO<R, E, A>,
  release: (a: A, exit: Exit<any, any>) => IO<R1, never, unknown>,
): Stream<R & R1, E, A> {
  return Stream.fromManaged(Managed.bracketExit(acquire, release));
}

/**
 * Fan out the stream, producing a list of streams that have the same elements as this stream.
 * The driver stream will only ever advance of the `maximumLag` chunks before the
 * slowest downstream stream.
 *
 * @tsplus fluent fncts.control.Stream broadcast
 */
export function broadcast_<R, E, A>(
  stream: Stream<R, E, A>,
  n: number,
  maximumLag: number,
): Managed<R, never, Conc<Stream<unknown, E, A>>> {
  return stream.broadcastedQueues(n, maximumLag).map((c) => c.map((hub) => Stream.fromQueueWithShutdown(hub).flattenTake));
}

/**
 * Fan out the stream, producing a dynamic number of streams that have the same elements as this stream.
 * The driver stream will only ever advance of the `maximumLag` chunks before the
 * slowest downstream stream.
 *
 * @tsplus fluent fncts.control.Stream broadcastDynamic
 */
export function broadcastDynamic_<R, E, A>(stream: Stream<R, E, A>, maximumLag: number): Managed<R, never, Stream<unknown, E, A>> {
  return stream.broadcastedQueuesDynamic(maximumLag).map((managed) => Stream.fromManaged(managed).chain(Stream.fromQueue).flattenTake);
}

/**
 * Converts the stream to a managed list of queues. Every value will be replicated to every queue with the
 * slowest queue being allowed to buffer `maximumLag` chunks before the driver is backpressured.
 *
 * Queues can unsubscribe from upstream by shutting down.
 *
 * @tsplus fluent fncts.control.Stream broadcastedQueues
 */
export function broadcastedQueues_<R, E, A>(
  stream: Stream<R, E, A>,
  n: number,
  maximumLag: number,
): Managed<R, never, Conc<Hub.Dequeue<unknown, never, Take<E, A>>>> {
  return Managed.gen(function* (_) {
    const hub    = yield* _(Hub.makeBounded<Take<E, A>>(maximumLag));
    const queues = yield* _(Managed.sequenceIterable(Conc.replicate(n, hub.subscribe)));
    yield* _(stream.runIntoHubManaged(hub).fork);
    return queues;
  });
}

/**
 * Converts the stream to a managed dynamic amount of queues. Every chunk will be replicated to every queue with the
 * slowest queue being allowed to buffer `maximumLag` chunks before the driver is backpressured.
 *
 * Queues can unsubscribe from upstream by shutting down.
 *
 * @tsplus fluent fncts.control.Stream broadcastedQueuesDynamic
 */
export function broadcastedQueuesDynamic_<R, E, A>(
  stream: Stream<R, E, A>,
  maximumLag: number,
): Managed<R, never, Managed<unknown, never, Hub.Dequeue<unknown, never, Take<E, A>>>> {
  return stream.toHub(maximumLag).map((hub) => hub.subscribe);
}

/**
 * Allows a faster producer to progress independently of a slower consumer by buffering
 * up to `capacity` elements in a queue.
 *
 * @tsplus fluent fncts.control.Stream buffer
 */
export function buffer_<R, E, A>(stream: Stream<R, E, A>, capacity: number): Stream<R, E, A> {
  const queue = toQueueOfElements_(stream, capacity);
  return new Stream(
    Channel.managed(queue, (queue) => {
      const process: Channel<unknown, unknown, unknown, unknown, E, Conc<A>, void> = pipe(
        Channel.fromIO(queue.take).chain((exit: Exit<Maybe<E>, A>) =>
          exit.match(
            (cause) => cause.flipCauseMaybe.match(() => Channel.endNow(undefined), Channel.failCauseNow),
            (value) => Channel.writeNow(Conc.single(value)).apSecond(process),
          ),
        ),
      );
      return process;
    }),
  );
}

/**
 * @tsplus fluent fncts.control.Stream bufferChunks
 */
export function bufferChunks_<R, E, A>(stream: Stream<R, E, A>, capacity: number): Stream<R, E, A> {
  const queue = stream.toQueue(capacity);
  return new Stream(
    Channel.managed(queue, (queue) => {
      const process: Channel<unknown, unknown, unknown, unknown, E, Conc<A>, void> = pipe(
        Channel.fromIO(queue.take).chain((take: Take<E, A>) =>
          take.match(Channel.endNow(undefined), Channel.failCauseNow, (value) => Channel.writeNow(value).apSecond(process)),
        ),
      );
      return process;
    }),
  );
}

/**
 * Allows a faster producer to progress independently of a slower consumer by buffering
 * elements into an unbounded queue.
 *
 * @tsplus getter fncts.control.Stream bufferUnbounded
 */
export function bufferUnbounded<R, E, A>(stream: Stream<R, E, A>): Stream<R, E, A> {
  const queue = stream.toQueueUnbounded;

  return new Stream(
    Channel.managed(queue, (queue) => {
      const process: Channel<unknown, unknown, unknown, unknown, E, Conc<A>, void> = Channel.fromIO(queue.take).chain((take) =>
        take.match(Channel.endNow(undefined), Channel.failCauseNow, (value) => Channel.writeNow(value).apSecond(process)),
      );

      return process;
    }),
  );
}

function bufferSignalProducer<R, E, A>(
  queue: Queue<readonly [Take<E, A>, Future<never, void>]>,
  ref: Ref<Future<never, void>>,
): Channel<R, E, Conc<A>, unknown, never, never, unknown> {
  const terminate = (take: Take<E, A>): Channel<R, E, Conc<A>, unknown, never, never, unknown> =>
    Channel.fromIO(
      IO.gen(function* (_) {
        const latch = yield* _(ref.get);
        yield* _(latch.await);
        const p = yield* _(Future.make<never, void>());
        yield* _(queue.offer(tuple(take, p)));
        yield* _(ref.set(p));
        yield* _(p.await);
      }),
    );
  return Channel.readWith(
    (inp) =>
      Channel.fromIO(
        IO.gen(function* (_) {
          const p     = yield* _(Future.make<never, void>());
          const added = yield* _(queue.offer(tuple(Take.chunk(inp), p)));
          yield* _(ref.set(p).when(added));
        }),
      ).apSecond(bufferSignalProducer(queue, ref)),
    (e) => terminate(Take.fail(e)),
    () => terminate(Take.end),
  );
}

function bufferSignalConsumer<R, E, A>(
  queue: Queue<readonly [Take<E, A>, Future<never, void>]>,
): Channel<R, unknown, unknown, unknown, E, Conc<A>, void> {
  const process: Channel<unknown, unknown, unknown, unknown, E, Conc<A>, void> = Channel.fromIO(queue.take).chain(([take, promise]) =>
    Channel.fromIO(promise.succeed(undefined)).apSecond(
      take.match(Channel.endNow(undefined), Channel.failCauseNow, (value) => Channel.writeNow(value).apSecond(process)),
    ),
  );
  return process;
}

function bufferSignal<R, E, A>(
  managed: UManaged<Queue<readonly [Take<E, A>, Future<never, void>]>>,
  channel: Channel<R, unknown, unknown, unknown, E, Conc<A>, unknown>,
): Channel<R, unknown, unknown, unknown, E, Conc<A>, void> {
  return Channel.managed(
    Managed.gen(function* (_) {
      const queue = yield* _(managed);
      const start = yield* _(Future.make<never, void>());
      yield* _(start.succeed(undefined));
      const ref = yield* _(Ref.make(start));
      yield* _(channel.pipeTo(bufferSignalProducer(queue, ref)).runManaged.fork);
      return queue;
    }),
    bufferSignalConsumer,
  );
}

/**
 * Switches over to the stream produced by the provided function in case this one
 * fails with a typed error.
 *
 * @tsplus fluent fncts.control.Stream catchAll
 */
export function catchAll_<R, R1, E, E1, A, A1>(stream: Stream<R, E, A>, f: (e: E) => Stream<R1, E1, A1>): Stream<R & R1, E1, A | A1> {
  return stream.catchAllCause((cause) => cause.failureOrCause.match(f, Stream.failCauseNow));
}

/**
 * Switches over to the stream produced by the provided function in case this one
 * fails. Allows recovery from all causes of failure, including interruption if the
 * stream is uninterruptible.
 *
 * @tsplus fluent fncts.control.Stream catchAllCause
 */
export function catchAllCause_<R, R1, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  f: (cause: Cause<E>) => Stream<R1, E1, A1>,
): Stream<R & R1, E1, A | A1> {
  const channel: Channel<R & R1, unknown, unknown, unknown, E1, Conc<A | A1>, unknown> = stream.channel.catchAllCause(
    (cause) => f(cause).channel,
  );
  return new Stream(channel);
}

/**
 * Switches over to the stream produced by the provided function in case this one
 * fails with some typed error.
 *
 * @tsplus fluent fncts.control.Stream catchJust
 */
export function catchJust_<R, R1, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  pf: (e: E) => Maybe<Stream<R1, E1, A1>>,
): Stream<R & R1, E | E1, A | A1> {
  return stream.catchAll((e) => pf(e).getOrElse(Stream.failNow(e)));
}

/**
 * Switches over to the stream produced by the provided function in case this one
 * fails with some errors. Allows recovery from all causes of failure, including interruption if the
 * stream is uninterruptible.
 *
 * @tsplus fluent fncts.control.Stream catchJustCause
 */
export function catchJustCause_<R, R1, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  pf: (e: Cause<E>) => Maybe<Stream<R1, E1, A1>>,
): Stream<R & R1, E | E1, A | A1> {
  return stream.catchAllCause((cause) => pf(cause).getOrElse(Stream.failCauseNow(cause)));
}

/**
 * Returns a stream made of the concatenation in strict order of all the streams
 * produced by passing each element of this stream to `f`
 *
 * @tsplus fluent fncts.control.Stream chain
 */
export function chain_<R, E, A, R1, E1, B>(stream: Stream<R, E, A>, f: (a: A) => Stream<R1, E1, B>): Stream<R & R1, E | E1, B> {
  return new Stream(
    stream.channel.concatMap((as) =>
      as
        .map((a) => f(a).channel)
        .foldLeft(Channel.unit as Channel<R1, unknown, unknown, unknown, E1, Conc<B>, unknown>, (s, a) => s.chain(() => a)),
    ),
  );
}

/**
 * Exposes the underlying chunks of the stream as a stream of chunks of elements
 *
 * @tsplus getter fncts.control.Stream chunks
 */
export function chunks<R, E, A>(stream: Stream<R, E, A>): Stream<R, E, Conc<A>> {
  return stream.mapChunks(Conc.single);
}

function changesWithWriter<R, E, A>(f: (x: A, y: A) => boolean, last: Maybe<A>): Channel<R, E, Conc<A>, unknown, E, Conc<A>, void> {
  return Channel.readWithCause(
    (chunk: Conc<A>) => {
      const [newLast, newChunk] = chunk.foldLeft([last, Conc.empty<A>()], ([maybeLast, os], o1) =>
        maybeLast.match(
          () => [Just(o1), os.append(o1)],
          (o) => (f(o, o1) ? [Just(o1), os] : [Just(o1), os.append(o1)]),
        ),
      );
      return Channel.writeNow(newChunk).apSecond(changesWithWriter(f, newLast));
    },
    Channel.failCauseNow,
    () => Channel.unit,
  );
}

/**
 * Returns a new stream that only emits elements that are not equal to the
 * previous element emitted, using the specified function to determine
 * whether two elements are equal.
 *
 * @tsplus fluent fncts.control.Stream changesWith
 */
export function changesWith_<R, E, A>(stream: Stream<R, E, A>, f: (x: A, y: A) => boolean): Stream<R, E, A> {
  return new Stream(stream.channel.pipeTo(changesWithWriter<R, E, A>(f, Nothing())));
}

/**
 * Transforms all elements of the stream for as long as the specified partial function is defined.
 *
 * @tsplus fluent fncts.control.Stream collectWhile
 */
export function collectWhile_<R, E, A, A1>(stream: Stream<R, E, A>, pf: (a: A) => Maybe<A1>): Stream<R, E, A1> {
  const loop: Channel<R, E, Conc<A>, unknown, E, Conc<A1>, any> = Channel.readWith(
    (inp) => {
      const mapped = inp.collectWhile(pf);

      if (mapped.length === inp.length) {
        return Channel.writeNow(mapped).apSecond(loop);
      } else {
        return Channel.writeNow(mapped);
      }
    },
    Channel.failNow,
    Channel.succeedNow,
  );

  return new Stream(stream.channel.pipeTo(loop));
}

/**
 * Effectfully transforms all elements of the stream for as long as the specified partial function is defined.
 */
export function collectWhileIO_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  pf: (a: A) => Maybe<IO<R1, E1, B>>,
): Stream<R & R1, E | E1, B> {
  return stream.loopOnPartialChunks((chunk, emit) => {
    const pfJust = (a: A) =>
      pf(a).match(
        () => IO.succeedNow(false),
        (effect) => effect.chain(emit).as(true),
      );

    const loop = (chunk: Conc<A>): IO<R1, E1, boolean> => {
      if (chunk.isEmpty) {
        return IO.succeedNow(true);
      } else {
        return pfJust(chunk.unsafeHead).chain((cont) => (cont ? loop(chunk.unsafeTail) : IO.succeedNow(false)));
      }
    };

    return loop(chunk);
  });
}

function combineProducer<Err, Elem>(
  handoff: Handoff<Exit<Maybe<Err>, Elem>>,
  latch: Handoff<void>,
): Channel<unknown, Err, Elem, unknown, never, never, any> {
  return Channel.fromIO(latch.take).apSecond(
    Channel.readWithCause(
      (value) => Channel.fromIO(handoff.offer(Exit.succeed(value))).apSecond(combineProducer(handoff, latch)),
      (cause) => Channel.fromIO(handoff.offer(Exit.failCause(cause.map(Maybe.just)))),
      () => Channel.fromIO(handoff.offer(Exit.fail(Nothing()))).apSecond(combineProducer(handoff, latch)),
    ),
  );
}

/**
 * Combines the elements from this stream and the specified stream by repeatedly applying the
 * function `f` to extract an element using both sides and conceptually "offer"
 * it to the destination stream. `f` can maintain some internal state to control
 * the combining process, with the initial state being specified by `s`.
 *
 * Where possible, prefer `Stream#combineChunks` for a more efficient implementation.
 *
 * @tsplus fluent fncts.control.Stream combine
 */
export function combine_<R, E, A, R1, E1, A1, S, R2, A2>(
  stream: Stream<R, E, A>,
  that: Stream<R1, E1, A1>,
  s: S,
  f: (s: S, eff1: IO<R, Maybe<E>, A>, eff2: IO<R1, Maybe<E1>, A1>) => IO<R2, never, Exit<Maybe<E | E1>, readonly [A2, S]>>,
): Stream<R & R1 & R2, E | E1, A2> {
  return new Stream(
    Channel.managed(
      Managed.gen(function* (_) {
        const left   = yield* _(Handoff<Exit<Maybe<E>, A>>());
        const right  = yield* _(Handoff<Exit<Maybe<E1>, A1>>());
        const latchL = yield* _(Handoff<void>());
        const latchR = yield* _(Handoff<void>());
        yield* _(stream.channel.concatMap(Channel.writeChunk).pipeTo(combineProducer(left, latchL)).runManaged.fork);
        yield* _(that.channel.concatMap(Channel.writeChunk).pipeTo(combineProducer(right, latchR)).runManaged.fork);
        return tuple(left, right, latchL, latchR);
      }),
      ([left, right, latchL, latchR]) => {
        const pullLeft  = latchL.offer(undefined).apSecond(left.take).chain(IO.fromExitNow);
        const pullRight = latchR.offer(undefined).apSecond(right.take).chain(IO.fromExitNow);
        return Stream.unfoldIO(s, (s) => f(s, pullLeft, pullRight).chain((exit) => IO.fromExitNow(exit).optional)).channel;
      },
    ),
  );
}

function combineChunksProducer<Err, Elem>(
  handoff: Handoff<Take<Err, Elem>>,
  latch: Handoff<void>,
): Channel<unknown, Err, Conc<Elem>, unknown, never, never, any> {
  return Channel.fromIO(latch.take).apSecond(
    Channel.readWithCause(
      (chunk) => Channel.fromIO(handoff.offer(Take.chunk(chunk))).apSecond(combineChunksProducer(handoff, latch)),
      (cause) => Channel.fromIO(handoff.offer(Take.failCause(cause))),
      () => Channel.fromIO(handoff.offer(Take.end)).apSecond(combineChunksProducer(handoff, latch)),
    ),
  );
}

/**
 * Combines the chunks from this stream and the specified stream by repeatedly applying the
 * function `f` to extract a chunk using both sides and conceptually "offer"
 * it to the destination stream. `f` can maintain some internal state to control
 * the combining process, with the initial state being specified by `s`.
 *
 * @tsplus fluent fncts.control.Stream combineChunks
 */
export function combineChunks_<R, E, A, R1, E1, A1, S, R2, A2>(
  stream: Stream<R, E, A>,
  that: Stream<R1, E1, A1>,
  s: S,
  f: (s: S, l: IO<R, Maybe<E>, Conc<A>>, r: IO<R1, Maybe<E1>, Conc<A1>>) => IO<R2, never, Exit<Maybe<E | E1>, readonly [Conc<A2>, S]>>,
): Stream<R1 & R & R2, E | E1, A2> {
  return new Stream(
    Channel.managed(
      Managed.gen(function* (_) {
        const left   = yield* _(Handoff<Take<E, A>>());
        const right  = yield* _(Handoff<Take<E1, A1>>());
        const latchL = yield* _(Handoff<void>());
        const latchR = yield* _(Handoff<void>());
        yield* _(stream.channel.pipeTo(combineChunksProducer(left, latchL)).runManaged.fork);
        yield* _(that.channel.pipeTo(combineChunksProducer(right, latchR)).runManaged.fork);
        return tuple(left, right, latchL, latchR);
      }),
      ([left, right, latchL, latchR]) => {
        const pullLeft = latchL
          .offer(undefined)
          .apSecond(left.take)
          .chain((take) => take.done);
        const pullRight = latchR
          .offer(undefined)
          .apSecond(right.take)
          .chain((take) => take.done);
        return Stream.unfoldChunkIO(s, (s) => f(s, pullLeft, pullRight).chain((exit) => IO.fromExit(exit).optional)).channel;
      },
    ),
  );
}

/**
 * Concatenates the specified stream with this stream, resulting in a stream
 * that emits the elements from this stream and then the elements from the specified stream.
 *
 * @tsplus fluent fncts.control.Stream concat
 */
export function concat_<R, R1, E, E1, A, A1>(stream: Stream<R, E, A>, that: Stream<R1, E1, A1>): Stream<R & R1, E | E1, A | A1> {
  return new Stream<R & R1, E | E1, A | A1>(stream.channel.apSecond(that.channel));
}

/**
 * Composes this stream with the specified stream to create a cartesian product of elements.
 * The `that` stream would be run multiple times, for every element in the `this` stream.
 *
 * @tsplus fluent fncts.control.Stream cross
 */
export function cross_<R, E, A, R1, E1, B>(stream: Stream<R, E, A>, that: Stream<R1, E1, B>): Stream<R & R1, E | E1, readonly [A, B]> {
  return new Stream(stream.channel.concatMap((as) => that.channel.mapOut((bs) => as.chain((a) => bs.map((b) => tuple(a, b))))));
}

/**
 * Composes this stream with the specified stream to create a cartesian product of elements
 * with a specified function.
 * The `fb` stream would be run multiple times, for every element in the `fa` stream.
 *
 * @tsplus fluent fncts.control.Stream crossWith
 */
export function crossWith_<R, E, A, R1, E1, B, C>(
  fa: Stream<R, E, A>,
  fb: Stream<R1, E1, B>,
  f: (a: A, b: B) => C,
): Stream<R & R1, E | E1, C> {
  return fa.chain((a) => fb.map((b) => f(a, b)));
}

/**
 * Provides some of the environment required to run this effect,
 * leaving the remainder `R0`.
 *
 * @tsplus fluent fncts.control.Stream contramapEnvironment
 */
export function contramapEnvironment_<R, E, A, R0>(ra: Stream<R, E, A>, f: (r0: R0) => R): Stream<R0, E, A> {
  return Stream.environment<R0>().chain((r0) => ra.provideEnvironment(f(r0)));
}

/**
 * @tsplus fluent fncts.control.Stream debounce
 */
export function debounce_<R, E, A>(stream: Stream<R, E, A>, duration: number): Stream<R & Has<Clock>, E, A> {
  return Stream.unwrap(
    IO.gen(function* (_) {
      const scope   = yield* _(IO.forkScope);
      const handoff = yield* _(Handoff<HandoffSignal<void, E, A>>());
      function enqueue(last: Conc<A>) {
        return Clock.sleep(duration)
          .as(last)
          .forkIn(scope)
          .map((f) => consumer(DebounceState.Previous(f)));
      }
      const producer: Channel<R & Has<Clock>, E, Conc<A>, unknown, E, never, unknown> = Channel.readWithCause(
        (inp: Conc<A>) =>
          pipe(
            inp.last.match(
              () => producer,
              (last) => Channel.fromIO(handoff.offer(HandoffSignal.Emit(Conc.single(last)))).apSecond(producer),
            ),
          ),
        (cause: Cause<E>) => Channel.fromIO(handoff.offer(HandoffSignal.Halt(cause))),
        () => Channel.fromIO(handoff.offer(HandoffSignal.End(new UpstreamEnd()))),
      );
      function consumer(state: DebounceState<E, A>): Channel<R & Has<Clock>, unknown, unknown, unknown, E, Conc<A>, unknown> {
        return Channel.unwrap(
          state.match({
            NotStarted: () =>
              handoff.take.map((signal) =>
                signal.match({
                  Emit: ({ els }) => Channel.unwrap(enqueue(els)),
                  Halt: ({ error }) => Channel.failCauseNow(error),
                  End: () => Channel.unit,
                }),
              ),
            Current: ({ fiber }) =>
              fiber.join.map((signal) =>
                signal.match({
                  Emit: ({ els }) => Channel.unwrap(enqueue(els)),
                  Halt: ({ error }) => Channel.failCauseNow(error),
                  End: () => Channel.unit,
                }),
              ),
            Previous: ({ fiber }) =>
              fiber.join.raceWith(
                handoff.take,
                (ex, current) =>
                  ex.match(
                    (cause) => current.interrupt.as(Channel.failCauseNow(cause)),
                    (chunk) => IO.succeedNow(Channel.writeNow(chunk).apSecond(consumer(DebounceState.Current(current)))),
                  ),
                (ex, previous) =>
                  ex.match(
                    (cause) => previous.interrupt.as(Channel.failCauseNow(cause)),
                    (signal) =>
                      signal.match({
                        Emit: ({ els }) => previous.interrupt.apSecond(enqueue(els)),
                        Halt: ({ error }) => previous.interrupt.as(Channel.failCauseNow(error)),
                        End: () => previous.join.map((chunk) => Channel.writeNow(chunk).apSecond(Channel.unit)),
                      }),
                  ),
              ),
          }),
        );
      }

      return Stream.fromManaged(stream.channel.pipeTo(producer).runManaged.fork).apSecond(new Stream(consumer(DebounceState.NotStarted)));
    }),
  );
}

function defaultIfEmptyWriter<R, E, A, R1, E1, B>(
  fb: Stream<R1, E1, B>,
): Channel<R & R1, E, Conc<A>, unknown, E | E1, Conc<A | B>, unknown> {
  return Channel.readWith(
    (i: Conc<A>) => (i.isEmpty ? defaultIfEmptyWriter(fb) : Channel.writeNow(i).apSecond(Channel.id<E, Conc<A>, unknown>())),
    Channel.failNow,
    () => fb.channel,
  );
}

/**
 * Switches to the provided stream in case this one is empty.
 *
 * @tsplus fluent fncts.control.Stream defaultIfEmpty
 */
export function defaultIfEmpty_<R, E, A, R1, E1, B>(fa: Stream<R, E, A>, fb: Stream<R1, E1, B>): Stream<R & R1, E | E1, A | B> {
  return new Stream(fa.channel.pipeTo(defaultIfEmptyWriter(fb)));
}

/**
 * More powerful version of `broadcast`. Allows to provide a function that determines what
 * queues should receive which elements. The decide function will receive the indices of the queues
 * in the resulting list.
 *
 * @tsplus fluent fncts.control.Stream distributedWith
 */
export function distributedWith_<R, E, A>(
  ma: Stream<R, E, A>,
  n: number,
  maximumLag: number,
  decide: (_: A) => UIO<(_: number) => boolean>,
): Managed<R, never, Conc<Queue.Dequeue<Exit<Maybe<E>, A>>>> {
  return Managed.fromIO(Future.make<never, (a: A) => UIO<(_: symbol) => boolean>>()).chain((p) =>
    ma
      .distributedWithDynamic(
        maximumLag,
        (a) => p.await.chain((f) => f(a)),
        () => IO.unit,
      )
      .chain((next) =>
        Managed.fromIO(
          IO.sequenceIterable(Conc.range(0, n).map((id) => next.map(([key, queue]) => [[key, id], queue] as const))).chain((entries) => {
            const [mappings, queues] = entries.foldRight(
              [HashMap.makeDefault<symbol, number>(), Conc.empty<Queue.Dequeue<Exit<Maybe<E>, A>>>()] as const,
              ([mapping, queue], [mappings, queues]) => [mappings.set(mapping[0], mapping[1]), queues.append(queue)],
            );
            return p.succeed((a) => decide(a).map((f) => (key: symbol) => f(mappings.get(key).value!))).as(queues);
          }),
        ),
      ),
  );
}

/**
 * More powerful version of `ZStream#distributedWith`. This returns a function that will produce
 * new queues and corresponding indices.
 * You can also provide a function that will be executed after the final events are enqueued in all queues.
 * Shutdown of the queues is handled by the driver.
 * Downstream users can also shutdown queues manually. In this case the driver will
 * continue but no longer backpressure on them.
 *
 * @tsplus fluent fncts.control.Stream distributedWithDynamic
 */
export function distributedWithDynamic_<R, E, A>(
  self: Stream<R, E, A>,
  maximumLag: number,
  decide: (a: A) => UIO<(_: symbol) => boolean>,
  done: (exit: Exit<Maybe<E>, never>) => UIO<any> = () => IO.unit,
): Managed<R, never, UIO<readonly [symbol, Queue.Dequeue<Exit<Maybe<E>, A>>]>> {
  const offer = (queuesRef: Ref<HashMap<symbol, Queue<Exit<Maybe<E>, A>>>>) => (a: A) =>
    IO.gen(function* (_) {
      const shouldProcess = yield* _(decide(a));
      const queues        = yield* _(queuesRef.get);
      return yield* _(
        IO.foldLeft(queues, Conc.empty<symbol>(), (b, [id, queue]) => {
          if (shouldProcess(id)) {
            return queue.offer(Exit.succeed(a)).matchCauseIO(
              (c) => (c.interrupted ? IO.succeedNow(b.append(id)) : IO.failCauseNow(c)),
              () => IO.succeedNow(b),
            );
          } else {
            return IO.succeedNow(b);
          }
        }).chain((ids) => (ids.isNonEmpty ? queuesRef.update((map) => map.removeMany(ids)) : IO.unit)),
      );
    });

  return Managed.gen(function* (_) {
    const queuesRef = yield* _(
      Managed.bracket(Ref.make<HashMap<symbol, Queue<Exit<Maybe<E>, A>>>>(HashMap.makeDefault()), (ref) =>
        ref.get.chain((qs) => IO.foreach(qs.values, (q) => q.shutdown)),
      ),
    );

    const add = yield* _(
      Managed.gen(function* (_) {
        const queuesLock = yield* _(TSemaphore.make(1).commit);
        const newQueue   = yield* _(
          Ref.make<UIO<readonly [symbol, Queue<Exit<Maybe<E>, A>>]>>(
            IO.gen(function* (_) {
              const queue = yield* _(Queue.makeBounded<Exit<Maybe<E>, A>>(maximumLag));
              const id    = yield* _(IO.succeed(Symbol()));
              yield* _(queuesRef.update((map) => map.set(id, queue)));
              return tuple(id, queue);
            }),
          ),
        );
        const finalize = (endTake: Exit<Maybe<E>, never>): UIO<void> =>
          queuesLock.withPermit(
            newQueue
              .set(
                IO.gen(function* (_) {
                  const queue = yield* _(Queue.makeBounded<Exit<Maybe<E>, A>>(1));
                  yield* _(queue.offer(endTake));
                  const id = Symbol();
                  yield* _(queuesRef.update((map) => map.set(id, queue)));
                  return tuple(id, queue);
                }),
              )
              .chain(() =>
                IO.gen(function* (_) {
                  const queues = yield* _(queuesRef.get.map((map) => map.values));
                  yield* _(
                    IO.foreach(queues, (queue) =>
                      queue.offer(endTake).catchJustCause((c) => (c.interrupted ? Just(IO.unit) : Nothing<UIO<void>>())),
                    ),
                  );
                  yield* _(done(endTake));
                }),
              ).asUnit,
          );

        yield* _(
          self.runForeachManaged(offer(queuesRef)).matchCauseManaged(
            (cause) => Managed.fromIO(finalize(Exit.failCause(cause.map(Maybe.just)))),
            () => Managed.fromIO(finalize(Exit.fail(Nothing()))),
          ).fork,
        );

        return queuesLock.withPermit(newQueue.get.flatten);
      }),
    );

    return add;
  });
}

/**
 * Converts this stream to a stream that executes its effects but emits no
 * elements. Useful for sequencing effects using streams.
 *
 * @tsplus getter fncts.control.Stream drain
 */
export function drain<R, E, A>(fa: Stream<R, E, A>): Stream<R, E, void> {
  return new Stream(fa.channel.drain);
}

function dropLoop<R, E, A>(r: number): Channel<R, E, Conc<A>, unknown, E, Conc<A>, unknown> {
  return Channel.readWith(
    (inp: Conc<A>) => {
      const dropped  = inp.drop(r);
      const leftover = Math.max(0, r - inp.length);
      const more     = inp.isEmpty || leftover > 0;
      return more ? dropLoop(leftover) : Channel.write(dropped).apSecond(Channel.id());
    },
    Channel.failNow,
    () => Channel.unit,
  );
}

/**
 * Drops the specified number of elements from this stream.
 *
 * @tsplus fluent fncts.control.Stream drop
 */
export function drop_<R, E, A>(stream: Stream<R, E, A>, n: number): Stream<R, E, A> {
  return new Stream(stream.channel.pipeTo(dropLoop(n)));
}

/**
 * Drops all elements of the stream for as long as the specified predicate
 * evaluates to `true`.
 *
 * @tsplus fluent fncts.control.Stream dropWhile
 */
export function dropWhile_<R, E, A>(stream: Stream<R, E, A>, p: Predicate<A>): Stream<R, E, A> {
  return stream.pipeThrough(Sink.dropWhile(p));
}

/**
 * Drops all elements of the stream until the specified predicate evaluates
 * to `true`.
 *
 * @tsplus fluent fncts.control.Stream dropUntil
 */
export function dropUntil_<R, E, A>(stream: Stream<R, E, A>, p: Predicate<A>): Stream<R, E, A> {
  return stream.dropWhile(p.invert).drop(1);
}

/**
 * Returns a stream whose failures and successes have been lifted into an
 * `Either`. The resulting stream cannot fail, because the failures have
 * been exposed as part of the `Either` success case.
 *
 * @note the stream will end as soon as the first error occurs.
 *
 * @tsplus getter fncts.control.Stream either
 */
export function either<R, E, A>(stream: Stream<R, E, A>): Stream<R, never, Either<E, A>> {
  return stream.map(Either.right).catchAll((e) => Stream.succeedNow(Either.left(e)));
}

/**
 * Empty stream
 */
export const empty = Stream.fromChunkNow(Conc.empty<never>());

function endWhenWriter<E, A, E1>(fiber: Fiber<E1, any>): Channel<unknown, E | E1, Conc<A>, unknown, E | E1, Conc<A>, void> {
  return Channel.unwrap(
    fiber.poll.map((maybeExit) =>
      maybeExit.match(
        () =>
          Channel.readWith(
            (inp: Conc<A>) => Channel.writeNow(inp).apSecond(endWhenWriter(fiber)),
            Channel.failNow,
            () => Channel.unit,
          ),
        (exit) => exit.match(Channel.failCauseNow, () => Channel.unit),
      ),
    ),
  );
}

/**
 * Halts the evaluation of this stream when the provided IO completes. The given IO
 * will be forked as part of the returned stream, and its success will be discarded.
 *
 * An element in the process of being pulled will not be interrupted when the IO
 * completes. See `interruptWhen` for this behavior.
 *
 * If the IO completes with a failure, the stream will emit that failure.
 *
 * @tsplus fluent fncts.control.Stream endWhen
 */
export function endWhen_<R, E, A, R1, E1>(stream: Stream<R, E, A>, io: IO<R1, E1, any>): Stream<R & R1, E | E1, A> {
  return new Stream(Channel.unwrapManaged(io.forkManaged.map((fiber) => stream.channel.pipeTo(endWhenWriter(fiber)))));
}

/**
 * @tsplus fluent fncts.control.Stream ensuring
 */
export function ensuring_<R, E, A, R1>(self: Stream<R, E, A>, finalizer: IO<R1, never, any>): Stream<R & R1, E, A> {
  return new Stream(self.channel.ensuring(finalizer));
}

/**
 * @tsplus static fncts.control.StreamOps environment
 */
export function environment<R>(): Stream<R, never, R> {
  return Stream.fromIO(IO.environment<R>());
}

/**
 * Accesses the environment of the stream.
 *
 * @tsplus static fncts.control.StreamOps environmentWith
 */
export function environmentWith<R, A>(f: (r: R) => A): Stream<R, never, A> {
  return Stream.environment<R>().map(f);
}

/**
 * Accesses the environment of the stream in the context of an effect.
 *
 * @tsplus static fncts.control.StreamOps environmentWithIO
 */
export function environmentWithIO<R0, R, E, A>(f: (r0: R0) => IO<R, E, A>): Stream<R0 & R, E, A> {
  return Stream.environment<R0>().mapIO(f);
}

/**
 * Accesses the environment of the stream in the context of a stream.
 *
 * @tsplus static fncts.control.StreamOps environmentWithStream
 */
export function environmentWithStream<R0, R, E, A>(f: (r0: R0) => Stream<R, E, A>): Stream<R0 & R, E, A> {
  return Stream.environment<R0>().chain(f);
}

/**
 * Halt a stream with the specified error
 *
 * @tsplus static fncts.control.StreamOps failNow
 */
export function failNow<E>(error: E): Stream<unknown, E, never> {
  return new Stream(Channel.failNow(error));
}

/**
 * Halt a stream with the specified error
 *
 * @tsplus static fncts.control.StreamOps fail
 */
export function fail<E>(error: Lazy<E>): Stream<unknown, E, never> {
  return new Stream(Channel.fail(error));
}

/**
 * The stream that always halts with `cause`.
 *
 * @tsplus static fncts.control.StreamOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>): Stream<unknown, E, never> {
  return Stream.fromIO(IO.failCauseNow(cause));
}

/**
 * The stream that always halts with `cause`.
 *
 * @tsplus static fncts.control.StreamOps failCause
 */
export function failCause<E>(cause: Lazy<Cause<E>>): Stream<unknown, E, never> {
  return Stream.fromIO(IO.failCause(cause));
}

/**
 * @tsplus fluent fncts.control.Stream filter
 */
export function filter_<R, E, A, B extends A>(fa: Stream<R, E, A>, refinement: Refinement<A, B>): Stream<R, E, B>;
export function filter_<R, E, A>(fa: Stream<R, E, A>, predicate: Predicate<A>): Stream<R, E, A>;
export function filter_<R, E, A>(fa: Stream<R, E, A>, predicate: Predicate<A>): Stream<R, E, A> {
  return fa.mapChunks((chunk) => chunk.filter(predicate));
}

/**
 * @tsplus fluent fncts.control.Stream filterIO
 */
export function filterIO_<R, E, A, R1, E1>(fa: Stream<R, E, A>, f: (a: A) => IO<R1, E1, boolean>): Stream<R & R1, E | E1, A> {
  return fa.loopOnPartialChunksElements((a, emit) => f(a).chain((r) => (r ? emit(a) : IO.unit)));
}

/**
 * @tsplus fluent fncts.control.Stream filterMap
 */
export function filterMap_<R, E, A, B>(fa: Stream<R, E, A>, f: (a: A) => Maybe<B>): Stream<R, E, B> {
  return fa.mapChunks((chunk) => chunk.filterMap(f));
}

/**
 * @tsplus fluent fncts.control.Stream filterMapIO
 */
export function filterMapIO_<R, E, A, R1, E1, B>(fa: Stream<R, E, A>, f: (a: A) => IO<R1, E1, Maybe<B>>): Stream<R & R1, E | E1, B> {
  return fa.loopOnPartialChunksElements((a, emit) => f(a).chain((maybeB) => maybeB.match(() => IO.unit, emit)));
}

/**
 * Finds the first element emitted by this stream that satisfies the provided predicate.
 *
 * @tsplus fluent fncts.control.Stream find
 */
export function find_<R, E, A>(stream: Stream<R, E, A>, p: Predicate<A>): Stream<R, E, A> {
  const loop: Channel<R, E, Conc<A>, unknown, E, Conc<A>, unknown> = Channel.readWith(
    (inp: Conc<A>) =>
      inp.find(p).match(
        () => loop,
        (a) => Channel.writeNow(Conc.single(a)),
      ),
    Channel.failNow,
    () => Channel.unit,
  );
  return new Stream(stream.channel.pipeTo(loop));
}

/**
 * Finds the first element emitted by this stream that satisfies the provided effectful predicate.
 *
 * @tsplus fluent fncts.control.Stream findIO
 */
export function findIO_<R, E, A, R1, E1>(stream: Stream<R, E, A>, f: (a: A) => IO<R1, E1, boolean>): Stream<R & R1, E | E1, A> {
  const loop: Channel<R & R1, E, Conc<A>, unknown, E | E1, Conc<A>, unknown> = Channel.readWith(
    (inp: Conc<A>) =>
      Channel.unwrap(
        inp.findIO(f).map((maybeA) =>
          maybeA.match(
            () => loop,
            (a) => Channel.writeNow(Conc.single(a)),
          ),
        ),
      ),
    Channel.failNow,
    () => Channel.unit,
  );
  return new Stream(stream.channel.pipeTo(loop));
}

/**
 * Flattens this stream-of-streams into a stream made of the concatenation in
 * strict order of all the streams.
 *
 * @tsplus getter fncts.control.Stream flatten
 */
export function flatten<R, E, R1, E1, A>(self: Stream<R, E, Stream<R1, E1, A>>): Stream<R & R1, E | E1, A> {
  return self.chain(identity);
}

/**
 * Unwraps `Exit` values that also signify end-of-stream by failing with `None`.
 *
 * For `Exit<E, A>` values that do not signal end-of-stream, prefer:
 *
 * @tsplus getter fncts.control.Stream flattenExitOption
 */
export function flattenExitOption<R, E, E1, A>(stream: Stream<R, E, Exit<Maybe<E1>, A>>): Stream<R, E | E1, A> {
  const processChunk = (
    chunk: Conc<Exit<Maybe<E1>, A>>,
    cont: Channel<R, E, Conc<Exit<Maybe<E1>, A>>, unknown, E | E1, Conc<A>, any>,
  ): Channel<R, E, Conc<Exit<Maybe<E1>, A>>, unknown, E | E1, Conc<A>, any> => {
    const [toEmit, rest] = chunk.splitWhere((_) => !_.isSuccess());
    const next           = rest.head.match(
      () => cont,
      (exit) =>
        exit.match(
          (cause) => cause.flipCauseMaybe.match(() => Channel.endNow<void>(undefined), Channel.failCauseNow),
          () => Channel.endNow<void>(undefined),
        ),
    );

    return Channel.writeNow(toEmit.filterMap((exit) => exit.match(() => Nothing(), Maybe.just))).apSecond(next);
  };

  const process: Channel<R, E, Conc<Exit<Maybe<E1>, A>>, unknown, E | E1, Conc<A>, any> = Channel.readWithCause(
    (chunk) => processChunk(chunk, process),
    Channel.failCauseNow,
    (_) => Channel.endNow(undefined),
  );

  return new Stream(stream.channel.pipeTo(process));
}

/**
 * Unwraps `Exit` values and flatten chunks that also signify end-of-stream by failing with `None`.
 *
 * @tsplus getter fncts.control.Stream flattenTake
 */
export function flattenTake<R, E, E1, A>(stream: Stream<R, E, Take<E1, A>>): Stream<R, E | E1, A> {
  return stream.map((take) => take.exit).flattenExitOption.flattenChunks;
}

/**
 * Submerges the chunks carried by this stream into the stream's structure, while
 * still preserving them.
 *
 * @tsplus getter fncts.control.Stream flattenChunks
 */
export function flattenChunks<R, E, A>(stream: Stream<R, E, Conc<A>>): Stream<R, E, A> {
  return new Stream(stream.channel.mapOut((c) => c.flatten));
}

/**
 * Repeats this stream forever.
 *
 * @tsplus getter fncts.control.Stream forever
 */
export function forever<R, E, A>(stream: Stream<R, E, A>): Stream<R, E, A> {
  return new Stream(stream.channel.repeated);
}

/**
 * Creates a stream from a `Chunk` of values
 *
 * @tsplus static fncts.control.StreamOps fromChunkNow
 */
export function fromChunkNow<O>(c: Conc<O>): Stream<unknown, never, O> {
  return new Stream(Channel.defer(() => (c.isEmpty ? Channel.unit : Channel.writeNow(c))));
}

/**
 * Creates a stream from a `Chunk` of values
 *
 * @tsplus static fncts.control.StreamOps fromChunk
 */
export function fromChunk<O>(c: Lazy<Conc<O>>): Stream<unknown, never, O> {
  return new Stream(Channel.unwrap(IO.succeedNow(Channel.write(c))));
}

/**
 * Creates a single-valued stream from a managed resource
 *
 * @tsplus static fncts.control.StreamOps fromManaged
 */
export function fromManaged<R, E, A>(stream: Managed<R, E, A>): Stream<R, E, A> {
  return new Stream(Channel.managedOut(stream.map(Conc.single)));
}

/**
 * Creates a stream from an effect producing a value of type `A`
 *
 * @tsplus static fncts.control.StreamOps fromIO
 */
export function fromIO<R, E, A>(fa: IO<R, E, A>): Stream<R, E, A> {
  return Stream.fromIOMaybe(fa.mapError(Maybe.just));
}

/**
 * Creates a stream from an effect producing a value of type `A` or an empty Stream
 *
 * @tsplus static fncts.control.StreamOps fromIOMaybe
 */
export function fromIOMaybe<R, E, A>(fa: IO<R, Maybe<E>, A>): Stream<R, E, A> {
  return new Stream(
    Channel.unwrap(
      fa.match(
        (maybeError) => maybeError.match(() => Channel.unit, Channel.failNow),
        (a) => Channel.writeNow(Conc.single(a)),
      ),
    ),
  );
}

function fromAsyncIterableLoop<A>(iterator: AsyncIterator<A>): Channel<unknown, unknown, unknown, unknown, never, Conc<A>, unknown> {
  return Channel.unwrap(
    IO.async<unknown, never, Channel<unknown, unknown, unknown, unknown, never, Conc<A>, unknown>>((k) => {
      iterator
        .next()
        .then((result) =>
          result.done
            ? k(IO.succeedNow(Channel.end(undefined)))
            : k(IO.succeedNow(Channel.writeNow(Conc.single(result.value)).apSecond(fromAsyncIterableLoop(iterator)))),
        );
    }),
  );
}

/**
 * @tsplus static fncts.control.StreamOps fromAsyncIterable
 */
export function fromAsyncIterable<A>(iterable: AsyncIterable<A>): Stream<unknown, never, A> {
  return new Stream(fromAsyncIterableLoop(iterable[Symbol.asyncIterator]()));
}

/**
 * @tsplus static fncts.control.StreamOps fromIterable
 */
export function fromIterable<A>(iterable: Iterable<A>, maxChunkSize = DEFAULT_CHUNK_SIZE): Stream<unknown, never, A> {
  return Stream.unwrap(
    IO.succeed(() => {
      const loop = (iterator: Iterator<A>): Channel<unknown, unknown, unknown, unknown, never, Conc<A>, unknown> =>
        Channel.unwrap(
          IO.succeed(() => {
            let result = iterator.next();
            if (result.done) {
              return Channel.unit;
            }
            if (maxChunkSize === 1) {
              return Channel.writeNow(Conc.single(result.value)).apSecond(loop(iterator));
            } else {
              const out = Array<A>(maxChunkSize);
              out[0]    = result.value;
              let count = 1;
              while (count < maxChunkSize && !(result = iterator.next()).done) {
                out[count] = result.value;
                count++;
              }
              return Channel.writeNow(Conc.from(out)).apSecond(loop(iterator));
            }
          }),
        );
      return new Stream<unknown, never, A>(loop(iterable[Symbol.iterator]()));
    }),
  );
}

/**
 * @tsplus static fncts.control.StreamOps fromIterableSingle
 */
export function fromIterableSingle<A>(iterable: Iterable<A>): Stream<unknown, never, A> {
  return Stream.fromIO(IO.succeed(iterable[Symbol.iterator]())).chain((iterator) =>
    Stream.repeatIOMaybe(
      IO.defer(() => {
        const value = iterator.next();
        if (value.done) {
          return IO.failNow(Nothing());
        } else {
          return IO.succeedNow(value.value);
        }
      }),
    ),
  );
}

/**
 * @tsplus static fncts.control.StreamOps fromPull
 */
export function fromPull<R, E, A>(managedPull: Managed<R, never, IO<R, Maybe<E>, Conc<A>>>): Stream<R, E, A> {
  return Stream.unwrapManaged(managedPull.map((pull) => Stream.repeatIOChunkMaybe(pull)));
}

/**
 * Creates a stream from a `Queue` of values
 *
 * @tsplus static fncts.control.StreamOps fromQueue
 */
export function fromQueue_<R, E, O>(
  queue: PQueue<never, R, unknown, E, never, O>,
  maxChunkSize: number = DEFAULT_CHUNK_SIZE,
): Stream<R, E, O> {
  return repeatIOChunkMaybe(
    queue
      .takeBetween(1, maxChunkSize)
      .map(Conc.from)
      .catchAllCause((c) =>
        queue.isShutdown.chain((down) => {
          if (down && c.interrupted) {
            return Pull.end;
          } else {
            return Pull.failCause(c);
          }
        }),
      ),
  );
}

/**
 * @tsplus static fncts.control.StreamOps fromQueueWithShutdown
 */
export function fromQueueWithShutdown<R, E, A>(
  queue: PQueue<never, R, unknown, E, never, A>,
  maxChunkSize: number = DEFAULT_CHUNK_SIZE,
): Stream<R, E, A> {
  return Stream.fromQueue(queue, maxChunkSize).ensuring(queue.shutdown);
}

/**
 * Halt a stream with the specified exception
 *
 * @tsplus static fncts.control.StreamOps haltNow
 */
export function haltNow(u: unknown): Stream<unknown, never, never> {
  return new Stream(Channel.halt(u));
}

/**
 * Halt a stream with the specified exception
 *
 * @tsplus static fncts.control.StreamOps halt
 */
export function halt(u: Lazy<unknown>): Stream<unknown, never, never> {
  return new Stream(Channel.halt(u));
}

function haltWhenWriter<R, E, A, R1, E1>(fiber: Fiber<E1, any>): Channel<R & R1, E | E1, Conc<A>, unknown, E | E1, Conc<A>, void> {
  return Channel.unwrap(
    fiber.poll.map((maybeExit) =>
      maybeExit.match(
        () =>
          Channel.readWith(
            (i: Conc<A>) => Channel.writeNow(i).apSecond(haltWhenWriter<R, E, A, R1, E1>(fiber)),
            Channel.failNow,
            () => Channel.unit,
          ),
        (exit) => exit.match(Channel.failCauseNow, () => Channel.unit),
      ),
    ),
  );
}

/**
 * Halts the evaluation of this stream when the provided IO completes. The
 * given IO will be forked as part of the returned stream, and its success
 * will be discarded.
 *
 * An element in the process of being pulled will not be interrupted when the
 * IO completes. See `interruptWhen` for this behavior.
 *
 * If the IO completes with a failure, the stream will emit that failure.
 *
 * @tsplus fluent fncts.control.Stream haltWhen
 */
export function haltWhen_<R, E, A, R1, E1>(fa: Stream<R, E, A>, io: IO<R1, E1, any>): Stream<R & R1, E | E1, A> {
  return new Stream(Channel.unwrapManaged(io.forkManaged.map((fiber) => fa.channel.pipeTo(haltWhenWriter(fiber)))));
}

function haltWhenFutureWriter<R, E, A, E1>(future: Future<E1, unknown>): Channel<R, E | E1, Conc<A>, unknown, E | E1, Conc<A>, void> {
  return Channel.unwrap(
    pipe(
      future.poll.map((maybeIO) =>
        maybeIO.match(
          () =>
            Channel.readWith(
              (i: Conc<A>) => Channel.writeNow(i).apSecond(haltWhenFutureWriter<R, E, A, E1>(future)),
              Channel.failNow,
              () => Channel.unit,
            ),
          (io) => Channel.unwrap(io.match(Channel.failNow, () => Channel.unit)),
        ),
      ),
    ),
  );
}

/**
 * Halts the evaluation of this stream when the provided promise resolves.
 *
 * If the promise completes with a failure, the stream will emit that failure.
 *
 * @tsplus fluent fncts.control.Stream haltWhen
 */
export function haltWhenFuture_<R, E, A, E1>(fa: Stream<R, E, A>, future: Future<E1, any>): Stream<R, E | E1, A> {
  return new Stream(fa.channel.pipeTo(haltWhenFutureWriter(future)));
}

/**
 * @tsplus fluent fncts.control.Stream interleave
 */
export function interleave_<R, E, A, R1, E1, B>(sa: Stream<R, E, A>, sb: Stream<R1, E1, B>): Stream<R & R1, E | E1, A | B> {
  return sa.interleaveWith(sb, Stream.fromChunk(Conc(true, false)).forever);
}

function interleaveWithProducer<R, E, A>(handoff: Handoff<Take<E, A>>): Channel<R, E, A, unknown, never, never, void> {
  return Channel.readWithCause(
    (value: A) => Channel.fromIO(handoff.offer(Take.single(value))).apSecond(interleaveWithProducer(handoff)),
    (cause) => Channel.fromIO(handoff.offer(Take.failCause(cause))),
    () => Channel.fromIO(handoff.offer(Take.end)),
  );
}

/**
 * Combines this stream and the specified stream deterministically using the
 * stream of boolean values `b` to control which stream to pull from next.
 * `true` indicates to pull from this stream and `false` indicates to pull
 * from the specified stream. Only consumes as many elements as requested by
 * `b`. If either this stream or the specified stream are exhausted further
 * requests for values from that stream will be ignored.
 *
 * @tsplus fluent fncts.control.Stream interleaveWith
 */
export function interleaveWith_<R, E, A, R1, E1, B, R2, E2>(
  sa: Stream<R, E, A>,
  sb: Stream<R1, E1, B>,
  b: Stream<R2, E2, boolean>,
): Stream<R & R1 & R2, E | E1 | E2, A | B> {
  return new Stream(
    Channel.managed(
      Managed.gen(function* (_) {
        const left  = yield* _(Handoff<Take<E, A>>());
        const right = yield* _(Handoff<Take<E1, B>>());
        yield* _(sa.channel.concatMap(Channel.writeChunk).pipeTo(interleaveWithProducer(left)).runManaged.fork);
        yield* _(sb.channel.concatMap(Channel.writeChunk).pipeTo(interleaveWithProducer(right)).runManaged.fork);
        return tuple(left, right);
      }),
      ([left, right]) => {
        const process = (
          leftDone: boolean,
          rightDone: boolean,
        ): Channel<R & R1 & R2, E | E1 | E2, boolean, unknown, E | E1 | E2, Conc<A | B>, void> =>
          Channel.readWithCause(
            (b: boolean) => {
              if (b && !leftDone) {
                return Channel.fromIO(left.take).chain((take) =>
                  take.match(rightDone ? Channel.unit : process(true, rightDone), Channel.failCauseNow, (chunk) =>
                    Channel.writeNow(chunk).apSecond(process(leftDone, rightDone)),
                  ),
                );
              }
              if (!b && !rightDone) {
                return Channel.fromIO(right.take).chain((take) =>
                  take.match(leftDone ? Channel.unit : process(leftDone, true), Channel.failCauseNow, (chunk) =>
                    Channel.writeNow(chunk).apSecond(process(leftDone, rightDone)),
                  ),
                );
              }
              return process(leftDone, rightDone);
            },
            Channel.failCauseNow,
            () => Channel.unit,
          );
        return b.channel.concatMap(Channel.writeChunk).pipeTo(process(false, false));
      },
    ),
  );
}

function intersperseWriter<R, E, A, A1>(middle: A1, isFirst: boolean): Channel<R, E, Conc<A>, unknown, E, Conc<A | A1>, void> {
  return Channel.readWith(
    (inp: Conc<A>) => {
      const builder  = Conc.builder<A | A1>();
      let flagResult = isFirst;
      inp.forEach((a) => {
        if (flagResult) {
          flagResult = false;
          builder.append(a);
        } else {
          builder.append(middle);
          builder.append(a);
        }
      });
      return Channel.writeNow(builder.result()).apSecond(intersperseWriter(middle, flagResult));
    },
    Channel.failNow,
    () => Channel.unit,
  );
}

/**
 * Intersperse stream with provided element
 */
export function intersperse_<R, E, A, A1>(stream: Stream<R, E, A>, middle: A1): Stream<R, E, A | A1> {
  return new Stream(stream.channel.pipeTo(intersperseWriter(middle, true)));
}

/**
 * Interrupts the evaluation of this stream when the provided IO completes. The given
 * IO will be forked as part of this stream, and its success will be discarded. This
 * combinator will also interrupt any in-progress element being pulled from upstream.
 *
 * If the IO completes with a failure before the stream completes, the returned stream
 * will emit that failure.
 *
 * @tsplus fluent fncts.control.Stream interruptWhen
 */
export function interruptWhen_<R, E, A, R1, E1>(stream: Stream<R, E, A>, io: IO<R1, E1, any>): Stream<R & R1, E | E1, A> {
  return new Stream(stream.channel.interruptWhen(io));
}

/**
 * @tsplus fluent fncts.control.Stream interruptWhen
 */
export function interruptWhenFuture_<R, E, A, E1>(fa: Stream<R, E, A>, future: Future<E1, unknown>): Stream<R, E | E1, A> {
  return new Stream(fa.channel.interruptWhen(future));
}

/**
 * Loops over the stream chunks concatenating the result of f
 *
 * @tsplus fluent fncts.control.Stream loopOnChunks
 */
export function loopOnChunks_<R, E, A, R1, E1, A1>(
  stream: Stream<R, E, A>,
  f: (a: Conc<A>) => Channel<R1, E | E1, Conc<A>, unknown, E | E1, Conc<A1>, boolean>,
): Stream<R & R1, E | E1, A1> {
  const loop: Channel<R1, E | E1, Conc<A>, unknown, E | E1, Conc<A1>, boolean> = Channel.readWithCause(
    (chunk) => f(chunk).chain((cont) => (cont ? loop : Channel.endNow(false))),
    Channel.failCauseNow,
    (_) => Channel.succeedNow(false),
  );
  return new Stream(stream.channel.pipeTo(loop));
}

/**
 * Loops on chunks emitting partially
 *
 * @tsplus fluent fncts.control.Stream loopOnPartialChunks
 */
export function loopOnPartialChunks_<R, E, A, R1, E1, A1>(
  stream: Stream<R, E, A>,
  f: (a: Conc<A>, emit: (a: A1) => UIO<void>) => IO<R1, E1, boolean>,
): Stream<R & R1, E | E1, A1> {
  return stream.loopOnChunks((chunk) =>
    Channel.unwrap(
      IO.defer(() => {
        let outputChunk = Conc.empty<A1>();
        return f(chunk, (a) =>
          IO.succeed(() => {
            outputChunk = outputChunk.append(a);
          }),
        )
          .map((cont) => Channel.write(outputChunk).apSecond(Channel.endNow(cont)))
          .catchAll((failure) =>
            IO.succeed(() => {
              if (outputChunk.isEmpty) {
                return Channel.failNow(failure);
              } else {
                return Channel.writeNow(outputChunk).apSecond(Channel.failNow(failure));
              }
            }),
          );
      }),
    ),
  );
}

/**
 * Loops on chunks elements emitting partially
 *
 * @tsplus fluent fncts.control.Stream loopOnPartialChunksElements
 */
export function loopOnPartialChunksElements_<R, E, A, R1, E1, A1>(
  stream: Stream<R, E, A>,
  f: (a: A, emit: (a: A1) => UIO<void>) => IO<R1, E1, void>,
): Stream<R & R1, E | E1, A1> {
  return stream.loopOnPartialChunks((as, emit) => as.mapIO((a) => f(a, emit)).as(true));
}

/**
 * Transforms the elements of this stream using the supplied function.
 *
 * @tsplus fluent fncts.control.Stream map
 */
export function map_<R, E, A, B>(stream: Stream<R, E, A>, f: (o: A) => B): Stream<R, E, B> {
  return new Stream(stream.channel.mapOut((as) => as.map(f)));
}

function mapAccumAccumulator<S, E = never, A = never, B = never>(
  currS: S,
  f: (s: S, a: A) => readonly [B, S],
): Channel<unknown, E, Conc<A>, unknown, E, Conc<B>, void> {
  return Channel.readWith(
    (inp: Conc<A>) => {
      const [bs, nextS] = inp.mapAccum(currS, f);
      return Channel.writeNow(bs).apSecond(mapAccumAccumulator(nextS, f));
    },
    Channel.failNow,
    () => Channel.unit,
  );
}

/**
 * Statefully maps over the elements of this stream to produce new elements.
 *
 * @tsplus fluent fncts.control.Stream mapAccum
 */
export function mapAccum_<R, E, A, S, B>(stream: Stream<R, E, A>, s: S, f: (s: S, a: A) => readonly [B, S]): Stream<R, E, B> {
  return new Stream(stream.channel.pipeTo(mapAccumAccumulator(s, f)));
}

function mapAccumIOAccumulator<R, E, A, R1, E1, S, B>(
  s: S,
  f: (s: S, a: A) => IO<R1, E1, readonly [B, S]>,
): Channel<R & R1, E, Conc<A>, unknown, E | E1, Conc<B>, void> {
  return Channel.readWith(
    (inp: Conc<A>) =>
      Channel.unwrap(
        IO.defer(() => {
          const outputChunk = Conc.builder<B>();
          const emit        = (b: B) =>
            IO.succeed(() => {
              outputChunk.append(b);
            });
          return IO.foldLeft(inp, s, (s1, a) => f(s1, a).chain(([b, s2]) => emit(b).as(s2))).match(
            (e) => {
              const partialResult = outputChunk.result();
              return partialResult.isNonEmpty ? Channel.writeNow(partialResult).apSecond(Channel.failNow(e)) : Channel.failNow(e);
            },
            (s) => Channel.writeNow(outputChunk.result()).apSecond(mapAccumIOAccumulator(s, f)),
          );
        }),
      ),
    Channel.failNow,
    () => Channel.unit,
  );
}

/**
 * Statefully and effectfully maps over the elements of this stream to produce
 * new elements.
 *
 * @tsplus fluent fncts.control.Stream mapAccumIO
 */
export function mapAccumIO_<R, E, A, R1, E1, S, B>(
  stream: Stream<R, E, A>,
  s: S,
  f: (s: S, a: A) => IO<R1, E1, readonly [B, S]>,
): Stream<R & R1, E | E1, B> {
  return new Stream(stream.channel.pipeTo(mapAccumIOAccumulator(s, f)));
}

/**
 * Transforms the chunks emitted by this stream.
 *
 * @tsplus fluent fncts.control.Stream mapChunks
 */
export function mapChunks_<R, E, A, A1>(stream: Stream<R, E, A>, f: (chunk: Conc<A>) => Conc<A1>): Stream<R, E, A1> {
  return new Stream(stream.channel.mapOut(f));
}

/**
 * Effectfully transforms the chunks emitted by this stream.
 *
 * @tsplus fluent fncts.control.Stream mapChunksIO
 */
export function mapChunksIO_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  f: (chunk: Conc<A>) => IO<R1, E1, Conc<B>>,
): Stream<R & R1, E | E1, B> {
  return new Stream(stream.channel.mapOutIO(f));
}

/**
 * Maps each element to an iterable, and flattens the iterables into the
 * output of this stream.
 *
 * @tsplus fluent fncts.control.Stream mapConcat
 */
export function mapConcat_<R, E, A, B>(stream: Stream<R, E, A>, f: (a: A) => Iterable<B>): Stream<R, E, B> {
  return stream.mapConcatChunk((a) => Conc.from(f(a)));
}

/**
 * Maps each element to a chunk, and flattens the chunks into the output of
 * this stream.
 *
 * @tsplus fluent fncts.control.Stream mapConcatChunk
 */
export function mapConcatChunk_<R, E, A, B>(stream: Stream<R, E, A>, f: (a: A) => Conc<B>): Stream<R, E, B> {
  return stream.mapChunks((c) => c.chain(f));
}

/**
 * Effectfully maps each element to a chunk, and flattens the chunks into
 * the output of this stream.
 *
 * @tsplus fluent fncts.control.Stream mapConcatChunkIO
 */
export function mapConcatChunkIO_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, Conc<B>>,
): Stream<R & R1, E | E1, B> {
  return stream.mapIO(f).mapConcatChunk(identity);
}

/**
 * Effectfully maps each element to an iterable, and flattens the iterables into
 * the output of this stream.
 *
 * @tsplus fluent fncts.control.Stream mapConcatIO
 */
export function mapConcatIO_<R, E, A, R1, E1, B>(stream: Stream<R, E, A>, f: (a: A) => IO<R1, E1, Iterable<B>>): Stream<R & R1, E | E1, B> {
  return stream.mapIO((a) => f(a).map(Conc.from)).mapConcatChunk(identity);
}

/**
 * Transforms the errors emitted by this stream using `f`.
 *
 * @tsplus fluent fncts.control.Stream mapError
 */
export function mapError_<R, E, E1, A>(stream: Stream<R, E, A>, f: (e: E) => E1): Stream<R, E1, A> {
  return new Stream(stream.channel.mapError(f));
}

/**
 * Transforms the full causes of failures emitted by this stream.
 *
 * @tsplus fluent fncts.control.Stream mapErrorCause
 */
export function mapErrorCause_<R, E, A, E1>(fa: Stream<R, E, A>, f: (e: Cause<E>) => Cause<E1>): Stream<R, E1, A> {
  return new Stream(fa.channel.mapErrorCause(f));
}

/**
 * Maps over elements of the stream with the specified effectful function.
 *
 * @tsplus fluent fncts.control.Stream mapIO
 */
export function mapIO_<R, E, A, R1, E1, B>(stream: Stream<R, E, A>, f: (a: A) => IO<R1, E1, B>): Stream<R & R1, E | E1, B> {
  return stream.loopOnPartialChunksElements((a, emit) => f(a).chain(emit));
}

/**
 * Maps over elements of the stream with the specified effectful function,
 * executing up to `n` invocations of `f` concurrently. Transformed elements
 * will be emitted in the original order.
 *
 * @note This combinator destroys the chunking structure. It's recommended to use chunkN afterwards.
 *
 * @tsplus fluent fncts.control.Stream mapIOC
 */
export function mapIOC_<R, E, A, R1, E1, B>(stream: Stream<R, E, A>, n: number, f: (a: A) => IO<R1, E1, B>): Stream<R & R1, E | E1, B> {
  return new Stream(stream.channel.concatMap(Channel.writeChunk).mapOutIOC(n, f).mapOut(Conc.single));
}

/**
 * Maps each element of this stream to another stream and returns the
 * non-deterministic merge of those streams, executing up to `n` inner streams
 * concurrently. Up to `bufferSize` elements of the produced streams may be
 * buffered in memory by this operator.
 *
 * @tsplus fluent fncts.control.Stream mergeMap
 */
export function mergeMap_<R, E, A, R1, E1, B>(
  ma: Stream<R, E, A>,
  f: (a: A) => Stream<R1, E1, B>,
  n: number,
  bufferSize = 16,
): Stream<R & R1, E | E1, B> {
  return new Stream(ma.channel.concatMap(Channel.writeChunk).mergeMap((a) => f(a).channel, n, bufferSize));
}

/**
 * Maps over elements of the stream with the specified effectful function,
 * executing up to `n` invocations of `f` concurrently. The element order
 * is not enforced by this combinator, and elements may be reordered.
 *
 * @tsplus fluent fncts.control.Stream mergeMapIO
 */
export function mergeMapIO_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, B>,
  n: number,
  bufferSize = 16,
): Stream<R & R1, E | E1, B> {
  return stream.mergeMap((a) => Stream.fromIO(f(a)), n, bufferSize);
}

/**
 * @tsplus fluent fncts.control.Stream mergeEither
 */
export function mergeEither_<R, E, A, R1, E1, B>(fa: Stream<R, E, A>, fb: Stream<R1, E1, B>): Stream<R & R1, E | E1, Either<A, B>> {
  return fa.mergeWith(fb, Either.left, Either.right);
}

export function mergeWithHandler<R, E>(terminate: boolean): (exit: Exit<E, unknown>) => MergeDecision<R, E, unknown, E, unknown> {
  return (exit) => (terminate || !exit.isSuccess() ? MergeDecision.Done(IO.fromExitNow(exit)) : MergeDecision.Await(IO.fromExitNow));
}

export type TerminationStrategy = "Left" | "Right" | "Both" | "Either";

/**
 * @tsplus fluent fncts.control.Stream mergeWith
 */
export function mergeWith_<R, E, A, R1, E1, A1, B, C>(
  sa: Stream<R, E, A>,
  sb: Stream<R1, E1, A1>,
  l: (a: A) => B,
  r: (b: A1) => C,
  strategy: TerminationStrategy = "Both",
): Stream<R & R1, E | E1, B | C> {
  return new Stream<R & R1, E | E1, B | C>(
    sa
      .map(l)
      .channel.mergeWith(
        map_(sb, r).channel,
        mergeWithHandler<R & R1, E | E1>(strategy === "Either" || strategy === "Left"),
        mergeWithHandler<R & R1, E | E1>(strategy === "Either" || strategy === "Right"),
      ),
  );
}

/**
 * Runs the specified effect if this stream fails, providing the error to the effect if it exists.
 *
 * Note: Unlike `IO.onError`, there is no guarantee that the provided effect will not be interrupted.
 *
 * @tsplus fluent fncts.control.Stream onError
 */
export function onError_<R, E, A, R1>(stream: Stream<R, E, A>, cleanup: (e: Cause<E>) => IO<R1, never, any>): Stream<R & R1, E, A> {
  return stream.catchAllCause((cause) => fromIO(cleanup(cause).apSecond(IO.failCauseNow(cause))));
}

/**
 * Switches to the provided stream in case this one fails with a typed error.
 *
 * See also Stream#catchAll
 *
 * @tsplus fluent fncts.control.Stream orElse
 */
export function orElse_<R, E, A, R1, E1, A1>(stream: Stream<R, E, A>, that: Lazy<Stream<R1, E1, A1>>): Stream<R & R1, E1, A | A1> {
  return new Stream<R & R1, E1, A | A1>(stream.channel.orElse(that().channel));
}

/**
 * Switches to the provided stream in case this one fails with a typed error.
 *
 * See also ZStream#catchAll
 *
 * @tsplus fluent fncts.control.Stream orElseEither
 */
export function orElseEither_<R, E, A, R1, E1, A1>(
  stream: Stream<R, E, A>,
  that: Lazy<Stream<R1, E1, A1>>,
): Stream<R & R1, E1, Either<A, A1>> {
  return stream.map(Either.left).orElse(that().map(Either.right));
}

/**
 * Fails with given error in case this one fails with a typed error.
 *
 * See also Stream#catchAll
 *
 * @tsplus fluent fncts.control.Stream orElseFail
 */
export function orElseFail_<R, E, A, E1>(stream: Stream<R, E, A>, e: Lazy<E1>): Stream<R, E1, A> {
  return stream.orElse(Stream.failNow(e()));
}

/**
 * Switches to the provided stream in case this one fails with the `None` value.
 *
 * See also Stream#catchAll.
 */
export function orElseOptional_<R, E, A, R1, E1, A1>(
  stream: Stream<R, Maybe<E>, A>,
  that: Lazy<Stream<R1, Maybe<E1>, A1>>,
): Stream<R & R1, Maybe<E | E1>, A | A1> {
  return stream.catchAll((maybeError) =>
    maybeError.match(
      () => that(),
      (e) => Stream.failNow(Just(e)),
    ),
  );
}

/**
 * Succeeds with the specified value if this one fails with a typed error.
 *
 * @tsplus fluent fncts.control.Stream orElseSucceed
 */
export function orElseSucceed_<R, E, A, A1>(stream: Stream<R, E, A>, a: Lazy<A1>): Stream<R, never, A | A1> {
  return stream.orElse(Stream.succeedNow(a()));
}

/**
 * @tsplus fluent fncts.control.Stream pipeThrough
 */
export function pipeThrough_<R, E, A, R1, E1, L, Z>(ma: Stream<R, E, A>, sa: Sink<R1, E1, A, L, Z>): Stream<R & R1, E | E1, L> {
  return new Stream(ma.channel.pipeToOrFail(sa.channel));
}

/**
 * Provides the stream with its required environment, which eliminates
 * its dependency on `R`.
 *
 * @tsplus fluent fncts.control.Stream provideEnvironment
 */
export function provideEnvironment_<R, E, A>(ra: Stream<R, E, A>, r: R): Stream<unknown, E, A> {
  return new Stream(ra.channel.provideEnvironment(r));
}

class Rechunker<A> {
  private builder: Array<A> = [];
  private pos               = 0;

  constructor(readonly n: number) {}

  write(elem: A) {
    this.builder.push(elem);
    this.pos += 1;

    if (this.pos === this.n) {
      const result = this.builder;
      this.builder = [];
      this.pos     = 0;

      return Conc.from(result);
    }

    return null;
  }

  emitOfNotEmpty(): Channel<unknown, unknown, unknown, unknown, never, Conc<A>, void> {
    if (this.pos !== 0) {
      return Channel.writeNow(Conc.from(this.builder));
    } else {
      return Channel.unit;
    }
  }

  get isEmpty(): boolean {
    return this.pos === 0;
  }
  /* eslint-enable */
}

function rechunkProcess<E, In>(rechunker: Rechunker<In>, target: number): Channel<unknown, E, Conc<In>, unknown, E, Conc<In>, unknown> {
  return Channel.readWithCause(
    (chunk: Conc<In>) => {
      if (chunk.length === target && rechunker.isEmpty) {
        return Channel.writeNow(chunk).apSecond(rechunkProcess<E, In>(rechunker, target));
      } else if (chunk.length > 0) {
        const chunks: Array<Conc<In>> = [];
        let result: Conc<In> | null   = null;
        let i = 0;
        while (i < chunk.length) {
          while (i < chunk.length && result === null) {
            result = rechunker.write(chunk.unsafeGet(i));
            i     += 1;
          }
          if (result !== null) {
            chunks.push(result);
            result = null;
          }
        }

        return Channel.writeAll(chunks).apSecond(rechunkProcess<E, In>(rechunker, target));
      } else {
        return rechunkProcess<E, In>(rechunker, target);
      }
    },
    (cause) => rechunker.emitOfNotEmpty().apSecond(Channel.failCauseNow(cause)),
    () => rechunker.emitOfNotEmpty(),
  );
}

/**
 * Re-chunks the elements of the stream into chunks of
 * `n` elements each.
 * The last chunk might contain less than `n` elements
 *
 * @tsplus fluent fncts.control.Stream rechunk
 */
export function rechunk_<R, E, A>(stream: Stream<R, E, A>, n: number): Stream<R, E, A> {
  return new Stream(stream.channel.pipeTo(rechunkProcess(new Rechunker(n), n)));
}

/**
 * Repeats the provided value infinitely.
 *
 * @tsplus static fncts.control.StreamOps repeatValue
 */
export function repeatValue<A>(a: A): Stream<unknown, never, A> {
  return new Stream(Channel.writeNow(Conc.single(a)).repeated);
}

/**
 * Creates a stream from an effect producing a value of type `A` which repeats forever.
 *
 * @tsplus static fncts.control.StreamOps repeatIO
 */
export function repeatIO<R, E, A>(fa: IO<R, E, A>): Stream<R, E, A> {
  return Stream.repeatIOMaybe(fa.mapError(Maybe.just));
}

/**
 * Creates a stream from an effect producing values of type `A` until it fails with None.
 *
 * @tsplus static fncts.control.StreamOps repeatIOMaybe
 */
export function repeatIOMaybe<R, E, A>(fa: IO<R, Maybe<E>, A>): Stream<R, E, A> {
  return repeatIOChunkMaybe(fa.map(Conc.single));
}

/**
 * Creates a stream from an effect producing chunks of `A` values which repeats forever.
 *
 * @tsplus static fncts.control.StreamOps repeatIOChunk
 */
export function repeatIOChunk<R, E, A>(fa: IO<R, E, Conc<A>>): Stream<R, E, A> {
  return repeatIOChunkMaybe(fa.mapError(Maybe.just));
}

/**
 * Creates a stream from an effect producing chunks of `A` values until it fails with None.
 *
 * @tsplus static fncts.control.StreamOps repeatIOChunkMaybe
 */
export function repeatIOChunkMaybe<R, E, A>(fa: IO<R, Maybe<E>, Conc<A>>): Stream<R, E, A> {
  return Stream.unfoldChunkIO(undefined, (_) =>
    fa
      .map((chunk) => Maybe.just(tuple(chunk, undefined)))
      .catchAll((maybeError) => maybeError.match(() => IO.succeedNow(Nothing()), IO.failNow)),
  );
}

/**
 * Runs the sink on the stream to produce either the sink's result or an error.
 *
 * @tsplus fluent fncts.control.Stream run
 */
export function run_<R, E, A, R2, E2, Z>(stream: Stream<R, E, A>, sink: Sink<R2, E2, A, unknown, Z>): IO<R & R2, E | E2, Z> {
  return stream.channel.pipeToOrFail(sink.channel).runDrain;
}

/**
 * Runs the stream and collects all of its elements to a chunk.
 *
 * @tsplus getter fncts.control.Stream runCollect
 */
export function runCollect<R, E, A>(stream: Stream<R, E, A>): IO<R, E, Conc<A>> {
  return stream.run(Sink.collectAll());
}

/**
 * Runs the stream and collects ignore its elements.
 *
 * @tsplus getter fncts.control.Stream runDrain
 */
export function runDrain<R, E, A>(stream: Stream<R, E, A>): IO<R, E, void> {
  return stream.run(Sink.drain);
}

/**
 * @tsplus fluent fncts.control.Stream runForeachManaged
 */
export function runForeachManaged_<R, E, A, R2, E2>(self: Stream<R, E, A>, f: (a: A) => IO<R2, E2, any>): Managed<R & R2, E | E2, void> {
  return self.runManaged(Sink.foreach(f));
}

/**
 * Like `into`, but provides the result as a `Managed` to allow for scope
 * composition.
 *
 * @tsplus fluent fncts.control.Stream runIntoElementsManaged
 */
export function runIntoElementsManaged_<R, E, A, R1, E1>(
  stream: Stream<R, E, A>,
  queue: PQueue<R1, unknown, never, never, Exit<Maybe<E | E1>, A>, unknown>,
): Managed<R & R1, E | E1, void> {
  const writer: Channel<R & R1, E, Conc<A>, unknown, never, Exit<Maybe<E | E1>, A>, unknown> = Channel.readWith(
    (inp: Conc<A>) =>
      inp
        .foldLeft(Channel.unit as Channel<R1, unknown, unknown, unknown, never, Exit<Maybe<E | E1>, A>, unknown>, (channel, a) =>
          channel.apSecond(Channel.writeNow(Exit.succeed(a))),
        )
        .apSecond(writer),
    (err) => Channel.writeNow(Exit.fail(Just(err))),
    () => Channel.writeNow(Exit.fail(Nothing())),
  );
  return stream.channel.pipeTo(writer).mapOutIO((exit) => queue.offer(exit)).drain.runManaged.asUnit;
}

/**
 * Like `Stream#into`, but provides the result as a `Managed` to allow for scope
 * composition.
 *
 * @tsplus fluent fncts.control.Stream runIntoManaged
 */
export function runIntoManaged_<R, R1, E extends E1, E1, A>(
  stream: Stream<R, E, A>,
  queue: PQueue<R1, never, never, unknown, Take<E1, A>, any>,
): Managed<R & R1, E | E1, void> {
  const writer: Channel<R, E, Conc<A>, unknown, E, Take<E | E1, A>, any> = Channel.readWithCause(
    (inp) => Channel.writeNow(Take.chunk(inp)).apSecond(writer),
    (cause) => Channel.writeNow(Take.failCause(cause)),
    (_) => Channel.writeNow(Take.end),
  );

  return stream.channel.pipeTo(writer).mapOutIO((take) => queue.offer(take)).drain.runManaged.asUnit;
}

/**
 * Like `Stream#runIntoHub`, but provides the result as a `Managed` to allow for scope
 * composition.
 *
 * @tsplus fluent fncts.control.Stream runIntoHubManaged
 */
export function runIntoHubManaged_<R, R1, E extends E1, E1, A>(
  stream: Stream<R, E, A>,
  hub: PHub<R1, never, never, unknown, Take<E1, A>, any>,
): Managed<R & R1, E | E1, void> {
  return stream.runIntoManaged(hub.toQueue);
}

/**
 * Runs the sink on the stream to produce either the sink's result or an error.
 *
 * @tsplus fluent fncts.control.Stream runManaged
 */
export function runManaged_<R, E, A, R2, E2, Z>(stream: Stream<R, E, A>, sink: Sink<R2, E2, A, unknown, Z>): Managed<R & R2, E | E2, Z> {
  return stream.channel.pipeToOrFail(sink.channel).drain.runManaged;
}

/**
 * Statefully maps over the elements of this stream to produce all intermediate results
 * of type `B` given an initial B.
 *
 * @tsplus fluent fncts.control.Stream scan
 */
export function scan_<R, E, A, B>(sa: Stream<R, E, A>, b: B, f: (b: B, a: A) => B): Stream<R, E, B> {
  return sa.scanIO(b, (b, a) => IO.succeedNow(f(b, a)));
}

/**
 * Statefully and effectfully maps over the elements of this stream to produce all
 * intermediate results of type `B` given an initial B.
 *
 * @tsplus fluent fncts.control.Stream scanIO
 */
export function scanIO_<R, E, A, R1, E1, B>(sa: Stream<R, E, A>, b: B, f: (b: B, a: A) => IO<R1, E1, B>): Stream<R & R1, E | E1, B> {
  return Stream.succeedNow(b).concat(sa.mapAccumIO(b, (b, a) => f(b, a).map((b) => [b, b])));
}

/**
 * Statefully maps over the elements of this stream to produce all
 * intermediate results.
 *
 * @tsplus fluent fncts.control.Stream scanReduce
 */
export function scanReduce_<R, E, A extends B, B>(fa: Stream<R, E, A>, f: (b: B, a: A) => B): Stream<R, E, B> {
  return fa.scanReduceIO((b, a) => IO.succeedNow(f(b, a)));
}

/**
 * Statefully and effectfully maps over the elements of this stream to produce
 * all intermediate results.
 *
 * @tsplus fluent fncts.control.Stream scanReduceIO
 */
export function scanReduceIO_<R, E, A extends B, R1, E1, B>(
  fa: Stream<R, E, A>,
  f: (b: B, a: A) => IO<R1, E1, B>,
): Stream<R & R1, E | E1, B> {
  return fa.mapAccumIO(Nothing<B>(), (s, a) =>
    s.match(
      () => IO.succeedNow([a, Just(a)]),
      (b) => f(b, a).map((b) => [b, Just(b)]),
    ),
  );
}

/**
 * Creates a single-valued pure stream
 *
 * @tsplus static fncts.control.StreamOps succeedNow
 */
export function succeedNow<O>(o: O): Stream<unknown, never, O> {
  return fromChunkNow(Conc.single(o));
}

/**
 * Creates a single-valued pure stream
 *
 * @tsplus static fncts.control.StreamOps succeed
 */
export function succeed<A>(a: Lazy<A>): Stream<unknown, never, A> {
  return fromChunk(Conc.single(a()));
}

function takeLoop<E, A>(n: number): Channel<unknown, E, Conc<A>, unknown, E, Conc<A>, unknown> {
  return Channel.readWithCause(
    (inp) => {
      const taken = inp.take(n);
      const left  = Math.max(n - taken.length, 0);
      if (left > 0) {
        return Channel.writeNow(taken).apSecond(takeLoop(left));
      } else {
        return Channel.writeNow(taken);
      }
    },
    Channel.failCauseNow,
    Channel.endNow,
  );
}

/**
 * Takes the specified number of elements from this stream.
 *
 * @tsplus fluent fncts.control.Stream take
 */
export function take_<R, E, A>(stream: Stream<R, E, A>, n: number): Stream<R, E, A> {
  if (n <= 0) {
    return empty;
  }
  if (!Number.isInteger(n)) {
    return halt(new IllegalArgumentError(`${n} should be an integer`, "Stream.take"));
  }
  return new Stream(stream.channel.pipeTo(takeLoop(n)));
}

/**
 * @tsplus fluent fncts.control.Stream takeUntilIO
 */
export function takeUntilIO_<R, E, A, R1, E1>(ma: Stream<R, E, A>, f: (a: A) => IO<R1, E1, boolean>): Stream<R & R1, E | E1, A> {
  return ma.loopOnPartialChunks((chunk, emit) =>
    chunk.takeWhileIO((v) => emit(v).apSecond(f(v).map((b) => !b))).map((taken) => taken.drop(taken.length).take(1).isEmpty),
  );
}

function takeUntilLoop<R, E, A>(p: Predicate<A>): Channel<R, E, Conc<A>, unknown, E, Conc<A>, unknown> {
  return Channel.readWith(
    (chunk: Conc<A>) => {
      const taken = chunk.takeWhile(p.invert);
      const last  = chunk.drop(taken.length).take(1);
      if (last.isEmpty) {
        return Channel.writeNow(taken).apSecond(takeUntilLoop<R, E, A>(p));
      } else {
        return Channel.writeNow(taken.concat(last));
      }
    },
    Channel.failNow,
    Channel.succeedNow,
  );
}

/**
 * Takes all elements of the stream until the specified predicate evaluates
 * to `true`.
 *
 * @tsplus fluent fncts.control.Stream takeUntil
 */
export function takeUntil_<R, E, A>(fa: Stream<R, E, A>, p: Predicate<A>): Stream<R, E, A> {
  return new Stream(fa.channel.pipeTo(takeUntilLoop(p)));
}

/**
 * @tsplus fluent fncts.control.Stream tap
 */
export function tap_<R, E, A, R1, E1>(ma: Stream<R, E, A>, f: (a: A) => IO<R1, E1, any>): Stream<R & R1, E | E1, A> {
  return ma.mapIO((a) => f(a).as(a));
}

/**
 * Throttles the chunks of this stream according to the given bandwidth parameters using the token bucket
 * algorithm. Allows for burst in the processing of elements by allowing the token bucket to accumulate
 * tokens up to a `units + burst` threshold. Chunks that do not meet the bandwidth constraints are dropped.
 * The weight of each chunk is determined by the `costFn` function.
 *
 * @tsplus fluent fncts.control.Stream throttleEnforce
 */
export function throttleEnforce_<R, E, A>(
  sa: Stream<R, E, A>,
  costFn: (chunk: Conc<A>) => number,
  units: number,
  duration: number,
  burst = 0,
): Stream<R & Has<Clock>, E, A> {
  return sa.throttleEnforceIO((chunk) => IO.succeedNow(costFn(chunk)), units, duration, burst);
}

function throttleEnforceIOLoop<E, A, R1, E1>(
  costFn: (chunk: Conc<A>) => IO<R1, E1, number>,
  units: number,
  duration: number,
  burst: number,
  tokens: number,
  timestamp: number,
): Channel<R1 & Has<Clock>, E | E1, Conc<A>, unknown, E | E1, Conc<A>, void> {
  return Channel.readWith(
    (inp: Conc<A>) =>
      Channel.unwrap(
        costFn(inp).zipWith(Clock.currentTime, (weight, current) => {
          const elapsed   = current - timestamp;
          const cycles    = elapsed / duration;
          const available = (() => {
            const sum = tokens + cycles * units;
            const max = units + burst < 0 ? Number.MAX_SAFE_INTEGER : units + burst;

            return sum < 0 ? max : Math.min(sum, max);
          })();

          return weight <= available
            ? Channel.writeNow(inp).apSecond(throttleEnforceIOLoop(costFn, units, duration, burst, available - weight, current))
            : throttleEnforceIOLoop(costFn, units, duration, burst, available - weight, current);
        }),
      ),
    Channel.failNow,
    () => Channel.unit,
  );
}

/**
 * Throttles the chunks of this stream according to the given bandwidth parameters using the token bucket
 * algorithm. Allows for burst in the processing of elements by allowing the token bucket to accumulate
 * tokens up to a `units + burst` threshold. Chunks that do not meet the bandwidth constraints are dropped.
 * The weight of each chunk is determined by the `costFn` effectful function.
 *
 * @tsplus fluent fncts.control.Stream throttleEnforceIO
 */
export function throttleEnforceIO_<R, E, A, R1, E1>(
  sa: Stream<R, E, A>,
  costFn: (chunk: Conc<A>) => IO<R1, E1, number>,
  units: number,
  duration: number,
  burst = 0,
): Stream<R & R1 & Has<Clock>, E | E1, A> {
  return new Stream(
    Channel.fromIO(Clock.currentTime).chain((current) =>
      sa.channel.pipeTo(throttleEnforceIOLoop(costFn, units, duration, burst, units, current)),
    ),
  );
}

/**
 * Converts the stream to a managed hub of chunks. After the managed hub is used,
 * the hub will never again produce values and should be discarded.
 *
 * @tsplus fluent fncts.control.Stream toHub
 */
export function toHub_<R, E, A>(stream: Stream<R, E, A>, capacity: number): Managed<R, never, Hub<Take<E, A>>> {
  return Managed.gen(function* (_) {
    const hub = yield* _(Managed.bracket(Hub.makeBounded<Take<E, A>>(capacity), (_) => _.shutdown));
    yield* _(stream.runIntoHubManaged(hub).fork);
    return hub;
  });
}

/**
 * Interpret the stream as a managed pull
 *
 * @tsplus getter fncts.control.Stream toPull
 */
export function toPull<R, E, A>(stream: Stream<R, E, A>): Managed<R, never, IO<R, Maybe<E>, Conc<A>>> {
  return stream.channel.toPull.map((io) => io.mapError(Maybe.just).chain((r) => r.match(() => IO.failNow(Nothing()), IO.succeedNow)));
}

/**
 * Converts the stream to a managed queue of chunks. After the managed queue is used,
 * the queue will never again produce values and should be discarded.
 *
 * @tsplus fluent fncts.control.Stream toQueue
 */
export function toQueue_<R, E, A>(stream: Stream<R, E, A>, capacity = 2): Managed<R, never, Queue<Take<E, A>>> {
  return Managed.gen(function* (_) {
    const queue = yield* _(Managed.bracket(Queue.makeBounded<Take<E, A>>(capacity), (_) => _.shutdown));
    yield* _(stream.runIntoManaged(queue).fork);
    return queue;
  });
}

/**
 * @tsplus fluent fncts.control.Stream toQueueDropping
 */
export function toQueueDropping_<R, E, A>(stream: Stream<R, E, A>, capacity = 2): Managed<R, never, Queue.Dequeue<Take<E, A>>> {
  return Managed.gen(function* (_) {
    const queue = yield* _(Managed.bracket(Queue.makeDropping<Take<E, A>>(capacity), (_) => _.shutdown));
    yield* _(stream.runIntoManaged(queue).fork);
    return queue;
  });
}

/**
 * @tsplus fluent fncts.control.Stream toQueueOfElements
 */
export function toQueueOfElements_<R, E, A>(stream: Stream<R, E, A>, capacity = 2): Managed<R, never, Queue.Dequeue<Exit<Maybe<E>, A>>> {
  return Managed.gen(function* (_) {
    const queue = yield* _(Managed.bracket(Queue.makeBounded<Exit<Maybe<E>, A>>(capacity), (_) => _.shutdown));
    yield* _(stream.runIntoElementsManaged(queue).fork);
    return queue;
  });
}

/**
 * @tsplus fluent fncts.control.Stream toQueueSliding
 */
export function toQueueSliding_<R, E, A>(stream: Stream<R, E, A>, capacity = 2): Managed<R, never, Queue.Dequeue<Take<E, A>>> {
  return Managed.gen(function* (_) {
    const queue = yield* _(Managed.bracket(Queue.makeSliding<Take<E, A>>(capacity), (_) => _.shutdown));
    yield* _(stream.runIntoManaged(queue).fork);
    return queue;
  });
}

/**
 * Converts the stream into an unbounded managed queue. After the managed queue
 * is used, the queue will never again produce values and should be discarded.
 *
 * @tsplus getter fncts.control.Stream toQueueUnbounded
 */
export function toQueueUnbounded<R, E, A>(stream: Stream<R, E, A>): Managed<R, never, Queue<Take<E, A>>> {
  return Managed.gen(function* (_) {
    const queue = yield* _(Managed.bracket(Queue.makeUnbounded<Take<E, A>>(), (_) => _.shutdown));
    yield* _(stream.runIntoManaged(queue).fork);
    return queue;
  });
}

function unfoldChunkIOLoop<S, R, E, A>(
  s: S,
  f: (s: S) => IO<R, E, Maybe<readonly [Conc<A>, S]>>,
): Channel<R, unknown, unknown, unknown, E, Conc<A>, unknown> {
  return Channel.unwrap(
    f(s).map((m) =>
      m.match(
        () => Channel.unit,
        ([as, s]) => Channel.writeNow(as).chain(() => unfoldChunkIOLoop(s, f)),
      ),
    ),
  );
}

/**
 * Creates a stream by effectfully peeling off the "layers" of a value of type `S`
 *
 * @tsplus static fncts.control.StreamOps unfoldChunkIO
 */
export function unfoldChunkIO<R, E, A, S>(s: S, f: (s: S) => IO<R, E, Maybe<readonly [Conc<A>, S]>>): Stream<R, E, A> {
  return new Stream(unfoldChunkIOLoop(s, f));
}

/**
 * Creates a stream by effectfully peeling off the "layers" of a value of type `S`
 *
 * @tsplus static fncts.control.StreamOps unfoldIO
 */
export function unfoldIO<S, R, E, A>(s: S, f: (s: S) => IO<R, E, Maybe<readonly [A, S]>>): Stream<R, E, A> {
  return unfoldChunkIO(s, (_) => f(_).map((m) => m.map(([a, s]) => tuple(Conc.single(a), s))));
}

function unfoldChunkLoop<S, A>(
  s: S,
  f: (s: S) => Maybe<readonly [Conc<A>, S]>,
): Channel<unknown, unknown, unknown, unknown, never, Conc<A>, unknown> {
  return pipe(
    f(s).match(
      () => Channel.unit,
      ([as, s]) => pipe(Channel.writeNow(as).chain(() => unfoldChunkLoop(s, f))),
    ),
  );
}

/**
 * @tsplus static fncts.control.StreamOps unfoldChunk
 */
export function unfoldChunk<S, A>(s: S, f: (s: S) => Maybe<readonly [Conc<A>, S]>): Stream<unknown, never, A> {
  return new Stream(Channel.defer(unfoldChunkLoop(s, f)));
}

/**
 * @tsplus static fncts.control.StreamOps unfold
 */
export function unfold<S, A>(s: S, f: (s: S) => Maybe<readonly [A, S]>): Stream<unknown, never, A> {
  return Stream.unfoldChunk(s, (s) => f(s).map(([a, s]) => tuple(Conc.single(a), s)));
}

/**
 * Creates a stream produced from an IO
 *
 * @tsplus static fncts.control.StreamOps unwrap
 */
export function unwrap<R, E, R1, E1, A>(stream: IO<R, E, Stream<R1, E1, A>>): Stream<R & R1, E | E1, A> {
  return Stream.fromIO(stream).flatten;
}

/**
 * Creates a stream produced from a managed
 *
 * @tsplus static fncts.control.StreamOps unwrapManaged
 */
export function unwrapManaged<R0, E0, R, E, A>(stream: Managed<R0, E0, Stream<R, E, A>>): Stream<R0 & R, E0 | E, A> {
  return Stream.fromManaged(stream).flatten;
}

/**
 * @tsplus fluent fncts.control.Stream zipWith
 */
export function zipWith_<R, E, A, R1, E1, B, C>(
  self: Stream<R, E, A>,
  that: Stream<R1, E1, B>,
  f: (a: A, b: B) => C,
): Stream<R & R1, E | E1, C> {
  return self.zipWithChunks(that, (as, bs) => zipChunks_(as, bs, f));
}

class PullBoth {
  readonly _tag = "PullBoth";
}

class PullLeft<A2> {
  readonly _tag = "PullLeft";
  constructor(readonly rightChunk: Conc<A2>) {}
}

class PullRight<A1> {
  readonly _tag = "PullRight";
  constructor(readonly leftChunk: Conc<A1>) {}
}

type ZipWithChunksState<A1, A2> = PullBoth | PullLeft<A2> | PullRight<A1>;

function zipWithChunksPull<R, E, A1, R1, E1, A2, A3>(
  state: ZipWithChunksState<A1, A2>,
  pullLeft: IO<R, Maybe<E>, Conc<A1>>,
  pullRight: IO<R1, Maybe<E1>, Conc<A2>>,
  f: (as: Conc<A1>, bs: Conc<A2>) => readonly [Conc<A3>, Either<Conc<A1>, Conc<A2>>],
): IO<R & R1, never, Exit<Maybe<E | E1>, readonly [Conc<A3>, ZipWithChunksState<A1, A2>]>> {
  switch (state._tag) {
    case "PullBoth":
      return pullLeft.zipC(pullRight).matchIO(
        (err) => IO.succeedNow(Exit.fail(err)),
        ([leftChunk, rightChunk]) => {
          if (leftChunk.isEmpty && rightChunk.isEmpty) {
            return zipWithChunksPull(new PullBoth(), pullLeft, pullRight, f);
          } else if (leftChunk.isEmpty) {
            return zipWithChunksPull(new PullLeft(rightChunk), pullLeft, pullRight, f);
          } else if (rightChunk.isEmpty) {
            return zipWithChunksPull(new PullRight(leftChunk), pullLeft, pullRight, f);
          } else {
            return IO.succeedNow(Exit.succeed(handleZipWithChunksSuccess(leftChunk, rightChunk, f)));
          }
        },
      );
    case "PullLeft":
      return pullLeft.matchIO(
        (err) => IO.succeedNow(Exit.fail(err)),
        (leftChunk) => {
          if (leftChunk.isEmpty) {
            return zipWithChunksPull(new PullLeft(state.rightChunk), pullLeft, pullRight, f);
          } else if (state.rightChunk.isEmpty) {
            return zipWithChunksPull(new PullRight(leftChunk), pullLeft, pullRight, f);
          } else {
            return IO.succeedNow(Exit.succeed(handleZipWithChunksSuccess(leftChunk, state.rightChunk, f)));
          }
        },
      );
    case "PullRight":
      return pullRight.matchIO(
        (err) => IO.succeedNow(Exit.fail(err)),
        (rightChunk) => {
          if (rightChunk.isEmpty) {
            return zipWithChunksPull(new PullRight(state.leftChunk), pullLeft, pullRight, f);
          } else if (state.leftChunk.isEmpty) {
            return zipWithChunksPull(new PullLeft(rightChunk), pullLeft, pullRight, f);
          } else {
            return IO.succeedNow(Exit.succeed(handleZipWithChunksSuccess(state.leftChunk, rightChunk, f)));
          }
        },
      );
  }
}

function handleZipWithChunksSuccess<A1, A2, A3>(
  leftChunk: Conc<A1>,
  rightChunk: Conc<A2>,
  f: (as: Conc<A1>, bs: Conc<A2>) => readonly [Conc<A3>, Either<Conc<A1>, Conc<A2>>],
): readonly [Conc<A3>, ZipWithChunksState<A1, A2>] {
  const [out, remaining] = f(leftChunk, rightChunk);
  return remaining.match(
    (l) => (leftChunk.isEmpty ? [out, new PullBoth()] : [out, new PullRight(leftChunk)]),
    (r) => (rightChunk.isEmpty ? [out, new PullBoth()] : [out, new PullLeft(rightChunk)]),
  );
}

/**
 * @tsplus fluent fncts.control.Stream zipWithChunks
 */
export function zipWithChunks_<R, E, A, R1, E1, B, C>(
  self: Stream<R, E, A>,
  that: Stream<R1, E1, B>,
  f: (as: Conc<A>, bs: Conc<B>) => readonly [Conc<C>, Either<Conc<A>, Conc<B>>],
): Stream<R & R1, E | E1, C> {
  return self.combineChunks(that, <ZipWithChunksState<A, B>>new PullBoth(), (s, l, r) => zipWithChunksPull(s, l, r, f));
}

function zipChunks_<A, B, C>(fa: Conc<A>, fb: Conc<B>, f: (a: A, b: B) => C): readonly [Conc<C>, Either<Conc<A>, Conc<B>>] {
  let fc    = Conc.empty<C>();
  const len = Math.min(fa.length, fb.length);
  for (let i = 0; i < len; i++) {
    fc = fc.append(f(fa.unsafeGet(i), fb.unsafeGet(i)));
  }

  if (fa.length > fb.length) {
    return tuple(fc, Either.left(fa.drop(fb.length)));
  }

  return tuple(fc, Either.right(fb.drop(fa.length)));
}
