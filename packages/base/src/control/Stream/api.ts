import type { Cause } from "../../data/Cause";
import type { Exit } from "../../data/Exit";
import type { Lazy } from "../../data/function";
import type { Predicate } from "../../data/Predicate";
import type { Refinement } from "../../data/Refinement";
import type { Canceler, UIO } from "../IO";
import type { PQueue } from "../Queue";

import { Conc } from "../../collection/immutable/Conc";
import { Either } from "../../data/Either";
import { constVoid, identity, tuple } from "../../data/function";
import { Maybe, Nothing } from "../../data/Maybe";
import { Channel } from "../Channel";
import { IO } from "../IO";
import { Managed } from "../Managed";
import { Queue } from "../Queue";
import { DEFAULT_CHUNK_SIZE, Stream, StreamTypeId } from "./definition";
import { Pull } from "./Pull";
import { Take } from "./Take";

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
 * Empty stream
 */
export const empty = Stream.fromChunkNow(Conc.empty<never>());

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
 * Flattens this stream-of-streams into a stream made of the concatenation in
 * strict order of all the streams.
 *
 * @tsplus getter fncts.control.Stream flatten
 */
export function flatten<R, E, R1, E1, A>(self: Stream<R, E, Stream<R1, E1, A>>): Stream<R & R1, E | E1, A> {
  return self.chain(identity);
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
 * Transforms the errors emitted by this stream using `f`.
 *
 * @tsplus fluent fncts.control.Stream mapError
 */
export function mapError_<R, E, E1, A>(stream: Stream<R, E, A>, f: (e: E) => E1): Stream<R, E1, A> {
  return new Stream(stream.channel.mapError(f));
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
 * Provides the stream with its required environment, which eliminates
 * its dependency on `R`.
 *
 * @tsplus fluent fncts.control.Stream provideEnvironment
 */
export function provideEnvironment_<R, E, A>(ra: Stream<R, E, A>, r: R): Stream<unknown, E, A> {
  return new Stream(ra.channel.provideEnvironment(r));
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
