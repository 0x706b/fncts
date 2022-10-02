import type { Canceler } from "../IO.js";
import type { SinkEndReason } from "./internal/SinkEndReason.js";
import type { Erase } from "@fncts/typelevel/Intersection.js";

import { constVoid, identity, tuple } from "@fncts/base/data/function";

import { MergeDecision } from "../Channel/internal/MergeDecision.js";
import { Hub } from "../Hub.js";
import { Queue } from "../Queue.js";
import { DEFAULT_CHUNK_SIZE, Stream } from "./definition.js";
import { DebounceState } from "./internal/DebounceState.js";
import { Handoff, HandoffSignal } from "./internal/Handoff.js";
import { Pull } from "./internal/Pull.js";
import { SinkEndReasonTag } from "./internal/SinkEndReason.js";
import { ScheduleEnd, UpstreamEnd } from "./internal/SinkEndReason.js";
import { Take } from "./internal/Take.js";

/**
 * Submerges the error case of an `Either` into the `Stream`.
 *
 * @tsplus getter fncts.io.Stream absolve
 */
export function absolve<R, E, E2, A>(self: Stream<R, E, Either<E2, A>>, __tsplusTrace?: string): Stream<R, E | E2, A> {
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
 * @tsplus fluent fncts.io.Stream aggregateAsync
 */
export function aggregateAsync_<R, E, A extends A1, R1, E1, A1, B>(
  stream: Stream<R, E, A>,
  sink: Sink<R1, E1, A1, A1, B>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return stream.aggregateAsyncWithin(sink, Schedule.forever);
}

/**
 * Like `aggregateAsyncWithinEither`, but only returns the `Right` results.
 *
 * @tsplus fluent fncts.io.Stream aggregateAsyncWithin
 */
export function aggregateAsyncWithin_<R, E, A extends A1, R1, E1, A1, B, R2, C>(
  stream: Stream<R, E, A>,
  sink: Sink<R1, E1, A1, A1, B>,
  schedule: Schedule<R2, Maybe<B>, C>,
  __tsplusTrace?: string,
): Stream<R | R1 | R2, E | E1, B> {
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
 * @tsplus fluent fncts.io.Stream aggregateAsyncWithinEither
 */
export function aggregateAsyncWithinEither_<R, E, A extends A1, R1, E1, A1, B, R2, C>(
  stream: Stream<R, E, A>,
  sink: Sink<R1, E1, A1, A1, B>,
  schedule: Schedule<R2, Maybe<B>, C>,
  __tsplusTrace?: string,
): Stream<R | R1 | R2, E | E1, Either<C, B>> {
  type LocalHandoffSignal = HandoffSignal<E | E1, A1>;

  const deps = IO.sequenceT(
    Handoff<LocalHandoffSignal>(),
    Ref.make<SinkEndReason>(new ScheduleEnd()),
    Ref.make(Conc.empty<A1>()),
    schedule.driver,
    Ref.make(false),
  );

  return Stream.fromIO(deps).flatMap(([handoff, sinkEndReason, sinkLeftovers, scheduleDriver, consumed]) => {
    const handoffProducer: Channel<never, E | E1, Conc<A1>, unknown, never, never, any> = Channel.readWithCause(
      (_in: Conc<A1>) => Channel.fromIO(handoff.offer(HandoffSignal.Emit(_in))).apSecond(handoffProducer),
      (cause: Cause<E | E1>) => Channel.fromIO(handoff.offer(HandoffSignal.Halt(cause))),
      (_: any) => Channel.fromIO(handoff.offer(HandoffSignal.End(new UpstreamEnd()))),
    );

    const handoffConsumer: Channel<never, unknown, unknown, unknown, E | E1, Conc<A1>, void> = Channel.unwrap(
      sinkLeftovers.getAndSet(Conc.empty<A>()).flatMap((leftovers) => {
        if (leftovers.isNonEmpty) {
          return consumed.set(true) > IO.succeedNow(Channel.writeNow(leftovers) > handoffConsumer);
        } else {
          return handoff.take.map((signal) =>
            signal.match({
              Emit: ({ els }) => Channel.fromIO(consumed.set(true)) > Channel.writeNow(els) > handoffConsumer,
              Halt: ({ error }) => Channel.failCause(error),
              End: ({ reason }) => {
                if (reason._tag === SinkEndReasonTag.ScheduleEnd) {
                  return Channel.unwrap(
                    consumed.get.map((p) =>
                      p
                        ? Channel.fromIO(sinkEndReason.set(new ScheduleEnd()))
                        : Channel.fromIO(sinkEndReason.set(new ScheduleEnd())) > handoffConsumer,
                    ),
                  );
                } else {
                  return Channel.fromIO(sinkEndReason.set(reason));
                }
              },
            }),
          );
        }
      }),
    );

    function timeout(lastB: Maybe<B>, __tsplusTrace?: string): IO<R2, Nothing, C> {
      return scheduleDriver.next(lastB);
    }

    const scheduledAggregator = (
      sinkFiber: Fiber.Runtime<E | E1, readonly [Conc<Conc<A1>>, B]>,
      scheduleFiber: Fiber.Runtime<Nothing, C>,
    ): Channel<R1 | R2, unknown, unknown, unknown, E | E1, Conc<Either<C, B>>, any> => {
      const forkSink =
        consumed.set(false) > handoffConsumer.pipeToOrFail(sink.channel).doneCollect.runScoped.forkScoped;

      function handleSide(leftovers: Conc<Conc<A1>>, b: B, c: Maybe<C>, __tsplusTrace?: string) {
        return Channel.unwrap(
          sinkLeftovers.set(leftovers.flatten) >
            sinkEndReason.get.map((reason) =>
              reason.match({
                ScheduleEnd: () =>
                  Channel.unwrapScoped(
                    Do((Δ) => {
                      const consumed_     = Δ(consumed.get);
                      const sinkFiber     = Δ(forkSink);
                      const scheduleFiber = Δ(timeout(Just(b)).forkScoped);
                      const toWrite       = c.match(
                        () => Conc(Either.right(b)),
                        (c) => Conc(Either.right(b), Either.left(c)),
                      );
                      return consumed_
                        ? Channel.write(toWrite) > scheduledAggregator(sinkFiber, scheduleFiber)
                        : scheduledAggregator(sinkFiber, scheduleFiber);
                    }),
                  ),
                UpstreamEnd: () =>
                  Channel.unwrap(consumed.get.map((p) => (p ? Channel.write(Conc(Either.right(b))) : Channel.unit))),
              }),
            ),
        );
      }

      return Channel.unwrap(
        sinkFiber.join.raceWith(
          scheduleFiber.join,
          (sinkExit, scheduleFiber) =>
            scheduleFiber.interrupt >
            IO.fromExit(sinkExit).map(([leftovers, b]) => handleSide(leftovers, b, Nothing())),
          (scheduleExit, sinkFiber) =>
            IO.fromExit(scheduleExit).matchCauseIO(
              (cause) =>
                cause.failureOrCause.match(
                  () =>
                    handoff.offer(HandoffSignal.End(new ScheduleEnd())).forkDaemon >
                    sinkFiber.join.map(([leftovers, b]) => handleSide(leftovers, b, Nothing())),
                  (cause) =>
                    handoff.offer(HandoffSignal.Halt(cause)).forkDaemon >
                    sinkFiber.join.map(([leftovers, b]) => handleSide(leftovers, b, Nothing())),
                ),
              (c) =>
                handoff.offer(HandoffSignal.End(new ScheduleEnd())).forkDaemon >
                sinkFiber.join.map(([leftovers, b]) => handleSide(leftovers, b, Just(c))),
            ),
        ),
      );
    };

    return Stream.unwrapScoped(
      Do((Δ) => {
        Δ(stream.channel.pipeTo(handoffProducer).runScoped.forkScoped);
        const sinkFiber     = Δ(handoffConsumer.pipeToOrFail(sink.channel).doneCollect.runScoped.forkScoped);
        const scheduleFiber = Δ(timeout(Nothing()).forkScoped);
        return new Stream(scheduledAggregator(sinkFiber, scheduleFiber));
      }),
    );
  });
}

/**
 * Composes this stream with the specified stream to create a cartesian product of elements,
 * but keeps only elements from this stream.
 * The `that` stream would be run multiple times, for every element in the `this` stream.
 *
 * @tsplus fluent fncts.io.Stream apFirst
 */
export function apFirst_<R, R1, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  that: Stream<R1, E1, A1>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return stream.crossWith(that, (a, _) => a);
}

/**
 * Composes this stream with the specified stream to create a cartesian product of elements,
 * but keeps only elements from the other stream.
 * The `that` stream would be run multiple times, for every element in the `this` stream.
 *
 * @tsplus fluent fncts.io.Stream apSecond
 */
export function apSecond_<R, R1, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  that: Stream<R1, E1, A1>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A1> {
  return stream.crossWith(that, (_, b) => b);
}

/**
 * Maps the success values of this stream to the specified constant value.
 *
 * @tsplus fluent fncts.io.Stream as
 */
export function as_<R, E, A, B>(stream: Stream<R, E, A>, b: Lazy<B>, __tsplusTrace?: string): Stream<R, E, B> {
  return stream.map(() => b());
}

/**
 * @tsplus static fncts.io.StreamOps asyncInterrupt
 */
export function asyncInterrupt<R, E, A>(
  register: (
    resolve: (next: IO<R, Maybe<E>, Conc<A>>, offerCb?: (e: Exit<never, boolean>) => void) => void,
  ) => Either<Canceler<R>, Stream<R, E, A>>,
  outputBuffer = 16,
  __tsplusTrace?: string,
): Stream<R, E, A> {
  return Stream.unwrapScoped(
    Do((Δ) => {
      const output       = Δ(IO.acquireRelease(Queue.makeBounded<Take<E, A>>(outputBuffer), (queue) => queue.shutdown));
      const runtime      = Δ(IO.runtime<R>());
      const eitherStream = Δ(
        IO.succeed(() =>
          register((k, cb) => {
            const effect = Take.fromPull(k).flatMap((a) => output.offer(a));
            return runtime.unsafeRunAsyncWith(effect, cb || constVoid);
          }),
        ),
      );
      return eitherStream.match(
        (canceler) => {
          const loop: Channel<never, unknown, unknown, unknown, E, Conc<A>, void> = Channel.unwrap(
            output.take
              .flatMap((take) => take.done)
              .match(
                (maybeError) => maybeError.match(() => Channel.endNow(undefined), Channel.failNow),
                (as) => Channel.writeNow(as) > loop,
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
 * @tsplus static fncts.io.StreamOps asyncMaybe
 */
export function asyncMaybe<R, E, A>(
  register: (
    resolve: (next: IO<R, Maybe<E>, Conc<A>>, offerCb?: (e: Exit<never, boolean>) => void) => void,
  ) => Maybe<Stream<R, E, A>>,
  outputBuffer = 16,
  __tsplusTrace?: string,
): Stream<R, E, A> {
  return Stream.asyncInterrupt((k) => register(k).match(() => Either.left(IO.unit), Either.right), outputBuffer);
}

/**
 * @tsplus static fncts.io.StreamOps async
 */
export function async<R, E, A>(
  register: (resolve: (next: IO<R, Maybe<E>, Conc<A>>, offerCb?: (e: Exit<never, boolean>) => void) => void) => void,
  outputBuffer = 16,
  __tsplusTrace?: string,
): Stream<R, E, A> {
  return Stream.asyncMaybe((cb) => {
    register(cb);
    return Nothing();
  }, outputBuffer);
}

/**
 * @tsplus static fncts.io.StreamOps asyncIO
 */
export function asyncIO<R, E, A, R1 = R, E1 = E>(
  register: (
    resolve: (next: IO<R, Maybe<E>, Conc<A>>, offerCb?: (e: Exit<never, boolean>) => void) => void,
  ) => IO<R1, E1, unknown>,
  outputBuffer = 16,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return new Stream(
    Channel.unwrapScoped(
      Do((Δ) => {
        const output  = Δ(IO.acquireRelease(Queue.makeBounded<Take<E, A>>(outputBuffer), (_) => _.shutdown));
        const runtime = Δ(IO.runtime<R>());
        Δ(
          register((k, cb) =>
            runtime.unsafeRunAsyncWith(
              Take.fromPull(k).flatMap((a) => output.offer(a)),
              cb || constVoid,
            ),
          ),
        );
        const loop: Channel<never, unknown, unknown, unknown, E, Conc<A>, void> = Channel.unwrap(
          output.take
            .flatMap((take) => take.done)
            .matchCauseIO(
              (cause) =>
                output.shutdown.as(
                  cause.failureOrCause.match(
                    (maybeError) => maybeError.match(() => Channel.endNow(undefined), Channel.failNow),
                    Channel.failCauseNow,
                  ),
                ),
              (as) => IO.succeed(Channel.writeNow(as) > loop),
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
export function bimap_<R, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  f: (e: E) => E1,
  g: (a: A) => A1,
  __tsplusTrace?: string,
): Stream<R, E1, A1> {
  return stream.mapError(f).map(g);
}

/**
 * Creates a stream from a single value that will get cleaned up after the
 * stream is consumed
 *
 * @tsplus static fncts.io.StreamOps acquireRelease
 */
export function acquireRelease_<R, E, A, R1>(
  acquire: IO<R, E, A>,
  release: (a: A) => IO<R1, never, unknown>,
  __tsplusTrace?: string,
): Stream<R | R1, E, A> {
  return Stream.scoped(IO.acquireRelease(acquire, release));
}

/**
 * Creates a stream from a single value that will get cleaned up after the
 * stream is consumed
 *
 * @tsplus static fncts.io.StreamOps acquireReleaseExit
 */
export function acquireReleaseExit_<R, E, A, R1>(
  acquire: IO<R, E, A>,
  release: (a: A, exit: Exit<any, any>) => IO<R1, never, unknown>,
  __tsplusTrace?: string,
): Stream<R | R1, E, A> {
  return Stream.scoped(IO.acquireReleaseExit(acquire, release));
}

/**
 * Fan out the stream, producing a list of streams that have the same elements as this stream.
 * The driver stream will only ever advance of the `maximumLag` chunks before the
 * slowest downstream stream.
 *
 * @tsplus fluent fncts.io.Stream broadcast
 */
export function broadcast_<R, E, A>(
  stream: Stream<R, E, A>,
  n: number,
  maximumLag: number,
  __tsplusTrace?: string,
): IO<R | Scope, never, Conc<Stream<unknown, E, A>>> {
  return stream
    .broadcastedQueues(n, maximumLag)
    .map((c) => c.map((hub) => Stream.fromQueueWithShutdown(hub).flattenTake));
}

/**
 * Fan out the stream, producing a dynamic number of streams that have the same elements as this stream.
 * The driver stream will only ever advance of the `maximumLag` chunks before the
 * slowest downstream stream.
 *
 * @tsplus fluent fncts.io.Stream broadcastDynamic
 */
export function broadcastDynamic_<R, E, A>(
  stream: Stream<R, E, A>,
  maximumLag: number,
  __tsplusTrace?: string,
): IO<R | Scope, never, Stream<unknown, E, A>> {
  return stream
    .broadcastedQueuesDynamic(maximumLag)
    .map((scoped) => Stream.scoped(scoped).flatMap(Stream.fromQueue).flattenTake);
}

/**
 * Converts the stream to a managed list of queues. Every value will be replicated to every queue with the
 * slowest queue being allowed to buffer `maximumLag` chunks before the driver is backpressured.
 *
 * Queues can unsubscribe from upstream by shutting down.
 *
 * @tsplus fluent fncts.io.Stream broadcastedQueues
 */
export function broadcastedQueues_<R, E, A>(
  stream: Stream<R, E, A>,
  n: number,
  maximumLag: number,
  __tsplusTrace?: string,
): IO<R | Scope, never, Conc<Dequeue<Take<E, A>>>> {
  return Do((Δ) => {
    const hub    = Δ(Hub.makeBounded<Take<E, A>>(maximumLag));
    const queues = Δ(IO.sequenceIterable(Conc.replicate(n, hub.subscribe)));
    Δ(stream.runIntoHubScoped(hub).fork);
    return queues;
  });
}

/**
 * Converts the stream to a managed dynamic amount of queues. Every chunk will be replicated to every queue with the
 * slowest queue being allowed to buffer `maximumLag` chunks before the driver is backpressured.
 *
 * Queues can unsubscribe from upstream by shutting down.
 *
 * @tsplus fluent fncts.io.Stream broadcastedQueuesDynamic
 */
export function broadcastedQueuesDynamic_<R, E, A>(
  stream: Stream<R, E, A>,
  maximumLag: number,
  __tsplusTrace?: string,
): IO<R | Scope, never, IO<Scope, never, Dequeue<Take<E, A>>>> {
  return stream.toHub(maximumLag).map((hub) => hub.subscribe);
}

/**
 * Allows a faster producer to progress independently of a slower consumer by buffering
 * up to `capacity` elements in a queue.
 *
 * @tsplus fluent fncts.io.Stream buffer
 */
export function buffer_<R, E, A>(stream: Stream<R, E, A>, capacity: number, __tsplusTrace?: string): Stream<R, E, A> {
  const queue = toQueueOfElements_(stream, capacity);
  return new Stream(
    Channel.unwrapScoped(
      queue.map((queue) => {
        const process: Channel<never, unknown, unknown, unknown, E, Conc<A>, void> = Channel.fromIO(queue.take).flatMap(
          (exit: Exit<Maybe<E>, A>) =>
            exit.match(
              (cause) => cause.flipCauseMaybe.match(() => Channel.endNow(undefined), Channel.failCauseNow),
              (value) => Channel.writeNow(Conc.single(value)).apSecond(process),
            ),
        );
        return process;
      }),
    ),
  );
}

/**
 * @tsplus fluent fncts.io.Stream bufferChunks
 */
export function bufferChunks_<R, E, A>(
  stream: Stream<R, E, A>,
  capacity: number,
  __tsplusTrace?: string,
): Stream<R, E, A> {
  const queue = stream.toQueue(capacity);
  return new Stream(
    Channel.unwrapScoped(
      queue.map((queue) => {
        const process: Channel<never, unknown, unknown, unknown, E, Conc<A>, void> = Channel.fromIO(queue.take).flatMap(
          (take: Take<E, A>) =>
            take.match(Channel.endNow(undefined), Channel.failCauseNow, (value) =>
              Channel.writeNow(value).apSecond(process),
            ),
        );
        return process;
      }),
    ),
  );
}

/**
 * Allows a faster producer to progress independently of a slower consumer by buffering
 * elements into an unbounded queue.
 *
 * @tsplus getter fncts.io.Stream bufferUnbounded
 */
export function bufferUnbounded<R, E, A>(stream: Stream<R, E, A>, __tsplusTrace?: string): Stream<R, E, A> {
  const queue = stream.toQueueUnbounded;

  return new Stream(
    Channel.unwrapScoped(
      queue.map((queue) => {
        const process: Channel<never, unknown, unknown, unknown, E, Conc<A>, void> = Channel.fromIO(queue.take).flatMap(
          (take) =>
            take.match(Channel.endNow(undefined), Channel.failCauseNow, (value) =>
              Channel.writeNow(value).apSecond(process),
            ),
        );

        return process;
      }),
    ),
  );
}

function bufferSignalProducer<E, A>(
  queue: Queue<readonly [Take<E, A>, Future<never, void>]>,
  ref: Ref<Future<never, void>>,
  __tsplusTrace?: string,
): Channel<never, E, Conc<A>, unknown, never, never, unknown> {
  const terminate = (take: Take<E, A>): Channel<never, E, Conc<A>, unknown, never, never, unknown> =>
    Channel.fromIO(
      Do((Δ) => {
        const latch = Δ(ref.get);
        Δ(latch.await);
        const p = Δ(Future.make<never, void>());
        Δ(queue.offer(tuple(take, p)));
        Δ(ref.set(p));
        Δ(p.await);
      }),
    );
  return Channel.readWith(
    (inp) =>
      Channel.fromIO(
        Do((Δ) => {
          const p     = Δ(Future.make<never, void>());
          const added = Δ(queue.offer(tuple(Take.chunk(inp), p)));
          Δ(ref.set(p).when(added));
        }),
      ) > bufferSignalProducer(queue, ref),
    (e) => terminate(Take.fail(e)),
    () => terminate(Take.end),
  );
}

function bufferSignalConsumer<R, E, A>(
  queue: Queue<readonly [Take<E, A>, Future<never, void>]>,
  __tsplusTrace?: string,
): Channel<R, unknown, unknown, unknown, E, Conc<A>, void> {
  const process: Channel<never, unknown, unknown, unknown, E, Conc<A>, void> = Channel.fromIO(queue.take).flatMap(
    ([take, promise]) =>
      Channel.fromIO(promise.succeed(undefined)).apSecond(
        take.match(Channel.endNow(undefined), Channel.failCauseNow, (value) =>
          Channel.writeNow(value).apSecond(process),
        ),
      ),
  );
  return process;
}

/**
 * Switches over to the stream produced by the provided function in case this one
 * fails with a typed error.
 *
 * @tsplus fluent fncts.io.Stream catchAll
 */
export function catchAll_<R, R1, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  f: (e: E) => Stream<R1, E1, A1>,
  __tsplusTrace?: string,
): Stream<R | R1, E1, A | A1> {
  return stream.catchAllCause((cause) => cause.failureOrCause.match(f, Stream.failCauseNow));
}

/**
 * Switches over to the stream produced by the provided function in case this one
 * fails. Allows recovery from all causes of failure, including interruption if the
 * stream is uninterruptible.
 *
 * @tsplus fluent fncts.io.Stream catchAllCause
 */
export function catchAllCause_<R, R1, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  f: (cause: Cause<E>) => Stream<R1, E1, A1>,
  __tsplusTrace?: string,
): Stream<R | R1, E1, A | A1> {
  const channel: Channel<R | R1, unknown, unknown, unknown, E1, Conc<A | A1>, unknown> = stream.channel.catchAllCause(
    (cause) => f(cause).channel,
  );
  return new Stream(channel);
}

/**
 * Switches over to the stream produced by the provided function in case this one
 * fails with some typed error.
 *
 * @tsplus fluent fncts.io.Stream catchJust
 */
export function catchJust_<R, R1, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  pf: (e: E) => Maybe<Stream<R1, E1, A1>>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A | A1> {
  return stream.catchAll((e) => pf(e).getOrElse(Stream.failNow(e)));
}

/**
 * Switches over to the stream produced by the provided function in case this one
 * fails with some errors. Allows recovery from all causes of failure, including interruption if the
 * stream is uninterruptible.
 *
 * @tsplus fluent fncts.io.Stream catchJustCause
 */
export function catchJustCause_<R, R1, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  pf: (e: Cause<E>) => Maybe<Stream<R1, E1, A1>>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A | A1> {
  return stream.catchAllCause((cause) => pf(cause).getOrElse(Stream.failCauseNow(cause)));
}

/**
 * Returns a stream made of the concatenation in strict order of all the streams
 * produced by passing each element of this stream to `f`
 *
 * @tsplus fluent fncts.io.Stream flatMap
 */
export function flatMap_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  f: (a: A) => Stream<R1, E1, B>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return new Stream(
    stream.channel.concatMap((as) =>
      as
        .map((a) => f(a).channel)
        .foldLeft(Channel.unit as Channel<R1, unknown, unknown, unknown, E1, Conc<B>, unknown>, (s, a) =>
          s.flatMap(() => a),
        ),
    ),
  );
}

/**
 * Exposes the underlying chunks of the stream as a stream of chunks of elements
 *
 * @tsplus getter fncts.io.Stream chunks
 */
export function chunks<R, E, A>(stream: Stream<R, E, A>, __tsplusTrace?: string): Stream<R, E, Conc<A>> {
  return stream.mapChunks(Conc.single);
}

/**
 * Performs the specified stream transformation with the chunk structure of
 * the stream exposed.
 *
 * @tsplus fluent fncts.io.Stream chunksWith
 */
export function chunksWith<R, E, A, R1, E1, B>(
  self: Stream<R, E, A>,
  f: (_: Stream<R, E, Conc<A>>) => Stream<R1, E1, Conc<B>>,
  __tsplusTrace?: string,
): Stream<R1, E1, B> {
  return f(self.chunks).flattenChunks;
}

function changesWithWriter<R, E, A>(
  f: (x: A, y: A) => boolean,
  last: Maybe<A>,
  __tsplusTrace?: string,
): Channel<R, E, Conc<A>, unknown, E, Conc<A>, void> {
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
 * @tsplus fluent fncts.io.Stream changesWith
 */
export function changesWith_<R, E, A>(
  stream: Stream<R, E, A>,
  f: (x: A, y: A) => boolean,
  __tsplusTrace?: string,
): Stream<R, E, A> {
  return new Stream(stream.channel.pipeTo(changesWithWriter<R, E, A>(f, Nothing())));
}

/**
 * Transforms all elements of the stream for as long as the specified partial function is defined.
 *
 * @tsplus fluent fncts.io.Stream collectWhile
 */
export function collectWhile_<R, E, A, A1>(
  stream: Stream<R, E, A>,
  pf: (a: A) => Maybe<A1>,
  __tsplusTrace?: string,
): Stream<R, E, A1> {
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
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return new Stream(stream.channel.pipeTo(collectWhileIOLoop(Iterable.empty<A>()[Symbol.iterator](), pf)));
}

function collectWhileIOLoop<R, E, A, R1, E1, B>(
  iterator: Iterator<A>,
  pf: (a: A) => Maybe<IO<R1, E1, B>>,
  __tsplusTrace?: string,
): Channel<R | R1, E, Conc<A>, unknown, E | E1, Conc<B>, unknown> {
  const next = iterator.next();
  if (next.done) {
    return Channel.readWithCause(
      (elem) => collectWhileIOLoop(elem[Symbol.iterator](), pf),
      Channel.failCauseNow,
      Channel.succeedNow,
    );
  } else {
    return Channel.unwrap(
      pf(next.value).match(
        () => IO.succeedNow(Channel.unit),
        (b) => b.map((b) => Channel.writeNow(Conc.single(b)) > collectWhileIOLoop<R, E, A, R1, E1, B>(iterator, pf)),
      ),
    );
  }
}

function combineProducer<Err, Elem>(
  handoff: Handoff<Exit<Maybe<Err>, Elem>>,
  latch: Handoff<void>,
  __tsplusTrace?: string,
): Channel<never, Err, Elem, unknown, never, never, any> {
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
 * @tsplus fluent fncts.io.Stream combine
 */
export function combine_<R, E, A, R1, E1, A1, S, R2, A2>(
  stream: Stream<R, E, A>,
  that: Stream<R1, E1, A1>,
  s: S,
  f: (
    s: S,
    eff1: IO<R, Maybe<E>, A>,
    eff2: IO<R1, Maybe<E1>, A1>,
  ) => IO<R2, never, Exit<Maybe<E | E1>, readonly [A2, S]>>,
  __tsplusTrace?: string,
): Stream<R | R1 | R2, E | E1, A2> {
  return new Stream(
    Channel.unwrapScoped(
      Do((Δ) => {
        const left   = Δ(Handoff<Exit<Maybe<E>, A>>());
        const right  = Δ(Handoff<Exit<Maybe<E1>, A1>>());
        const latchL = Δ(Handoff<void>());
        const latchR = Δ(Handoff<void>());
        Δ(stream.channel.concatMap(Channel.writeChunk).pipeTo(combineProducer(left, latchL)).runScoped.fork);
        Δ(that.channel.concatMap(Channel.writeChunk).pipeTo(combineProducer(right, latchR)).runScoped.fork);
        return tuple(left, right, latchL, latchR);
      }).map(([left, right, latchL, latchR]) => {
        const pullLeft  = latchL.offer(undefined).apSecond(left.take).flatMap(IO.fromExitNow);
        const pullRight = latchR.offer(undefined).apSecond(right.take).flatMap(IO.fromExitNow);
        return Stream.unfoldIO(s, (s) => f(s, pullLeft, pullRight).flatMap((exit) => IO.fromExitNow(exit).optional))
          .channel;
      }),
    ),
  );
}

function combineChunksProducer<Err, Elem>(
  handoff: Handoff<Take<Err, Elem>>,
  latch: Handoff<void>,
  __tsplusTrace?: string,
): Channel<never, Err, Conc<Elem>, unknown, never, never, any> {
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
 * @tsplus fluent fncts.io.Stream combineChunks
 */
export function combineChunks_<R, E, A, R1, E1, A1, S, R2, A2>(
  stream: Stream<R, E, A>,
  that: Stream<R1, E1, A1>,
  s: S,
  f: (
    s: S,
    l: IO<R, Maybe<E>, Conc<A>>,
    r: IO<R1, Maybe<E1>, Conc<A1>>,
  ) => IO<R2, never, Exit<Maybe<E | E1>, readonly [Conc<A2>, S]>>,
  __tsplusTrace?: string,
): Stream<R1 | R | R2, E | E1, A2> {
  return new Stream(
    Channel.unwrapScoped(
      Do((Δ) => {
        const left   = Δ(Handoff<Take<E, A>>());
        const right  = Δ(Handoff<Take<E1, A1>>());
        const latchL = Δ(Handoff<void>());
        const latchR = Δ(Handoff<void>());
        Δ(stream.channel.pipeTo(combineChunksProducer(left, latchL)).runScoped.fork);
        Δ(that.channel.pipeTo(combineChunksProducer(right, latchR)).runScoped.fork);
        return tuple(left, right, latchL, latchR);
      }).map(([left, right, latchL, latchR]) => {
        const pullLeft = latchL
          .offer(undefined)
          .apSecond(left.take)
          .flatMap((take) => take.done);
        const pullRight = latchR
          .offer(undefined)
          .apSecond(right.take)
          .flatMap((take) => take.done);
        return Stream.unfoldChunkIO(s, (s) => f(s, pullLeft, pullRight).flatMap((exit) => IO.fromExit(exit).optional))
          .channel;
      }),
    ),
  );
}

/**
 * Concatenates the specified stream with this stream, resulting in a stream
 * that emits the elements from this stream and then the elements from the specified stream.
 *
 * @tsplus fluent fncts.io.Stream concat
 */
export function concat_<R, R1, E, E1, A, A1>(
  stream: Stream<R, E, A>,
  that: Stream<R1, E1, A1>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A | A1> {
  return new Stream<R | R1, E | E1, A | A1>(stream.channel.apSecond(that.channel));
}

/**
 * Composes this stream with the specified stream to create a cartesian product of elements.
 * The `that` stream would be run multiple times, for every element in the `this` stream.
 *
 * @tsplus fluent fncts.io.Stream cross
 */
export function cross_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  that: Stream<R1, E1, B>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, readonly [A, B]> {
  return new Stream(
    stream.channel.concatMap((as) => that.channel.mapOut((bs) => as.flatMap((a) => bs.map((b) => tuple(a, b))))),
  );
}

/**
 * Composes this stream with the specified stream to create a cartesian product of elements
 * with a specified function.
 * The `fb` stream would be run multiple times, for every element in the `fa` stream.
 *
 * @tsplus fluent fncts.io.Stream crossWith
 */
export function crossWith_<R, E, A, R1, E1, B, C>(
  fa: Stream<R, E, A>,
  fb: Stream<R1, E1, B>,
  f: (a: A, b: B) => C,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, C> {
  return fa.flatMap((a) => fb.map((b) => f(a, b)));
}

/**
 * Provides some of the environment required to run this effect,
 * leaving the remainder `R0`.
 *
 * @tsplus fluent fncts.io.Stream contramapEnvironment
 */
export function contramapEnvironment_<R, E, A, R0>(
  ra: Stream<R, E, A>,
  f: (r0: Environment<R0>) => Environment<R>,
  __tsplusTrace?: string,
): Stream<R0, E, A> {
  return Stream.environment<R0>().flatMap((r0) => ra.provideEnvironment(f(r0)));
}

/**
 * @tsplus fluent fncts.io.Stream debounce
 */
export function debounce_<R, E, A>(
  stream: Stream<R, E, A>,
  duration: Lazy<Duration>,
  __tsplusTrace?: string,
): Stream<R, E, A> {
  return Stream.unwrap(
    IO.transplant((grafter) =>
      Do((Δ) => {
        const handoff = Δ(Handoff<HandoffSignal<E, A>>());
        function enqueue(last: Conc<A>, __tsplusTrace?: string) {
          return grafter(Clock.sleep(duration).as(last).fork).map((f) => consumer(DebounceState.Previous(f)));
        }
        const producer: Channel<R, E, Conc<A>, unknown, E, never, unknown> = Channel.readWithCause(
          (inp: Conc<A>) =>
            inp.last.match(
              () => producer,
              (last) => Channel.fromIO(handoff.offer(HandoffSignal.Emit(Conc.single(last)))).apSecond(producer),
            ),
          (cause: Cause<E>) => Channel.fromIO(handoff.offer(HandoffSignal.Halt(cause))),
          () => Channel.fromIO(handoff.offer(HandoffSignal.End(new UpstreamEnd()))),
        );
        function consumer(
          state: DebounceState<E, A>,
          __tsplusTrace?: string,
        ): Channel<R, unknown, unknown, unknown, E, Conc<A>, unknown> {
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
                      (chunk) =>
                        IO.succeedNow(Channel.writeNow(chunk).apSecond(consumer(DebounceState.Current(current)))),
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

        return Stream.scoped(stream.channel.pipeTo(producer).runScoped.fork).apSecond(
          new Stream(consumer(DebounceState.NotStarted)),
        );
      }),
    ),
  );
}

function defaultIfEmptyWriter<R, E, A, R1, E1, B>(
  fb: Stream<R1, E1, B>,
  __tsplusTrace?: string,
): Channel<R | R1, E, Conc<A>, unknown, E | E1, Conc<A | B>, unknown> {
  return Channel.readWith(
    (i: Conc<A>) =>
      i.isEmpty ? defaultIfEmptyWriter(fb) : Channel.writeNow(i).apSecond(Channel.id<E, Conc<A>, unknown>()),
    Channel.failNow,
    () => fb.channel,
  );
}

/**
 * Switches to the provided stream in case this one is empty.
 *
 * @tsplus fluent fncts.io.Stream defaultIfEmpty
 */
export function defaultIfEmpty_<R, E, A, R1, E1, B>(
  fa: Stream<R, E, A>,
  fb: Stream<R1, E1, B>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A | B> {
  return new Stream(fa.channel.pipeTo(defaultIfEmptyWriter(fb)));
}

/**
 * More powerful version of `broadcast`. Allows to provide a function that determines what
 * queues should receive which elements. The decide function will receive the indices of the queues
 * in the resulting list.
 *
 * @tsplus fluent fncts.io.Stream distributedWith
 */
export function distributedWith_<R, E, A>(
  self: Stream<R, E, A>,
  n: number,
  maximumLag: number,
  decide: (_: A) => UIO<(_: number) => boolean>,
  __tsplusTrace?: string,
): IO<R | Scope, never, Conc<Dequeue<Exit<Maybe<E>, A>>>> {
  return Future.make<never, (a: A) => UIO<(_: symbol) => boolean>>().flatMap((p) =>
    self
      .distributedWithDynamic(
        maximumLag,
        (a) => p.await.flatMap((f) => f(a)),
        () => IO.unit,
      )
      .flatMap((next) =>
        IO.sequenceIterable(
          Conc.range(0, n).map((id) => next.map(([key, queue]) => [[key, id], queue] as const)),
        ).flatMap((entries) => {
          const [mappings, queues] = entries.foldRight(
            [HashMap.makeDefault<symbol, number>(), Conc.empty<Dequeue<Exit<Maybe<E>, A>>>()] as const,
            ([mapping, queue], [mappings, queues]) => [mappings.set(mapping[0], mapping[1]), queues.append(queue)],
          );
          return p.succeed((a) => decide(a).map((f) => (key: symbol) => f(mappings.get(key).value!))).as(queues);
        }),
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
 * @tsplus fluent fncts.io.Stream distributedWithDynamic
 */
export function distributedWithDynamic_<R, E, A>(
  self: Stream<R, E, A>,
  maximumLag: number,
  decide: (a: A) => UIO<(_: symbol) => boolean>,
  done: (exit: Exit<Maybe<E>, never>) => UIO<any> = () => IO.unit,
  __tsplusTrace?: string,
): IO<R | Scope, never, UIO<readonly [symbol, Dequeue<Exit<Maybe<E>, A>>]>> {
  const offer = (queuesRef: Ref<HashMap<symbol, Queue<Exit<Maybe<E>, A>>>>) => (a: A) =>
    Do((Δ) => {
      const shouldProcess = Δ(decide(a));
      const queues        = Δ(queuesRef.get);
      return Δ(
        IO.foldLeft(queues, Conc.empty<symbol>(), (b, [id, queue]) => {
          if (shouldProcess(id)) {
            return queue.offer(Exit.succeed(a)).matchCauseIO(
              (c) => (c.interrupted ? IO.succeedNow(b.append(id)) : IO.failCauseNow(c)),
              () => IO.succeedNow(b),
            );
          } else {
            return IO.succeedNow(b);
          }
        }).flatMap((ids) => (ids.isNonEmpty ? queuesRef.update((map) => map.removeMany(ids)) : IO.unit)),
      );
    });

  return Do((Δ) => {
    const queuesRef = Δ(
      IO.acquireRelease(Ref.make<HashMap<symbol, Queue<Exit<Maybe<E>, A>>>>(HashMap.makeDefault()), (ref) =>
        ref.get.flatMap((qs) => IO.foreach(qs.values, (q) => q.shutdown)),
      ),
    );

    const add = Δ(
      Do((Δ) => {
        const queuesLock = Δ(TSemaphore.make(1).commit);
        const newQueue   = Δ(
          Ref.make<UIO<readonly [symbol, Queue<Exit<Maybe<E>, A>>]>>(
            Do((Δ) => {
              const queue = Δ(Queue.makeBounded<Exit<Maybe<E>, A>>(maximumLag));
              const id    = Δ(IO.succeed(Symbol()));
              Δ(queuesRef.update((map) => map.set(id, queue)));
              return tuple(id, queue);
            }),
          ),
        );
        const finalize = (endTake: Exit<Maybe<E>, never>): UIO<void> =>
          queuesLock.withPermit(
            newQueue
              .set(
                Do((Δ) => {
                  const queue = Δ(Queue.makeBounded<Exit<Maybe<E>, A>>(1));
                  Δ(queue.offer(endTake));
                  const id = Symbol();
                  Δ(queuesRef.update((map) => map.set(id, queue)));
                  return tuple(id, queue);
                }),
              )
              .flatMap(() =>
                Do((Δ) => {
                  const queues = Δ(queuesRef.get.map((map) => map.values));
                  Δ(
                    IO.foreach(queues, (queue) =>
                      queue
                        .offer(endTake)
                        .catchJustCause((c) => (c.interrupted ? Just(IO.unit) : Nothing<UIO<void>>())),
                    ),
                  );
                  Δ(done(endTake));
                }),
              ).asUnit,
          );

        Δ(
          self.runForeachScoped(offer(queuesRef)).matchCauseIO(
            (cause) => finalize(Exit.failCause(cause.map(Maybe.just))),
            () => finalize(Exit.fail(Nothing())),
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
 * @tsplus getter fncts.io.Stream drain
 */
export function drain<R, E, A>(fa: Stream<R, E, A>, __tsplusTrace?: string): Stream<R, E, void> {
  return new Stream(fa.channel.drain);
}

function dropLoop<R, E, A>(r: number, __tsplusTrace?: string): Channel<R, E, Conc<A>, unknown, E, Conc<A>, unknown> {
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
 * @tsplus fluent fncts.io.Stream drop
 */
export function drop_<R, E, A>(stream: Stream<R, E, A>, n: number, __tsplusTrace?: string): Stream<R, E, A> {
  return new Stream(stream.channel.pipeTo(dropLoop(n)));
}

/**
 * Drops all elements of the stream for as long as the specified predicate
 * evaluates to `true`.
 *
 * @tsplus fluent fncts.io.Stream dropWhile
 */
export function dropWhile_<R, E, A>(stream: Stream<R, E, A>, p: Predicate<A>, __tsplusTrace?: string): Stream<R, E, A> {
  return stream.pipeThrough(Sink.dropWhile(p));
}

/**
 * Drops all elements of the stream until the specified predicate evaluates
 * to `true`.
 *
 * @tsplus fluent fncts.io.Stream dropUntil
 */
export function dropUntil_<R, E, A>(stream: Stream<R, E, A>, p: Predicate<A>, __tsplusTrace?: string): Stream<R, E, A> {
  return stream.dropWhile(p.invert).drop(1);
}

/**
 * Returns a stream whose failures and successes have been lifted into an
 * `Either`. The resulting stream cannot fail, because the failures have
 * been exposed as part of the `Either` success case.
 *
 * @note the stream will end as soon as the first error occurs.
 *
 * @tsplus getter fncts.io.Stream either
 */
export function either<R, E, A>(stream: Stream<R, E, A>, __tsplusTrace?: string): Stream<R, never, Either<E, A>> {
  return stream.map(Either.right).catchAll((e) => Stream.succeedNow(Either.left(e)));
}

/**
 * @tsplus static fncts.io.StreamOps empty
 */
export const empty: Stream<never, never, never> = Stream.fromChunkNow(Conc.empty<never>());

function endWhenWriter<E, A, E1>(
  fiber: Fiber<E1, any>,
  __tsplusTrace?: string,
): Channel<never, E | E1, Conc<A>, unknown, E | E1, Conc<A>, void> {
  return Channel.unwrap(
    fiber.poll.map((maybeExit) =>
      maybeExit.match(
        () =>
          Channel.readWith(
            (inp: Conc<A>) => Channel.writeNow(inp).apSecond(endWhenWriter<E, A, E1>(fiber)),
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
 * @tsplus fluent fncts.io.Stream endWhen
 */
export function endWhen_<R, E, A, R1, E1>(
  stream: Stream<R, E, A>,
  io: IO<R1, E1, any>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return new Stream(Channel.unwrapScoped(io.forkScoped.map((fiber) => stream.channel.pipeTo(endWhenWriter(fiber)))));
}

/**
 * @tsplus fluent fncts.io.Stream ensuring
 */
export function ensuring_<R, E, A, R1>(
  self: Stream<R, E, A>,
  finalizer: IO<R1, never, any>,
  __tsplusTrace?: string,
): Stream<R | R1, E, A> {
  return new Stream(self.channel.ensuring(finalizer));
}

/**
 * @tsplus static fncts.io.StreamOps environment
 */
export function environment<R>(__tsplusTrace?: string): Stream<R, never, Environment<R>> {
  return Stream.fromIO(IO.environment<R>());
}

/**
 * Accesses the environment of the stream.
 *
 * @tsplus static fncts.io.StreamOps environmentWith
 */
export function environmentWith<R, A>(f: (r: Environment<R>) => A, __tsplusTrace?: string): Stream<R, never, A> {
  return Stream.environment<R>().map(f);
}

/**
 * Accesses the environment of the stream in the context of an effect.
 *
 * @tsplus static fncts.io.StreamOps environmentWithIO
 */
export function environmentWithIO<R0, R, E, A>(
  f: (r0: Environment<R0>) => IO<R, E, A>,
  __tsplusTrace?: string,
): Stream<R0 | R, E, A> {
  return Stream.environment<R0>().mapIO(f);
}

/**
 * Accesses the environment of the stream in the context of a stream.
 *
 * @tsplus static fncts.io.StreamOps environmentWithStream
 */
export function environmentWithStream<R0, R, E, A>(
  f: (r0: Environment<R0>) => Stream<R, E, A>,
  __tsplusTrace?: string,
): Stream<R0 | R, E, A> {
  return Stream.environment<R0>().flatMap(f);
}

/**
 * Halt a stream with the specified error
 *
 * @tsplus static fncts.io.StreamOps failNow
 */
export function failNow<E>(error: E, __tsplusTrace?: string): Stream<never, E, never> {
  return new Stream(Channel.failNow(error));
}

/**
 * Halt a stream with the specified error
 *
 * @tsplus static fncts.io.StreamOps fail
 */
export function fail<E>(error: Lazy<E>, __tsplusTrace?: string): Stream<never, E, never> {
  return new Stream(Channel.fail(error));
}

/**
 * The stream that always halts with `cause`.
 *
 * @tsplus static fncts.io.StreamOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>, __tsplusTrace?: string): Stream<never, E, never> {
  return Stream.fromIO(IO.failCauseNow(cause));
}

/**
 * The stream that always halts with `cause`.
 *
 * @tsplus static fncts.io.StreamOps failCause
 */
export function failCause<E>(cause: Lazy<Cause<E>>, __tsplusTrace?: string): Stream<never, E, never> {
  return Stream.fromIO(IO.failCause(cause));
}

/**
 * @tsplus fluent fncts.io.Stream filter
 */
export function filter_<R, E, A, B extends A>(fa: Stream<R, E, A>, refinement: Refinement<A, B>): Stream<R, E, B>;
export function filter_<R, E, A>(fa: Stream<R, E, A>, predicate: Predicate<A>): Stream<R, E, A>;
export function filter_<R, E, A>(
  fa: Stream<R, E, A>,
  predicate: Predicate<A>,
  __tsplusTrace?: string,
): Stream<R, E, A> {
  return fa.mapChunks((chunk) => chunk.filter(predicate));
}

/**
 * @tsplus fluent fncts.io.Stream filterIO
 */
export function filterIO_<R, E, A, R1, E1>(
  fa: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return new Stream(fa.channel.pipeTo(filterIOLoop(Iterable.empty<A>()[Symbol.iterator](), f)));
}

function filterIOLoop<R, E, A, R1, E1>(
  iterator: Iterator<A>,
  f: (a: A) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): Channel<R | R1, E, Conc<A>, unknown, E | E1, Conc<A>, unknown> {
  const next = iterator.next();
  if (next.done) {
    return Channel.readWithCause(
      (elem) => filterIOLoop(elem[Symbol.iterator](), f),
      Channel.failCauseNow,
      Channel.succeedNow,
    );
  } else {
    return Channel.unwrap(
      f(next.value).map((b) =>
        b
          ? Channel.writeNow(Conc.single(next.value)) > filterIOLoop<R, E, A, R1, E1>(iterator, f)
          : filterIOLoop<R, E, A, R1, E1>(iterator, f),
      ),
    );
  }
}

/**
 * @tsplus fluent fncts.io.Stream filterMap
 */
export function filterMap_<R, E, A, B>(
  fa: Stream<R, E, A>,
  f: (a: A) => Maybe<B>,
  __tsplusTrace?: string,
): Stream<R, E, B> {
  return fa.mapChunks((chunk) => chunk.filterMap(f));
}

/**
 * @tsplus fluent fncts.io.Stream filterMapIO
 */
export function filterMapIO_<R, E, A, R1, E1, B>(
  fa: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, Maybe<B>>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return new Stream(fa.channel.pipeTo(filterMapIOLoop<R, E, A, R1, E1, B>(Iterable.empty<A>()[Symbol.iterator](), f)));
}

function filterMapIOLoop<R, E, A, R1, E1, B>(
  iterator: Iterator<A>,
  f: (a: A) => IO<R1, E1, Maybe<B>>,
  __tsplusTrace?: string,
): Channel<R | R1, E, Conc<A>, unknown, E | E1, Conc<B>, unknown> {
  const next = iterator.next();
  if (next.done) {
    return Channel.readWithCause(
      (elem) => filterMapIOLoop(elem[Symbol.iterator](), f),
      Channel.failCauseNow,
      Channel.succeedNow,
    );
  } else {
    return Channel.unwrap(
      f(next.value).map((b) =>
        b.match(
          () => filterMapIOLoop<R, E, A, R1, E1, B>(iterator, f),
          (b) => Channel.writeNow(Conc.single(b)) > filterMapIOLoop<R, E, A, R1, E1, B>(iterator, f),
        ),
      ),
    );
  }
}

/**
 * Finds the first element emitted by this stream that satisfies the provided predicate.
 *
 * @tsplus fluent fncts.io.Stream find
 */
export function find_<R, E, A>(stream: Stream<R, E, A>, p: Predicate<A>, __tsplusTrace?: string): Stream<R, E, A> {
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
 * @tsplus fluent fncts.io.Stream findIO
 */
export function findIO_<R, E, A, R1, E1>(
  stream: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  const loop: Channel<R | R1, E, Conc<A>, unknown, E | E1, Conc<A>, unknown> = Channel.readWith(
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
 * @tsplus getter fncts.io.Stream flatten
 */
export function flatten<R, E, R1, E1, A>(
  self: Stream<R, E, Stream<R1, E1, A>>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return self.flatMap(identity);
}

/**
 * Unwraps `Exit` values that also signify end-of-stream by failing with `None`.
 *
 * For `Exit<E, A>` values that do not signal end-of-stream, prefer:
 *
 * @tsplus getter fncts.io.Stream flattenExitOption
 */
export function flattenExitOption<R, E, E1, A>(
  stream: Stream<R, E, Exit<Maybe<E1>, A>>,
  __tsplusTrace?: string,
): Stream<R, E | E1, A> {
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
 * @tsplus getter fncts.io.Stream flattenTake
 */
export function flattenTake<R, E, E1, A>(
  stream: Stream<R, E, Take<E1, A>>,
  __tsplusTrace?: string,
): Stream<R, E | E1, A> {
  return stream.map((take) => take.exit).flattenExitOption.flattenChunks;
}

/**
 * Submerges the chunks carried by this stream into the stream's structure, while
 * still preserving them.
 *
 * @tsplus getter fncts.io.Stream flattenChunks
 */
export function flattenChunks<R, E, A>(stream: Stream<R, E, Conc<A>>, __tsplusTrace?: string): Stream<R, E, A> {
  return new Stream(stream.channel.mapOut((c) => c.flatten));
}

/**
 * Repeats this stream forever.
 *
 * @tsplus getter fncts.io.Stream forever
 */
export function forever<R, E, A>(stream: Stream<R, E, A>, __tsplusTrace?: string): Stream<R, E, A> {
  return new Stream(stream.channel.repeated);
}

/**
 * Creates a stream from a `Chunk` of values
 *
 * @tsplus static fncts.io.StreamOps fromChunkNow
 */
export function fromChunkNow<O>(c: Conc<O>, __tsplusTrace?: string): Stream<never, never, O> {
  return new Stream(Channel.defer(() => (c.isEmpty ? Channel.unit : Channel.writeNow(c))));
}

/**
 * Creates a stream from a `Chunk` of values
 *
 * @tsplus static fncts.io.StreamOps fromChunk
 */
export function fromChunk<O>(c: Lazy<Conc<O>>, __tsplusTrace?: string): Stream<never, never, O> {
  return new Stream(Channel.unwrap(IO.succeedNow(Channel.write(c))));
}

/**
 * Creates a single-valued stream from a managed resource
 *
 * @tsplus static fncts.io.StreamOps scoped
 */
export function scoped<R, E, A>(stream: Lazy<IO<R, E, A>>, __tsplusTrace?: string): Stream<Exclude<R, Scope>, E, A> {
  return new Stream(Channel.scoped(stream().map(Conc.single)));
}

/**
 * Creates a stream from an effect producing a value of type `A`
 *
 * @tsplus static fncts.io.StreamOps fromIO
 */
export function fromIO<R, E, A>(fa: IO<R, E, A>, __tsplusTrace?: string): Stream<R, E, A> {
  return Stream.fromIOMaybe(fa.mapError(Maybe.just));
}

/**
 * Creates a stream from an effect producing a value of type `A` or an empty Stream
 *
 * @tsplus static fncts.io.StreamOps fromIOMaybe
 */
export function fromIOMaybe<R, E, A>(fa: IO<R, Maybe<E>, A>, __tsplusTrace?: string): Stream<R, E, A> {
  return new Stream(
    Channel.unwrap(
      fa.match(
        (maybeError) => maybeError.match(() => Channel.unit, Channel.failNow),
        (a) => Channel.writeNow(Conc.single(a)),
      ),
    ),
  );
}

function fromAsyncIterableLoop<A>(
  iterator: AsyncIterator<A>,
  __tsplusTrace?: string,
): Channel<unknown, unknown, unknown, unknown, never, Conc<A>, unknown> {
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
 * @tsplus static fncts.io.StreamOps fromAsyncIterable
 */
export function fromAsyncIterable<A>(iterable: AsyncIterable<A>, __tsplusTrace?: string): Stream<unknown, never, A> {
  return new Stream(fromAsyncIterableLoop(iterable[Symbol.asyncIterator]()));
}

/**
 * @tsplus static fncts.io.StreamOps fromIterable
 */
export function fromIterable<A>(
  iterable: Iterable<A>,
  maxChunkSize = DEFAULT_CHUNK_SIZE,
  __tsplusTrace?: string,
): Stream<unknown, never, A> {
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
 * @tsplus static fncts.io.StreamOps fromIterableSingle
 */
export function fromIterableSingle<A>(iterable: Iterable<A>, __tsplusTrace?: string): Stream<unknown, never, A> {
  return Stream.fromIO(IO.succeed(iterable[Symbol.iterator]())).flatMap((iterator) =>
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
 * @tsplus static fncts.io.StreamOps fromPull
 */
export function fromPull<R, E, A>(
  scopedPull: IO<R, never, IO<R, Maybe<E>, Conc<A>>>,
  __tsplusTrace?: string,
): Stream<Exclude<R, Scope>, E, A> {
  return Stream.unwrapScoped(scopedPull.map((pull) => Stream.repeatIOChunkMaybe(pull))) as Stream<
    Exclude<R, Scope>,
    E,
    A
  >;
}

/**
 * Creates a stream from a `Queue` of values
 *
 * @tsplus static fncts.io.StreamOps fromQueue
 */
export function fromQueue_<R, E, O>(
  queue: Dequeue<O>,
  maxChunkSize: number = DEFAULT_CHUNK_SIZE,
  __tsplusTrace?: string,
): Stream<never, never, O> {
  return repeatIOChunkMaybe(
    queue
      .takeBetween(1, maxChunkSize)
      .map(Conc.from)
      .catchAllCause((c) =>
        queue.isShutdown.flatMap((down) => {
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
 * @tsplus static fncts.io.StreamOps fromQueueWithShutdown
 */
export function fromQueueWithShutdown<R, E, A>(
  queue: Dequeue<A>,
  maxChunkSize: number = DEFAULT_CHUNK_SIZE,
  __tsplusTrace?: string,
): Stream<never, never, A> {
  return Stream.fromQueue(queue, maxChunkSize).ensuring(queue.shutdown);
}

/**
 * @tsplus static fncts.io.StreamOps fromHub
 */
export function fromHub<A>(
  hub: Lazy<Hub<A>>,
  maxChunkSize = DEFAULT_CHUNK_SIZE,
  __tsplusTrace?: string,
): Stream<never, never, A> {
  return Stream.scoped(hub().subscribe).flatMap((queue) => Stream.fromQueueWithShutdown(queue, maxChunkSize));
}

/**
 * @tsplus static fncts.io.StreamOps fromHubScoped
 */
export function fromHubScoped<A>(
  hub: Lazy<Hub<A>>,
  maxChunkSize = DEFAULT_CHUNK_SIZE,
  __tsplusTrace?: string,
): IO<Scope, never, Stream<never, never, A>> {
  return IO.defer(hub().subscribe.map((queue) => Stream.fromQueueWithShutdown(queue, maxChunkSize)));
}

/**
 * Halt a stream with the specified exception
 *
 * @tsplus static fncts.io.StreamOps haltNow
 */
export function haltNow(u: unknown, __tsplusTrace?: string): Stream<never, never, never> {
  return new Stream(Channel.halt(u));
}

/**
 * Halt a stream with the specified exception
 *
 * @tsplus static fncts.io.StreamOps halt
 */
export function halt(u: Lazy<unknown>, __tsplusTrace?: string): Stream<never, never, never> {
  return new Stream(Channel.halt(u));
}

function haltWhenWriter<E, A, E1>(
  fiber: Fiber<E1, any>,
  __tsplusTrace?: string,
): Channel<never, E | E1, Conc<A>, unknown, E | E1, Conc<A>, void> {
  return Channel.unwrap(
    fiber.poll.map((maybeExit) =>
      maybeExit.match(
        () =>
          Channel.readWith(
            (i: Conc<A>) => Channel.writeNow(i).apSecond(haltWhenWriter<E, A, E1>(fiber)),
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
 * @tsplus fluent fncts.io.Stream haltWhen
 */
export function haltWhen_<R, E, A, R1, E1>(
  fa: Stream<R, E, A>,
  io: IO<R1, E1, any>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return new Stream(Channel.unwrapScoped(io.forkScoped.map((fiber) => fa.channel.pipeTo(haltWhenWriter(fiber)))));
}

function haltWhenFutureWriter<R, E, A, E1>(
  future: Future<E1, unknown>,
  __tsplusTrace?: string,
): Channel<R, E | E1, Conc<A>, unknown, E | E1, Conc<A>, void> {
  return Channel.unwrap(
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
  );
}

/**
 * Halts the evaluation of this stream when the provided promise resolves.
 *
 * If the promise completes with a failure, the stream will emit that failure.
 *
 * @tsplus fluent fncts.io.Stream haltWhen
 */
export function haltWhenFuture_<R, E, A, E1>(
  fa: Stream<R, E, A>,
  future: Future<E1, any>,
  __tsplusTrace?: string,
): Stream<R, E | E1, A> {
  return new Stream(fa.channel.pipeTo(haltWhenFutureWriter(future)));
}

/**
 * @tsplus fluent fncts.io.Stream interleave
 */
export function interleave_<R, E, A, R1, E1, B>(
  sa: Stream<R, E, A>,
  sb: Stream<R1, E1, B>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A | B> {
  return sa.interleaveWith(sb, Stream.fromChunk(Conc(true, false)).forever);
}

function interleaveWithProducer<E, A>(
  handoff: Handoff<Take<E, A>>,
  __tsplusTrace?: string,
): Channel<never, E, A, unknown, never, never, void> {
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
 * @tsplus fluent fncts.io.Stream interleaveWith
 */
export function interleaveWith_<R, E, A, R1, E1, B, R2, E2>(
  sa: Stream<R, E, A>,
  sb: Stream<R1, E1, B>,
  b: Stream<R2, E2, boolean>,
  __tsplusTrace?: string,
): Stream<R | R1 | R2, E | E1 | E2, A | B> {
  return new Stream(
    Channel.unwrapScoped(
      Do((Δ) => {
        const left  = Δ(Handoff<Take<E, A>>());
        const right = Δ(Handoff<Take<E1, B>>());
        Δ(sa.channel.concatMap(Channel.writeChunk).pipeTo(interleaveWithProducer(left)).runScoped.fork);
        Δ(sb.channel.concatMap(Channel.writeChunk).pipeTo(interleaveWithProducer(right)).runScoped.fork);
        return tuple(left, right);
      }).map(([left, right]) => {
        const process = (
          leftDone: boolean,
          rightDone: boolean,
        ): Channel<R | R1 | R2, E | E1 | E2, boolean, unknown, E | E1 | E2, Conc<A | B>, void> =>
          Channel.readWithCause(
            (b: boolean) => {
              if (b && !leftDone) {
                return Channel.fromIO(left.take).flatMap((take) =>
                  take.match(rightDone ? Channel.unit : process(true, rightDone), Channel.failCauseNow, (chunk) =>
                    Channel.writeNow(chunk).apSecond(process(leftDone, rightDone)),
                  ),
                );
              }
              if (!b && !rightDone) {
                return Channel.fromIO(right.take).flatMap((take) =>
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
      }),
    ),
  );
}

function intersperseWriter<R, E, A, A1>(
  middle: A1,
  isFirst: boolean,
  __tsplusTrace?: string,
): Channel<R, E, Conc<A>, unknown, E, Conc<A | A1>, void> {
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
export function intersperse_<R, E, A, A1>(
  stream: Stream<R, E, A>,
  middle: A1,
  __tsplusTrace?: string,
): Stream<R, E, A | A1> {
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
 * @tsplus fluent fncts.io.Stream interruptWhen
 */
export function interruptWhen_<R, E, A, R1, E1>(
  stream: Stream<R, E, A>,
  io: IO<R1, E1, any>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return new Stream(stream.channel.interruptWhen(io));
}

/**
 * @tsplus fluent fncts.io.Stream interruptWhen
 */
export function interruptWhenFuture_<R, E, A, E1>(
  fa: Stream<R, E, A>,
  future: Future<E1, unknown>,
  __tsplusTrace?: string,
): Stream<R, E | E1, A> {
  return new Stream(fa.channel.interruptWhen(future));
}

/**
 * Transforms the elements of this stream using the supplied function.
 *
 * @tsplus fluent fncts.io.Stream map
 */
export function map_<R, E, A, B>(stream: Stream<R, E, A>, f: (o: A) => B, __tsplusTrace?: string): Stream<R, E, B> {
  return new Stream(stream.channel.mapOut((as) => as.map(f)));
}

function mapAccumAccumulator<S, E = never, A = never, B = never>(
  currS: S,
  f: (s: S, a: A) => readonly [S, B],
  __tsplusTrace?: string,
): Channel<never, E, Conc<A>, unknown, E, Conc<B>, void> {
  return Channel.readWith(
    (inp: Conc<A>) => {
      const [nextS, bs] = inp.mapAccum(currS, f);
      return Channel.writeNow(bs).apSecond(mapAccumAccumulator(nextS, f));
    },
    Channel.failNow,
    () => Channel.unit,
  );
}

/**
 * Statefully maps over the elements of this stream to produce new elements.
 *
 * @tsplus fluent fncts.io.Stream mapAccum
 */
export function mapAccum_<R, E, A, S, B>(
  stream: Stream<R, E, A>,
  s: S,
  f: (s: S, a: A) => readonly [S, B],
  __tsplusTrace?: string,
): Stream<R, E, B> {
  return new Stream(stream.channel.pipeTo(mapAccumAccumulator(s, f)));
}

function mapAccumIOAccumulator<R, E, A, R1, E1, S, B>(
  s: S,
  f: (s: S, a: A) => IO<R1, E1, readonly [B, S]>,
  __tsplusTrace?: string,
): Channel<R | R1, E, Conc<A>, unknown, E | E1, Conc<B>, void> {
  return Channel.readWith(
    (inp: Conc<A>) =>
      Channel.unwrap(
        IO.defer(() => {
          const outputChunk = Conc.builder<B>();
          const emit        = (b: B) =>
            IO.succeed(() => {
              outputChunk.append(b);
            });
          return IO.foldLeft(inp, s, (s1, a) => f(s1, a).flatMap(([b, s2]) => emit(b).as(s2))).match(
            (e) => {
              const partialResult = outputChunk.result();
              return partialResult.isNonEmpty
                ? Channel.writeNow(partialResult).apSecond(Channel.failNow(e))
                : Channel.failNow(e);
            },
            (s) => Channel.writeNow(outputChunk.result()).apSecond(mapAccumIOAccumulator<R, E, A, R1, E1, S, B>(s, f)),
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
 * @tsplus fluent fncts.io.Stream mapAccumIO
 */
export function mapAccumIO_<R, E, A, R1, E1, S, B>(
  stream: Stream<R, E, A>,
  s: S,
  f: (s: S, a: A) => IO<R1, E1, readonly [B, S]>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return new Stream(stream.channel.pipeTo(mapAccumIOAccumulator(s, f)));
}

/**
 * Transforms the chunks emitted by this stream.
 *
 * @tsplus fluent fncts.io.Stream mapChunks
 */
export function mapChunks_<R, E, A, A1>(
  stream: Stream<R, E, A>,
  f: (chunk: Conc<A>) => Conc<A1>,
  __tsplusTrace?: string,
): Stream<R, E, A1> {
  return new Stream(stream.channel.mapOut(f));
}

/**
 * Effectfully transforms the chunks emitted by this stream.
 *
 * @tsplus fluent fncts.io.Stream mapChunksIO
 */
export function mapChunksIO_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  f: (chunk: Conc<A>) => IO<R1, E1, Conc<B>>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return new Stream(stream.channel.mapOutIO(f));
}

/**
 * Maps each element to an iterable, and flattens the iterables into the
 * output of this stream.
 *
 * @tsplus fluent fncts.io.Stream mapConcat
 */
export function mapConcat_<R, E, A, B>(
  stream: Stream<R, E, A>,
  f: (a: A) => Iterable<B>,
  __tsplusTrace?: string,
): Stream<R, E, B> {
  return stream.mapConcatChunk((a) => Conc.from(f(a)));
}

/**
 * Maps each element to a chunk, and flattens the chunks into the output of
 * this stream.
 *
 * @tsplus fluent fncts.io.Stream mapConcatChunk
 */
export function mapConcatChunk_<R, E, A, B>(
  stream: Stream<R, E, A>,
  f: (a: A) => Conc<B>,
  __tsplusTrace?: string,
): Stream<R, E, B> {
  return stream.mapChunks((c) => c.flatMap(f));
}

/**
 * Effectfully maps each element to a chunk, and flattens the chunks into
 * the output of this stream.
 *
 * @tsplus fluent fncts.io.Stream mapConcatChunkIO
 */
export function mapConcatChunkIO_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, Conc<B>>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return stream.mapIO(f).mapConcatChunk(identity);
}

/**
 * Effectfully maps each element to an iterable, and flattens the iterables into
 * the output of this stream.
 *
 * @tsplus fluent fncts.io.Stream mapConcatIO
 */
export function mapConcatIO_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, Iterable<B>>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return stream.mapIO((a) => f(a).map(Conc.from)).mapConcatChunk(identity);
}

/**
 * Transforms the errors emitted by this stream using `f`.
 *
 * @tsplus fluent fncts.io.Stream mapError
 */
export function mapError_<R, E, E1, A>(
  stream: Stream<R, E, A>,
  f: (e: E) => E1,
  __tsplusTrace?: string,
): Stream<R, E1, A> {
  return new Stream(stream.channel.mapError(f));
}

/**
 * Transforms the full causes of failures emitted by this stream.
 *
 * @tsplus fluent fncts.io.Stream mapErrorCause
 */
export function mapErrorCause_<R, E, A, E1>(
  fa: Stream<R, E, A>,
  f: (e: Cause<E>) => Cause<E1>,
  __tsplusTrace?: string,
): Stream<R, E1, A> {
  return new Stream(fa.channel.mapErrorCause(f));
}

/**
 * Maps over elements of the stream with the specified effectful function.
 *
 * @tsplus fluent fncts.io.Stream mapIO
 */
export function mapIO_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return new Stream(stream.channel.pipeTo(mapIOLoop(Iterable.empty<A>()[Symbol.iterator](), f)));
}

function mapIOLoop<R, E, A, R1, E1, B>(
  iterator: Iterator<A>,
  f: (a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string,
): Channel<R | R1, E, Conc<A>, unknown, E | E1, Conc<B>, unknown> {
  const next = iterator.next();
  if (next.done) {
    return Channel.readWithCause(
      (elem) => mapIOLoop(elem[Symbol.iterator](), f),
      Channel.failCauseNow,
      Channel.succeedNow,
    );
  } else {
    return Channel.unwrap(
      f(next.value).map((b) => Channel.writeNow(Conc.single(b)) > mapIOLoop<R, E, A, R1, E1, B>(iterator, f)),
    );
  }
}

/**
 * Maps over elements of the stream with the specified effectful function,
 * executing up to `n` invocations of `f` concurrently. Transformed elements
 * will be emitted in the original order.
 *
 * @note This combinator destroys the chunking structure. It's recommended to use chunkN afterwards.
 *
 * @tsplus fluent fncts.io.Stream mapIOC
 */
export function mapIOC_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  n: number,
  f: (a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return new Stream(stream.channel.concatMap(Channel.writeChunk).mapOutIOC(n, f).mapOut(Conc.single));
}

/**
 * Maps each element of this stream to another stream and returns the
 * non-deterministic merge of those streams, executing up to `n` inner streams
 * concurrently. Up to `bufferSize` elements of the produced streams may be
 * buffered in memory by this operator.
 *
 * @tsplus fluent fncts.io.Stream mergeMap
 */
export function mergeMap_<R, E, A, R1, E1, B>(
  ma: Stream<R, E, A>,
  f: (a: A) => Stream<R1, E1, B>,
  n: number,
  bufferSize = 16,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return new Stream(ma.channel.concatMap(Channel.writeChunk).mergeMap((a) => f(a).channel, n, bufferSize));
}

/**
 * Maps over elements of the stream with the specified effectful function,
 * executing up to `n` invocations of `f` concurrently. The element order
 * is not enforced by this combinator, and elements may be reordered.
 *
 * @tsplus fluent fncts.io.Stream mergeMapIO
 */
export function mergeMapIO_<R, E, A, R1, E1, B>(
  stream: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, B>,
  n: number,
  bufferSize = 16,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return stream.mergeMap((a) => Stream.fromIO(f(a)), n, bufferSize);
}

/**
 * @tsplus fluent fncts.io.Stream mergeEither
 */
export function mergeEither_<R, E, A, R1, E1, B>(
  fa: Stream<R, E, A>,
  fb: Stream<R1, E1, B>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, Either<A, B>> {
  return fa.mergeWith(fb, Either.left, Either.right);
}

export function mergeWithHandler<R, E>(
  terminate: boolean,
  __tsplusTrace?: string,
): (exit: Exit<E, unknown>) => MergeDecision<R, E, unknown, E, unknown> {
  return (exit) =>
    terminate || !exit.isSuccess() ? MergeDecision.Done(IO.fromExitNow(exit)) : MergeDecision.Await(IO.fromExitNow);
}

export type TerminationStrategy = "Left" | "Right" | "Both" | "Either";

/**
 * @tsplus fluent fncts.io.Stream mergeWith
 */
export function mergeWith_<R, E, A, R1, E1, A1, B, C>(
  sa: Stream<R, E, A>,
  sb: Stream<R1, E1, A1>,
  l: (a: A) => B,
  r: (b: A1) => C,
  strategy: TerminationStrategy = "Both",
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B | C> {
  return new Stream<R | R1, E | E1, B | C>(
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
 * @tsplus fluent fncts.io.Stream onError
 */
export function onError_<R, E, A, R1>(
  stream: Stream<R, E, A>,
  cleanup: (e: Cause<E>) => IO<R1, never, any>,
  __tsplusTrace?: string,
): Stream<R | R1, E, A> {
  return stream.catchAllCause((cause) => fromIO(cleanup(cause).apSecond(IO.failCauseNow(cause))));
}

/**
 * Switches to the provided stream in case this one fails with a typed error.
 *
 * See also Stream#catchAll
 *
 * @tsplus fluent fncts.io.Stream orElse
 */
export function orElse_<R, E, A, R1, E1, A1>(
  stream: Stream<R, E, A>,
  that: Lazy<Stream<R1, E1, A1>>,
  __tsplusTrace?: string,
): Stream<R | R1, E1, A | A1> {
  return new Stream<R | R1, E1, A | A1>(stream.channel.orElse(that().channel));
}

/**
 * Switches to the provided stream in case this one fails with a typed error.
 *
 * See also ZStream#catchAll
 *
 * @tsplus fluent fncts.io.Stream orElseEither
 */
export function orElseEither_<R, E, A, R1, E1, A1>(
  stream: Stream<R, E, A>,
  that: Lazy<Stream<R1, E1, A1>>,
  __tsplusTrace?: string,
): Stream<R | R1, E1, Either<A, A1>> {
  return stream.map(Either.left).orElse(that().map(Either.right));
}

/**
 * Fails with given error in case this one fails with a typed error.
 *
 * See also Stream#catchAll
 *
 * @tsplus fluent fncts.io.Stream orElseFail
 */
export function orElseFail_<R, E, A, E1>(
  stream: Stream<R, E, A>,
  e: Lazy<E1>,
  __tsplusTrace?: string,
): Stream<R, E1, A> {
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
  __tsplusTrace?: string,
): Stream<R | R1, Maybe<E | E1>, A | A1> {
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
 * @tsplus fluent fncts.io.Stream orElseSucceed
 */
export function orElseSucceed_<R, E, A, A1>(
  stream: Stream<R, E, A>,
  a: Lazy<A1>,
  __tsplusTrace?: string,
): Stream<R, never, A | A1> {
  return stream.orElse(Stream.succeedNow(a()));
}

/**
 * @tsplus fluent fncts.io.Stream pipeThrough
 */
export function pipeThrough_<R, E, A, R1, E1, L, Z>(
  ma: Stream<R, E, A>,
  sa: Sink<R1, E1, A, L, Z>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, L> {
  return new Stream(ma.channel.pipeToOrFail(sa.channel));
}

/**
 * Provides the stream with its required environment, which eliminates
 * its dependency on `R`.
 *
 * @tsplus fluent fncts.io.Stream provideEnvironment
 */
export function provideEnvironment_<R, E, A>(
  ra: Stream<R, E, A>,
  r: Environment<R>,
  __tsplusTrace?: string,
): Stream<never, E, A> {
  return new Stream(ra.channel.provideEnvironment(r));
}

/**
 * @tsplus fluent fncts.io.Stream provideLayer
 */
export function provideLayer_<RIn, E, ROut, E1, A>(
  self: Stream<ROut, E, A>,
  layer: Layer<RIn, E1, ROut>,
  __tsplusTrace?: string,
): Stream<RIn, E | E1, A> {
  return new Stream(Channel.unwrapScoped(layer.build.map((r) => self.channel.provideEnvironment(r))));
}

/**
 * @tsplus fluent fncts.io.Stream provideSomeLayer
 */
export function provideSomeLayer_<R, E, A, RIn, E1, ROut>(
  self: Stream<R, E, A>,
  layer: Layer<RIn, E1, ROut>,
  __tsplusTrace?: string,
): Stream<RIn | Exclude<R, ROut>, E | E1, A> {
  // @ts-expect-error
  return self.provideLayer(Layer.environment<RIn>().and(layer));
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

  emitOfNotEmpty(): Channel<never, unknown, unknown, unknown, never, Conc<A>, void> {
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

function rechunkProcess<E, In>(
  rechunker: Rechunker<In>,
  target: number,
  __tsplusTrace?: string,
): Channel<never, E, Conc<In>, unknown, E, Conc<In>, unknown> {
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
 * @tsplus fluent fncts.io.Stream rechunk
 */
export function rechunk_<R, E, A>(stream: Stream<R, E, A>, n: number, __tsplusTrace?: string): Stream<R, E, A> {
  return new Stream(stream.channel.pipeTo(rechunkProcess(new Rechunker(n), n)));
}

/**
 * Repeats the provided value infinitely.
 *
 * @tsplus static fncts.io.StreamOps repeatValue
 */
export function repeatValue<A>(a: A, __tsplusTrace?: string): Stream<unknown, never, A> {
  return new Stream(Channel.writeNow(Conc.single(a)).repeated);
}

/**
 * Creates a stream from an effect producing a value of type `A` which repeats forever.
 *
 * @tsplus static fncts.io.StreamOps repeatIO
 */
export function repeatIO<R, E, A>(fa: IO<R, E, A>, __tsplusTrace?: string): Stream<R, E, A> {
  return Stream.repeatIOMaybe(fa.mapError(Maybe.just));
}

/**
 * Creates a stream from an effect producing values of type `A` until it fails with None.
 *
 * @tsplus static fncts.io.StreamOps repeatIOMaybe
 */
export function repeatIOMaybe<R, E, A>(fa: IO<R, Maybe<E>, A>, __tsplusTrace?: string): Stream<R, E, A> {
  return repeatIOChunkMaybe(fa.map(Conc.single));
}

/**
 * Creates a stream from an effect producing chunks of `A` values which repeats forever.
 *
 * @tsplus static fncts.io.StreamOps repeatIOChunk
 */
export function repeatIOChunk<R, E, A>(fa: IO<R, E, Conc<A>>, __tsplusTrace?: string): Stream<R, E, A> {
  return repeatIOChunkMaybe(fa.mapError(Maybe.just));
}

/**
 * Creates a stream from an effect producing chunks of `A` values until it fails with None.
 *
 * @tsplus static fncts.io.StreamOps repeatIOChunkMaybe
 */
export function repeatIOChunkMaybe<R, E, A>(fa: IO<R, Maybe<E>, Conc<A>>, __tsplusTrace?: string): Stream<R, E, A> {
  return Stream.unfoldChunkIO(undefined, (_) =>
    fa
      .map((chunk) => Maybe.just(tuple(chunk, undefined)))
      .catchAll((maybeError) => maybeError.match(() => IO.succeedNow(Nothing()), IO.failNow)),
  );
}

/**
 * Runs the sink on the stream to produce either the sink's result or an error.
 *
 * @tsplus fluent fncts.io.Stream run
 */
export function run_<R, E, A, R2, E2, Z>(
  stream: Stream<R, E, A>,
  sink: Sink<R2, E2, A, unknown, Z>,
  __tsplusTrace?: string,
): IO<R | R2, E | E2, Z> {
  return stream.channel.pipeToOrFail(sink.channel).runDrain;
}

/**
 * Runs the stream and collects all of its elements to a chunk.
 *
 * @tsplus getter fncts.io.Stream runCollect
 */
export function runCollect<R, E, A>(stream: Stream<R, E, A>, __tsplusTrace?: string): IO<R, E, Conc<A>> {
  return stream.run(Sink.collectAll());
}

/**
 * Runs the stream and collects ignore its elements.
 *
 * @tsplus getter fncts.io.Stream runDrain
 */
export function runDrain<R, E, A>(stream: Stream<R, E, A>, __tsplusTrace?: string): IO<R, E, void> {
  return stream.run(Sink.drain);
}

/**
 * @tsplus fluent fncts.io.Stream runForeachScoped
 */
export function runForeachScoped_<R, E, A, R2, E2>(
  self: Stream<R, E, A>,
  f: (a: A) => IO<R2, E2, any>,
  __tsplusTrace?: string,
): IO<R | R2 | Scope, E | E2, void> {
  return self.runScoped(Sink.foreach(f));
}

/**
 * Like `into`, but provides the result as a `Managed` to allow for scope
 * composition.
 *
 * @tsplus fluent fncts.io.Stream runIntoElementsScoped
 */
export function runIntoElementsScoped_<R, E, A, E1>(
  stream: Stream<R, E, A>,
  queue: Queue<Exit<Maybe<E | E1>, A>>,
  __tsplusTrace?: string,
): IO<R | Scope, E | E1, void> {
  const writer: Channel<R, E, Conc<A>, unknown, never, Exit<Maybe<E | E1>, A>, unknown> = Channel.readWith(
    (inp: Conc<A>) =>
      inp
        .foldLeft(
          Channel.unit as Channel<never, unknown, unknown, unknown, never, Exit<Maybe<E | E1>, A>, unknown>,
          (channel, a) => channel.apSecond(Channel.writeNow(Exit.succeed(a))),
        )
        .apSecond(writer),
    (err) => Channel.writeNow(Exit.fail(Just(err))),
    () => Channel.writeNow(Exit.fail(Nothing())),
  );
  return stream.channel.pipeTo(writer).mapOutIO((exit) => queue.offer(exit)).drain.runScoped.asUnit;
}

/**
 * Like `Stream#into`, but provides the result as a `Managed` to allow for scope
 * composition.
 *
 * @tsplus fluent fncts.io.Stream runIntoQueueScoped
 */
export function runIntoQueueScoped_<R, E extends E1, E1, A>(
  stream: Stream<R, E, A>,
  queue: Enqueue<Take<E1, A>>,
  __tsplusTrace?: string,
): IO<R | Scope, E | E1, void> {
  const writer: Channel<R, E, Conc<A>, unknown, E, Take<E | E1, A>, any> = Channel.readWithCause(
    (inp) => Channel.writeNow(Take.chunk(inp)).apSecond(writer),
    (cause) => Channel.writeNow(Take.failCause(cause)),
    (_) => Channel.writeNow(Take.end),
  );

  return stream.channel.pipeTo(writer).mapOutIO((take) => queue.offer(take)).drain.runScoped.asUnit;
}

/**
 * Like `Stream#runIntoHub`, but provides the result as a `Managed` to allow for scope
 * composition.
 *
 * @tsplus fluent fncts.io.Stream runIntoHubScoped
 */
export function runIntoHubScoped_<R, E extends E1, E1, A>(
  stream: Stream<R, E, A>,
  hub: Hub<Take<E1, A>>,
  __tsplusTrace?: string,
): IO<R | Scope, E | E1, void> {
  return stream.runIntoQueueScoped(hub);
}

/**
 * Runs the sink on the stream to produce either the sink's result or an error.
 *
 * @tsplus fluent fncts.io.Stream runScoped
 */
export function runScoped_<R, E, A, R2, E2, Z>(
  stream: Stream<R, E, A>,
  sink: Sink<R2, E2, A, unknown, Z>,
  __tsplusTrace?: string,
): IO<R | R2 | Scope, E | E2, Z> {
  return stream.channel.pipeToOrFail(sink.channel).drain.runScoped;
}

/**
 * Statefully maps over the elements of this stream to produce all intermediate results
 * of type `B` given an initial B.
 *
 * @tsplus fluent fncts.io.Stream scan
 */
export function scan_<R, E, A, B>(
  sa: Stream<R, E, A>,
  b: B,
  f: (b: B, a: A) => B,
  __tsplusTrace?: string,
): Stream<R, E, B> {
  return sa.scanIO(b, (b, a) => IO.succeedNow(f(b, a)));
}

/**
 * Statefully and effectfully maps over the elements of this stream to produce all
 * intermediate results of type `B` given an initial B.
 *
 * @tsplus fluent fncts.io.Stream scanIO
 */
export function scanIO_<R, E, A, R1, E1, B>(
  sa: Stream<R, E, A>,
  b: B,
  f: (b: B, a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
  return Stream.succeedNow(b).concat(sa.mapAccumIO(b, (b, a) => f(b, a).map((b) => [b, b])));
}

/**
 * Statefully maps over the elements of this stream to produce all
 * intermediate results.
 *
 * @tsplus fluent fncts.io.Stream scanReduce
 */
export function scanReduce_<R, E, A extends B, B>(
  fa: Stream<R, E, A>,
  f: (b: B, a: A) => B,
  __tsplusTrace?: string,
): Stream<R, E, B> {
  return fa.scanReduceIO((b, a) => IO.succeedNow(f(b, a)));
}

/**
 * Statefully and effectfully maps over the elements of this stream to produce
 * all intermediate results.
 *
 * @tsplus fluent fncts.io.Stream scanReduceIO
 */
export function scanReduceIO_<R, E, A extends B, R1, E1, B>(
  fa: Stream<R, E, A>,
  f: (b: B, a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, B> {
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
 * @tsplus static fncts.io.StreamOps succeedNow
 */
export function succeedNow<O>(o: O, __tsplusTrace?: string): Stream<never, never, O> {
  return fromChunkNow(Conc.single(o));
}

/**
 * Creates a single-valued pure stream
 *
 * @tsplus static fncts.io.StreamOps succeed
 */
export function succeed<A>(a: Lazy<A>, __tsplusTrace?: string): Stream<never, never, A> {
  return fromChunk(Conc.single(a()));
}

function takeLoop<E, A>(n: number, __tsplusTrace?: string): Channel<never, E, Conc<A>, unknown, E, Conc<A>, unknown> {
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
 * @tsplus fluent fncts.io.Stream take
 */
export function take_<R, E, A>(stream: Stream<R, E, A>, n: number, __tsplusTrace?: string): Stream<R, E, A> {
  if (n <= 0) {
    return empty;
  }
  if (!Number.isInteger(n)) {
    return halt(new IllegalArgumentError(`${n} should be an integer`, "Stream.take"));
  }
  return new Stream(stream.channel.pipeTo(takeLoop(n)));
}

/**
 * @tsplus fluent fncts.io.Stream takeUntilIO
 */
export function takeUntilIO_<R, E, A, R1, E1>(
  ma: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return new Stream(ma.channel.pipeTo(takeUntilIOLoop(Iterable.empty<A>()[Symbol.iterator](), f)));
}

function takeUntilIOLoop<E, A, R1, E1>(
  iterator: Iterator<A>,
  f: (a: A) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): Channel<R1, E, Conc<A>, unknown, E | E1, Conc<A>, unknown> {
  const next = iterator.next();
  if (next.done) {
    return Channel.readWithCause(
      (elem) => takeUntilIOLoop(elem[Symbol.iterator](), f),
      Channel.failCauseNow,
      Channel.succeedNow,
    );
  } else {
    return Channel.unwrap(
      f(next.value).map((b) =>
        b
          ? Channel.writeNow(Conc.single(next.value))
          : Channel.writeNow(Conc.single(next.value)) > takeUntilIOLoop<E, A, R1, E1>(iterator, f),
      ),
    );
  }
}

function takeUntilLoop<R, E, A>(
  p: Predicate<A>,
  __tsplusTrace?: string,
): Channel<R, E, Conc<A>, unknown, E, Conc<A>, unknown> {
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
 * @tsplus fluent fncts.io.Stream takeUntil
 */
export function takeUntil_<R, E, A>(fa: Stream<R, E, A>, p: Predicate<A>, __tsplusTrace?: string): Stream<R, E, A> {
  return new Stream(fa.channel.pipeTo(takeUntilLoop(p)));
}

/**
 * @tsplus fluent fncts.io.Stream tap
 */
export function tap_<R, E, A, R1, E1>(
  ma: Stream<R, E, A>,
  f: (a: A) => IO<R1, E1, any>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return ma.mapIO((a) => f(a).as(a));
}

/**
 * Throttles the chunks of this stream according to the given bandwidth parameters using the token bucket
 * algorithm. Allows for burst in the processing of elements by allowing the token bucket to accumulate
 * tokens up to a `units + burst` threshold. Chunks that do not meet the bandwidth constraints are dropped.
 * The weight of each chunk is determined by the `costFn` function.
 *
 * @tsplus fluent fncts.io.Stream throttleEnforce
 */
export function throttleEnforce_<R, E, A>(
  sa: Stream<R, E, A>,
  costFn: (chunk: Conc<A>) => number,
  units: number,
  duration: number,
  burst = 0,
  __tsplusTrace?: string,
): Stream<R, E, A> {
  return sa.throttleEnforceIO((chunk) => IO.succeedNow(costFn(chunk)), units, duration, burst);
}

function throttleEnforceIOLoop<E, A, R1, E1>(
  costFn: (chunk: Conc<A>) => IO<R1, E1, number>,
  units: number,
  duration: number,
  burst: number,
  tokens: number,
  timestamp: number,
  __tsplusTrace?: string,
): Channel<R1, E | E1, Conc<A>, unknown, E | E1, Conc<A>, void> {
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
            ? Channel.writeNow(inp).apSecond(
                throttleEnforceIOLoop<E, A, R1, E1>(costFn, units, duration, burst, available - weight, current),
              )
            : throttleEnforceIOLoop<E, A, R1, E1>(costFn, units, duration, burst, available - weight, current);
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
 * @tsplus fluent fncts.io.Stream throttleEnforceIO
 */
export function throttleEnforceIO_<R, E, A, R1, E1>(
  sa: Stream<R, E, A>,
  costFn: (chunk: Conc<A>) => IO<R1, E1, number>,
  units: number,
  duration: number,
  burst = 0,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return new Stream(
    Channel.fromIO(Clock.currentTime).flatMap((current) =>
      sa.channel.pipeTo(throttleEnforceIOLoop(costFn, units, duration, burst, units, current)),
    ),
  );
}

/**
 * Converts the stream to a managed hub of chunks. After the managed hub is used,
 * the hub will never again produce values and should be discarded.
 *
 * @tsplus fluent fncts.io.Stream toHub
 */
export function toHub_<R, E, A>(
  stream: Stream<R, E, A>,
  capacity: number,
  __tsplusTrace?: string,
): IO<R | Scope, never, Hub<Take<E, A>>> {
  return Do((Δ) => {
    const hub = Δ(IO.acquireRelease(Hub.makeBounded<Take<E, A>>(capacity), (_) => _.shutdown));
    Δ(stream.runIntoHubScoped(hub).fork);
    return hub;
  });
}

/**
 * Interpret the stream as a managed pull
 *
 * @tsplus getter fncts.io.Stream toPull
 */
export function toPull<R, E, A>(
  stream: Stream<R, E, A>,
  __tsplusTrace?: string,
): IO<R | Scope, never, IO<R, Maybe<E>, Conc<A>>> {
  return stream.channel.toPull.map((io) =>
    io.mapError(Maybe.just).flatMap((r) => r.match(() => IO.failNow(Nothing()), IO.succeedNow)),
  );
}

/**
 * Converts the stream to a managed queue of chunks. After the managed queue is used,
 * the queue will never again produce values and should be discarded.
 *
 * @tsplus fluent fncts.io.Stream toQueue
 */
export function toQueue_<R, E, A>(
  stream: Stream<R, E, A>,
  capacity = 2,
  __tsplusTrace?: string,
): IO<R | Scope, never, Dequeue<Take<E, A>>> {
  return Do((Δ) => {
    const queue = Δ(IO.acquireRelease(Queue.makeBounded<Take<E, A>>(capacity), (_) => _.shutdown));
    Δ(stream.runIntoQueueScoped(queue).fork);
    return queue;
  });
}

/**
 * @tsplus fluent fncts.io.Stream toQueueDropping
 */
export function toQueueDropping_<R, E, A>(
  stream: Stream<R, E, A>,
  capacity = 2,
  __tsplusTrace?: string,
): IO<R | Scope, never, Dequeue<Take<E, A>>> {
  return Do((Δ) => {
    const queue = Δ(IO.acquireRelease(Queue.makeDropping<Take<E, A>>(capacity), (_) => _.shutdown));
    Δ(stream.runIntoQueueScoped(queue).fork);
    return queue;
  });
}

/**
 * @tsplus fluent fncts.io.Stream toQueueOfElements
 */
export function toQueueOfElements_<R, E, A>(
  stream: Stream<R, E, A>,
  capacity = 2,
  __tsplusTrace?: string,
): IO<R | Scope, never, Dequeue<Exit<Maybe<E>, A>>> {
  return Do((Δ) => {
    const queue = Δ(IO.acquireRelease(Queue.makeBounded<Exit<Maybe<E>, A>>(capacity), (_) => _.shutdown));
    Δ(stream.runIntoElementsScoped(queue).fork);
    return queue;
  });
}

/**
 * @tsplus fluent fncts.io.Stream toQueueSliding
 */
export function toQueueSliding_<R, E, A>(
  stream: Stream<R, E, A>,
  capacity = 2,
  __tsplusTrace?: string,
): IO<R | Scope, never, Dequeue<Take<E, A>>> {
  return Do((Δ) => {
    const queue = Δ(IO.acquireRelease(Queue.makeSliding<Take<E, A>>(capacity), (_) => _.shutdown));
    Δ(stream.runIntoQueueScoped(queue).fork);
    return queue;
  });
}

/**
 * Converts the stream into an unbounded managed queue. After the managed queue
 * is used, the queue will never again produce values and should be discarded.
 *
 * @tsplus getter fncts.io.Stream toQueueUnbounded
 */
export function toQueueUnbounded<R, E, A>(
  stream: Stream<R, E, A>,
  __tsplusTrace?: string,
): IO<R | Scope, never, Queue<Take<E, A>>> {
  return Do((Δ) => {
    const queue = Δ(IO.acquireRelease(Queue.makeUnbounded<Take<E, A>>(), (_) => _.shutdown));
    Δ(stream.runIntoQueueScoped(queue).fork);
    return queue;
  });
}

function unfoldChunkIOLoop<S, R, E, A>(
  s: S,
  f: (s: S) => IO<R, E, Maybe<readonly [Conc<A>, S]>>,
  __tsplusTrace?: string,
): Channel<R, unknown, unknown, unknown, E, Conc<A>, unknown> {
  return Channel.unwrap(
    f(s).map((m) =>
      m.match(
        () => Channel.unit,
        ([as, s]) => Channel.writeNow(as).flatMap(() => unfoldChunkIOLoop(s, f)),
      ),
    ),
  );
}

/**
 * Creates a stream by effectfully peeling off the "layers" of a value of type `S`
 *
 * @tsplus static fncts.io.StreamOps unfoldChunkIO
 */
export function unfoldChunkIO<R, E, A, S>(
  s: S,
  f: (s: S) => IO<R, E, Maybe<readonly [Conc<A>, S]>>,
  __tsplusTrace?: string,
): Stream<R, E, A> {
  return new Stream(unfoldChunkIOLoop(s, f));
}

/**
 * Creates a stream by effectfully peeling off the "layers" of a value of type `S`
 *
 * @tsplus static fncts.io.StreamOps unfoldIO
 */
export function unfoldIO<S, R, E, A>(
  s: S,
  f: (s: S) => IO<R, E, Maybe<readonly [A, S]>>,
  __tsplusTrace?: string,
): Stream<R, E, A> {
  return unfoldChunkIO(s, (_) => f(_).map((m) => m.map(([a, s]) => tuple(Conc.single(a), s))));
}

function unfoldChunkLoop<S, A>(
  s: S,
  f: (s: S) => Maybe<readonly [Conc<A>, S]>,
  __tsplusTrace?: string,
): Channel<never, unknown, unknown, unknown, never, Conc<A>, unknown> {
  return f(s).match(
    () => Channel.unit,
    ([as, s]) => Channel.writeNow(as).flatMap(() => unfoldChunkLoop(s, f)),
  );
}

/**
 * @tsplus static fncts.io.StreamOps unfoldChunk
 */
export function unfoldChunk<S, A>(
  s: S,
  f: (s: S) => Maybe<readonly [Conc<A>, S]>,
  __tsplusTrace?: string,
): Stream<never, never, A> {
  return new Stream(Channel.defer(unfoldChunkLoop(s, f)));
}

/**
 * @tsplus static fncts.io.StreamOps unfold
 */
export function unfold<S, A>(
  s: S,
  f: (s: S) => Maybe<readonly [A, S]>,
  __tsplusTrace?: string,
): Stream<never, never, A> {
  return Stream.unfoldChunk(s, (s) => f(s).map(([a, s]) => tuple(Conc.single(a), s)));
}

/**
 * Creates a stream produced from an IO
 *
 * @tsplus static fncts.io.StreamOps unwrap
 */
export function unwrap<R, E, R1, E1, A>(
  stream: IO<R, E, Stream<R1, E1, A>>,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, A> {
  return Stream.fromIO(stream).flatten;
}

/**
 * Creates a stream produced from a managed
 *
 * @tsplus static fncts.io.StreamOps unwrapScoped
 */
export function unwrapScoped<R0, E0, R, E, A>(
  stream: IO<R0, E0, Stream<R, E, A>>,
  __tsplusTrace?: string,
): Stream<R | Exclude<R0, Scope>, E0 | E, A> {
  return Stream.scoped(stream).flatten;
}

/**
 * @tsplus getter fncts.io.Stream zipWithIndex
 */
export function zipWithIndex_<R, E, A>(
  self: Stream<R, E, A>,
  __tsplusTrace?: string,
): Stream<R, E, readonly [A, number]> {
  return self.mapAccum(0, (index, a) => [index + 1, [a, index]]);
}

/**
 * Zips the two streams so that when a value is emitted by either of the two
 * streams, it is combined with the latest value from the other stream to
 * produce a result.
 *
 * Note: tracking the latest value is done on a per-chunk basis. That means
 * that emitted elements that are not the last value in chunks will never be
 * used for zipping.
 *
 * @tsplus fluent fncts.io.Stream zipWithLatest
 */
export function zipWithLatest_<R, E, A, R1, E1, B, C>(
  fa: Stream<R, E, A>,
  fb: Stream<R1, E1, B>,
  f: (a: A, b: B) => C,
  __tsplusTrace?: string,
): Stream<R | R1, E | E1, C> {
  function pullNonEmpty<R, E, A>(pull: IO<R, Maybe<E>, Conc<A>>, __tsplusTrace?: string): IO<R, Maybe<E>, Conc<A>> {
    return pull.flatMap((chunk) => (chunk.isNonEmpty ? pullNonEmpty(pull) : IO.succeedNow(chunk)));
  }
  return Stream.fromPull(
    Do((Δ) => {
      const left  = Δ(fa.toPull.map(pullNonEmpty));
      const right = Δ(fb.toPull.map(pullNonEmpty));
      return Δ(
        Stream.fromIOMaybe(
          left.raceWith(
            right,
            (leftDone: Exit<Maybe<E | E1>, Conc<A>>, rightFiber) =>
              IO.fromExitNow(leftDone).zipWith(rightFiber.join, (l, r) => tuple(l, r, true)),
            (rightDone, leftFiber) => IO.fromExitNow(rightDone).zipWith(leftFiber.join, (r, l) => tuple(l, r, false)),
          ),
        ).flatMap(([l, r, leftFirst]) =>
          Stream.fromIO(Ref.make(tuple(l.unsafeGet(l.length - 1), r.unsafeGet(r.length - 1)))).flatMap((latest) =>
            Stream.fromChunk(
              leftFirst ? r.map((b) => f(l.unsafeGet(l.length - 1), b)) : l.map((a) => f(a, r.unsafeGet(r.length - 1))),
            ).concat(
              Stream.repeatIOMaybe(left)
                .mergeEither(Stream.repeatIOMaybe(right))
                .mapIO((ab) =>
                  ab.match(
                    (leftChunk) =>
                      latest.modify(([_, rightLatest]) =>
                        tuple(
                          leftChunk.map((a) => f(a, rightLatest)),
                          tuple(leftChunk.unsafeGet(leftChunk.length - 1), rightLatest),
                        ),
                      ),
                    (rightChunk) =>
                      latest.modify(([leftLatest, _]) =>
                        tuple(
                          rightChunk.map((b) => f(leftLatest, b)),
                          tuple(leftLatest, rightChunk.unsafeGet(rightChunk.length - 1)),
                        ),
                      ),
                  ),
                )
                .flatMap(Stream.fromChunkNow),
            ),
          ),
        ).toPull,
      );
    }),
  );
}
