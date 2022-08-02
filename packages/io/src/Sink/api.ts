import { AtomicReference } from "@fncts/base/internal/AtomicReference";

import { MergeDecision } from "../Channel/internal/MergeDecision.js";

/**
 * Like {@link zip}, but keeps only the result from this sink
 *
 * @tsplus fluent fncts.io.Sink apFirst
 */
export function apFirst<R, E, In, L, Z, R1, E1, In1 extends In, L1 extends L, Z1>(
  self: Sink<R, E, In, L, Z>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
): Sink<R | R1, E | E1, In & In1, L | L1, Z> {
  return self.zipWith(that, (z, _) => z);
}

/**
 * Like {@link zipC}, but keeps only the result from this sink
 *
 * @tsplus fluent fncts.io.Sink apFirstC
 */
export function apFirstC<R, E, In, L, Z, R1, E1, In1 extends In, L1 extends L, Z1>(
  self: Sink<R, E, In, L, Z>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
): Sink<R | R1, E | E1, In & In1, L | L1, Z> {
  return self.zipWithC(that, (z, _) => z);
}

/**
 * Like {@link zip}, but keeps only the result from the `that` sink
 *
 * @tsplus fluent fncts.io.Sink apSecond
 */
export function apSecond<R, E, In, L, Z, R1, E1, In1 extends In, L1 extends L, Z1>(
  self: Sink<R, E, In, L, Z>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In & In1, L | L1, Z1> {
  return self.zipWith(that, (_, z1) => z1);
}

/**
 * Like {@link zipC}, but keeps only the result from the `that` sink
 *
 * @tsplus fluent fncts.io.Sink apSecondC
 */
export function apSecondC<R, E, In, L, Z, R1, E1, In1 extends In, L1 extends L, Z1>(
  self: Sink<R, E, In, L, Z>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In & In1, L | L1, Z1> {
  return self.zipWithC(that, (_, z1) => z1);
}

/**
 * Replaces this sink's result with the provided value.
 *
 * @tsplus fluent fncts.io.Sink as
 */
export function as<R, E, In, L, Z, Z1>(
  self: Sink<R, E, In, L, Z>,
  z: Lazy<Z1>,
  __tsplusTrace?: string,
): Sink<R, E, In, L, Z1> {
  return self.map(() => z());
}

/**
 * Repeatedly runs the sink and accumulates its results into a chunk
 *
 * @tsplus fluent fncts.io.Sink collectAll
 */
export function collectAll<R, E, In extends L, L, Z>(
  self: Sink<R, E, In, L, Z>,
  __tsplusTrace?: string,
): Sink<R, E, In, L, Conc<Z>> {
  return self.collectAllWhileWith(
    Conc.empty<Z>(),
    () => true,
    (s, z) => s.append(z),
  );
}

/**
 * Repeatedly runs the sink for as long as its results satisfy the predicate
 * `p`. The sink's results will be accumulated using the stepping function
 * `f`.
 *
 * @tsplus fluent fncts.io.Sink collectAllWhileWith
 */
export function collectAllWhileWith<R, E, In extends L, L, Z, S>(
  self: Sink<R, E, In, L, Z>,
  z: Lazy<S>,
  p: Predicate<Z>,
  f: (s: S, z: Z) => S,
  __tsplusTrace?: string,
): Sink<R, E, In, L, S> {
  return new Sink(
    Channel.fromIO(Ref.make<Conc<In>>(Conc.empty()).zip(Ref.make(false))).flatMap(([leftoversRef, upstreamDoneRef]) => {
      const upstreamMarker: Channel<never, never, Conc<In>, unknown, never, Conc<In>, unknown> = Channel.readWith(
        (inp) => Channel.writeNow(inp) > upstreamMarker,
        Channel.failNow,
        (x) => Channel.fromIO(upstreamDoneRef.set(true)).as(x),
      );

      function loop(currentResult: S): Channel<R, never, Conc<In>, unknown, E, Conc<L>, S> {
        return self.channel.collectElements.matchChannel(Channel.failNow, ([leftovers, doneValue]) => {
          if (p(doneValue)) {
            return (
              Channel.fromIO(leftoversRef.set(leftovers.flatten as Conc<In>)) >
              Channel.fromIO(upstreamDoneRef.get).flatMap((upstreamDone) => {
                const accumulatedResult = f(currentResult, doneValue);
                if (upstreamDone) return Channel.writeNow(leftovers.flatten).as(accumulatedResult);
                else return loop(accumulatedResult);
              })
            );
          } else {
            return Channel.writeNow(leftovers.flatten).as(currentResult);
          }
        });
      }

      return upstreamMarker.pipeTo(Channel.bufferChunk(leftoversRef)).pipeTo(loop(z()));
    }),
  );
}

/**
 * Collects the leftovers from the stream when the sink succeeds and returns
 * them as part of the sink's result
 *
 * @tsplus getter fncts.io.Sink collectLeftover
 */
export function collectLeftover<R, E, In, L, Z>(
  self: Sink<R, E, In, L, Z>,
  __tsplusTrace?: string,
): Sink<R, E, In, never, readonly [Z, Conc<L>]> {
  return new Sink(self.channel.collectElements.map(([chunks, z]) => [z, chunks.flatten]));
}

/**
 * Transforms this sink's input elements.
 *
 * @tsplus fluent fncts.io.Sink contramap
 */
export function contramap<R, E, In, L, Z, In1>(
  self: Sink<R, E, In, L, Z>,
  f: (inp: In1) => In,
  __tsplusTrace?: string,
): Sink<R, E, In1, L, Z> {
  return self.contramapChunks((chunk) => chunk.map(f));
}

/**
 * Transforms this sink's input chunks. `f` must preserve chunking-invariance
 *
 * @tsplus fluent fncts.io.Sink contramapChunks
 */
export function contramapChunks<R, E, In, L, Z, In1>(
  self: Sink<R, E, In, L, Z>,
  f: (chunk: Conc<In1>) => Conc<In>,
  __tsplusTrace?: string,
): Sink<R, E, In1, L, Z> {
  const loop: Channel<R, never, Conc<In1>, unknown, never, Conc<In>, unknown> = Channel.readWith(
    (chunk) => Channel.writeNow(f(chunk)) > loop,
    Channel.failNow,
    Channel.succeedNow,
  );
  return new Sink(loop >>> self.channel);
}

/**
 * Effectfully transforms this sink's input chunks. `f` must preserve
 * chunking-invariance
 *
 * @tsplus fluent fncts.io.Sink contramapChunksIO
 */
export function contramapChunksIO<R, E, In, L, Z, R1, E1, In1>(
  self: Sink<R, E, In, L, Z>,
  f: (chunk: Conc<In1>) => IO<R1, E1, Conc<In>>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In1, L, Z> {
  const loop: Channel<R | R1, never, Conc<In1>, unknown, E | E1, Conc<In>, unknown> = Channel.readWith(
    (chunk) => Channel.fromIO(f(chunk)).flatMap(Channel.writeNow) > loop,
    Channel.failNow,
    Channel.succeedNow,
  );
  return new Sink(loop.pipeToOrFail(self.channel));
}

/**
 * Effectfully transforms this sink's input elements.
 *
 * @tsplus fluent fncts.io.Sink contramapIO
 */
export function contramapIO<R, E, In, L, Z, R1, E1, In1>(
  self: Sink<R, E, In, L, Z>,
  f: (inp: In1) => IO<R1, E1, In>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In1, L, Z> {
  return self.contramapChunksIO((chunk) => chunk.mapIO(f));
}

/**
 * Transforms both inputs and result of this sink using the provided
 * functions.
 *
 * @tsplus fluent fncts.io.Sink dimap
 */
export function dimap<R, E, In, L, Z, In1, Z1>(
  self: Sink<R, E, In, L, Z>,
  f: (inp: In1) => In,
  g: (z: Z) => Z1,
  __tsplusTrace?: string,
): Sink<R, E, In1, L, Z1> {
  return self.contramap(f).map(g);
}

/**
 * Transforms both input chunks and result of this sink using the provided
 * functions.
 *
 * @tsplus fluent fncts.io.Sink dimapChunks
 */
export function dimapChunks<R, E, In, L, Z, In1, Z1>(
  self: Sink<R, E, In, L, Z>,
  f: (chunk: Conc<In1>) => Conc<In>,
  g: (z: Z) => Z1,
  __tsplusTrace?: string,
): Sink<R, E, In1, L, Z1> {
  return self.contramapChunks(f).map(g);
}

/**
 * Effectfully transforms both input chunks and result of this sink using the
 * provided functions. `f` and `g` must preserve chunking-invariance
 *
 * @tsplus fluent fncts.io.Sink dimapChunksIO
 */
export function dimapChunksIO<R, E, In, L, Z, R1, E1, In1, R2, E2, Z1>(
  self: Sink<R, E, In, L, Z>,
  f: (chunk: Conc<In1>) => IO<R1, E1, Conc<In>>,
  g: (z: Z) => IO<R2, E2, Z1>,
  __tsplusTrace?: string,
): Sink<R | R1 | R2, E | E1 | E2, In1, L, Z1> {
  return self.contramapChunksIO(f).mapIO(g);
}

/**
 * Effectfully transforms both inputs and result of this sink using the
 * provided functions.
 *
 * @tsplus fluent fncts.io.Sink dimapIO
 */
export function dimapIO<R, E, In, L, Z, R1, E1, In1, R2, E2, Z1>(
  self: Sink<R, E, In, L, Z>,
  f: (inp: In1) => IO<R1, E1, In>,
  g: (z: Z) => IO<R2, E2, Z1>,
  __tsplusTrace?: string,
): Sink<R | R1 | R2, E | E1 | E2, In1, L, Z1> {
  return self.contramapIO(f).mapIO(g);
}

/**
 * Returns a lazily constructed sink that may require effects for its
 * creation.
 *
 * @tsplus static fncts.io.SinkOps defer
 */
export function defer<R, E, In, L, Z>(sink: Lazy<Sink<R, E, In, L, Z>>, __tsplusTrace?: string): Sink<R, E, In, L, Z> {
  return new Sink(Channel.defer(sink().channel));
}

const drainLoop: Channel<never, never, Conc<unknown>, unknown, never, Conc<never>, void> = Channel.readWithCause(
  () => drainLoop,
  Channel.failCauseNow,
  () => Channel.unit,
);

/**
 * A sink that ignores all of its inputs.
 *
 * @tsplus static fncts.io.SinkOps drain
 */
export const drain: Sink<never, never, unknown, never, void> = new Sink(drainLoop);

/**
 * Drops incoming elements until the predicate `p` is satisfied.
 *
 * @tsplus static fncts.io.SinkOps dropUntil
 */
export function makeDropUntil<In>(p: Predicate<In>, __tsplusTrace?: string): Sink<never, never, In, In, void> {
  const loop: Channel<never, never, Conc<In>, any, never, Conc<In>, void> = Channel.readWith(
    (inp: Conc<In>) => {
      const leftover = inp.dropUntil(p);
      const more     = leftover.isEmpty;
      if (more) {
        return loop;
      } else {
        return Channel.writeNow(leftover) > Channel.id<never, Conc<In>, void>();
      }
    },
    Channel.failNow,
    () => Channel.unit,
  );
  return new Sink(loop);
}

/**
 * Drops incoming elements until the effectful predicate `p` is satisfied.
 *
 * @tsplus static fncts.io.SinkOps dropUntilIO
 */
export function makeDropUntilIO<R, E, In>(
  p: (inp: In) => IO<R, E, boolean>,
  __tsplusTrace?: string,
): Sink<R, E, In, In, void> {
  const loop: Channel<R, E, Conc<In>, any, E, Conc<In>, void> = Channel.readWith(
    (inp: Conc<In>) =>
      Channel.unwrap(
        inp
          .dropUntilIO(p)
          .map((leftover) => (leftover.isEmpty ? loop : Channel.writeNow(leftover) > Channel.id<E, Conc<In>, void>())),
      ),
    Channel.failNow,
    () => Channel.unit,
  );
  return new Sink(loop);
}

/**
 * Drops incoming elements as long as the predicate `p` is satisfied.
 *
 * @tsplus static fncts.io.SinkOps dropWhile
 */
export function makeDropWhile<Err, In>(
  predicate: Predicate<In>,
  __tsplusTrace?: string,
): Sink<never, never, In, In, any> {
  const loop: Channel<never, never, Conc<In>, any, never, Conc<In>, any> = Channel.readWith(
    (inp: Conc<In>) => {
      const leftover = inp.dropWhile(predicate);
      const more     = leftover.isEmpty;
      if (more) {
        return loop;
      } else {
        return Channel.writeNow(leftover).apSecond(Channel.id<never, Conc<In>, any>());
      }
    },
    Channel.failNow,
    () => Channel.unit,
  );
  return new Sink(loop);
}

/**
 * Drops incoming elements as long as the effectful predicate `p` is
 * satisfied.
 *
 * @tsplus static fncts.io.SinkOps dropWhileIO
 */
export function dropWhileIO<R, E, In>(
  p: (inp: In) => IO<R, E, boolean>,
  __tsplusTrace?: string,
): Sink<R, E, In, In, void> {
  const loop: Channel<R, E, Conc<In>, any, E, Conc<In>, void> = Channel.readWith(
    (inp: Conc<In>) =>
      Channel.unwrap(
        inp
          .dropWhileIO(p)
          .map((leftover) => (leftover.isEmpty ? loop : Channel.writeNow(leftover) > Channel.id<E, Conc<In>, void>())),
      ),
    Channel.failNow,
    () => Channel.unit,
  );
  return new Sink(loop);
}

/**
 * Accesses the whole environment of the sink.
 *
 * @tsplus static fncts.io.SinkOps environment
 */
export function environment<R>(__tsplusTrace?: string): Sink<R, never, unknown, never, Environment<R>> {
  return Sink.fromIO(IO.environment<R>());
}

/**
 * Accesses the environment of the sink.
 *
 * @tsplus static fncts.io.SinkOps environmentWith
 */
export function environmentWith<R, Z>(
  f: (r: Environment<R>) => Z,
  __tsplusTrace?: string,
): Sink<R, never, unknown, never, Z> {
  return Sink.fromIO(IO.environmentWith(f));
}

/**
 * Accesses the environment of the sink in the context of an effect.
 *
 * @tsplus static fncts.io.SinkOps environmentWithIO
 */
export function environmentWithIO<R, R1, E, Z>(
  f: (r: Environment<R>) => IO<R1, E, Z>,
  __tsplusTrace?: string,
): Sink<R | R1, E, unknown, never, Z> {
  return Sink.fromIO(IO.environmentWithIO(f));
}

/**
 * Accesses the environment of the sink in the context of a sink.
 *
 * @tsplus static fncts.io.SinkOps environmentWithSink
 */
export function environmentWithSink<R, R1, E, In, L, Z>(
  f: (r: Environment<R>) => Sink<R1, E, In, L, Z>,
  __tsplusTrace?: string,
): Sink<R | R1, E, In, L, Z> {
  return new Sink(Channel.unwrap(IO.environmentWith(f.compose((s) => s.channel))));
}

/**
 * A sink that always fails with the specified error.
 *
 * @tsplus static fncts.io.SinkOps fail
 */
export function fail<E>(e: Lazy<E>, __tsplusTrace?: string): Sink<never, E, unknown, never, never> {
  return new Sink(Channel.fail(e));
}

/**
 * Creates a sink halting with a specified cause.
 *
 * @tsplus static fncts.io.SinkOps failCause
 */
export function failCause<E>(cause: Lazy<Cause<E>>, __tsplusTrace?: string): Sink<never, E, unknown, never, never> {
  return new Sink(Channel.failCause(cause));
}

/**
 * Creates a sink halting with a specified cause.
 *
 * @tsplus static fncts.io.SinkOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>, __tsplusTrace?: string): Sink<never, E, unknown, never, never> {
  return new Sink(Channel.failCauseNow(cause));
}

/**
 * A sink that always fails with the specified error.
 *
 * @tsplus static fncts.io.SinkOps failNow
 */
export function failNow<E>(e: E, __tsplusTrace?: string): Sink<never, E, unknown, never, never> {
  return new Sink(Channel.failNow(e));
}

/**
 * Filters the sink's input with the given predicate
 *
 * @tsplus static fncts.io.SinkOps filterInput
 */
export function filterInput<R, E, In, L, Z>(
  self: Sink<R, E, In, L, Z>,
  p: Predicate<In>,
  __tsplusTrace?: string,
): Sink<R, E, In, L, Z> {
  return self.contramapChunks((chunk) => chunk.filter(p));
}

/**
 * Filters the sink's input with the given IO predicate
 *
 * @tsplus static fncts.io.SinkOps filterInputIO
 */
export function filterInputIO<R, E, In, L, Z, R1, E1>(
  self: Sink<R, E, In, L, Z>,
  p: (inp: In) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In, L, Z> {
  return self.contramapChunksIO((chunk) => chunk.filterIO(p));
}

/**
 * Creates a sink that produces values until one verifies the predicate `f`.
 *
 * @tsplus fluent fncts.io.Sink findIO
 */
export function findIO<R, E, In extends L, L, Z, R1, E1>(
  self: Sink<R, E, In, L, Z>,
  f: (z: Z) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In, L, Maybe<Z>> {
  return new Sink(
    Channel.fromIO(Ref.make(Conc.empty<In>()).zip(Ref.make(false))).flatMap(([leftoversRef, upstreamDoneRef]) => {
      const upstreamMarker: Channel<never, never, Conc<In>, unknown, never, Conc<In>, unknown> = Channel.readWith(
        (inp) => Channel.writeNow(inp) > upstreamMarker,
        Channel.failNow,
        (x) => Channel.fromIO(upstreamDoneRef.set(true)).as(x),
      );

      const loop: Channel<
        R | R1,
        never,
        Conc<In>,
        unknown,
        E | E1,
        Conc<L>,
        Maybe<Z>
      > = self.channel.collectElements.matchChannel(Channel.failNow, ([leftovers, doneValue]) =>
        Channel.fromIO(f(doneValue)).flatMap(
          (satisfied) =>
            Channel.fromIO(leftoversRef.set(leftovers.flatten as Conc<In>)) >
            Channel.fromIO(upstreamDoneRef.get).flatMap((upstreamDone) => {
              if (satisfied) return Channel.writeNow(leftovers.flatten).as(Just(doneValue));
              else if (upstreamDone) return Channel.writeNow(leftovers.flatten).as(Nothing());
              else return loop;
            }),
        ),
      );

      return (upstreamMarker >>> Channel.bufferChunk(leftoversRef)) >>> loop;
    }),
  );
}

/**
 * Runs this sink until it yields a result, then uses that result to create
 * another sink from the provided function which will continue to run until it
 * yields a result.
 *
 * This function essentially runs sinks in sequence.
 *
 * @tsplus fluent fncts.io.Sink flatMap
 */
export function flatMap<R, E, In, L, Z, R1, E1, In1 extends In, L1, Z1>(
  self: Sink<R, E, In, L, Z>,
  f: (z: Z) => Sink<R1, E1, In1, L1, Z1>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In1, L | L1, Z1> {
  return self.matchSink(Sink.failNow, f);
}

/**
 * Creates a sink from a {@link Channel}
 *
 * @tsplus static fncts.io.SinkOps fromChannel
 * @tsplus static fncts.io.SinkOps __call
 */
export function fromChannel<R, E, In, L, Z>(
  channel: Channel<R, never, Conc<In>, unknown, E, Conc<L>, Z>,
): Sink<R, E, In, L, Z> {
  return new Sink(channel);
}

/**
 * Creates a sink from a chunk processing function.
 *
 * @tsplus static fncts.io.SinkOps fromPush
 */
export function fromPush<R, E, In, L, Z, R1>(
  push: IO<R, never, (_: Maybe<Conc<In>>) => IO<R1, readonly [Either<E, Z>, Conc<L>], void>>,
  __tsplusTrace?: string,
): Sink<Exclude<R, Scope> | R1, E, In, L, Z> {
  return new Sink(Channel.unwrapScoped(push.map(fromPushPull)));
}

function fromPushPull<R, E, In, L, Z>(
  push: (_: Maybe<Conc<In>>) => IO<R, readonly [Either<E, Z>, Conc<L>], void>,
): Channel<R, never, Conc<In>, unknown, E, Conc<L>, Z> {
  return Channel.readWith(
    (inp: Conc<In>) =>
      Channel.fromIO(push(Just(inp))).matchChannel(
        ([r, leftovers]) =>
          r.match(
            (e) => Channel.writeNow(leftovers) > Channel.failNow(e),
            (z) => Channel.writeNow(leftovers) > Channel.succeedNow(z),
          ),
        () => fromPushPull(push),
      ),
    Channel.failNow,
    () =>
      Channel.fromIO(push(Nothing())).matchChannel(
        ([r, leftovers]) =>
          r.match(
            (e) => Channel.writeNow(leftovers) > Channel.failNow(e),
            (z) => Channel.writeNow(leftovers) > Channel.succeedNow(z),
          ),
        () => Channel.fromIO(IO.halt(new Error("empty sink"))),
      ),
  );
}

/**
 * Create a sink which enqueues each element into the specified queue.
 *
 * @tsplus static fncts.io.SinkOps fromQueue
 */
export function fromQueue<In>(
  queue: Lazy<Queue.Enqueue<In>>,
  __tsplusTrace?: string,
): Sink<never, never, In, never, void> {
  return Sink.unwrap(IO.succeed(queue).map((queue) => Sink.foreachChunk((inp) => queue.offerAll(inp))));
}

/**
 * Create a sink which enqueues each element into the specified queue. The
 * queue will be shutdown once the stream is closed.
 *
 * @tsplus static fncts.io.SinkOps fromQueueWithShutdown
 */
export function fromQueueWithShutdown<In>(
  queue: Lazy<Queue.Enqueue<In>>,
  __tsplusTrace?: string,
): Sink<never, never, In, never, void> {
  return Sink.unwrapScoped(
    IO.succeed(queue)
      .acquireRelease((queue) => queue.shutdown)
      .map((queue) => Sink.fromQueue(queue)),
  );
}

/**
 * Create a sink which publishes each element to the specified hub.
 *
 * @tsplus static fncts.io.SinkOps fromHub
 */
export function fromHub<In>(hub: Lazy<Hub<In>>, __tsplusTrace?: string): Sink<never, never, In, never, void> {
  return Sink.fromQueue(hub);
}

/**
 * Create a sink which publishes each element to the specified hub. The hub
 * will be shutdown once the stream is closed.
 *
 * @tsplus static fncts.io.SinkOps fromHubWithShutdown
 */
export function fromHubWithShutdown<In>(
  hub: Lazy<Hub<In>>,
  __tsplusTrace?: string,
): Sink<never, never, In, never, void> {
  return Sink.fromQueueWithShutdown(hub);
}

/**
 * Creates a single-value sink produced from an effect
 *
 * @tsplus static fncts.io.SinkOps fromIO
 */
export function fromIO<R, E, Z>(b: Lazy<IO<R, E, Z>>, __tsplusTrace?: string): Sink<R, E, unknown, never, Z> {
  return new Sink(Channel.fromIO(b));
}

/**
 * Creates a sink halting with the specified unchecked value.
 *
 * @tsplus static fncts.io.SinkOps halt
 */
export function halt(defect: Lazy<unknown>, __tsplusTrace?: string): Sink<never, never, unknown, never, never> {
  return Sink.failCause(Cause.halt(defect()));
}

/**
 * Creates a sink halting with the specified unchecked value.
 *
 * @tsplus static fncts.io.SinkOps haltNow
 */
export function haltNow(defect: unknown, __tsplusTrace?: string): Sink<never, never, unknown, never, never> {
  return Sink.failCauseNow(Cause.halt(defect));
}

/**
 * Creates a sink containing the first value.
 *
 * @tsplus static fncts.io.SinkOps head
 */
export function head<In>(__tsplusTrace?: string): Sink<never, never, In, In, Maybe<In>> {
  return Sink.fold(
    Nothing(),
    (elem) => elem.isNothing(),
    (s, inp) =>
      s.match(
        () => Just(inp),
        () => s,
      ),
  );
}

/**
 * Drains the remaining elements from the stream after the sink finishes
 *
 * @tsplus getter fncts.io.Sink ignoreLeftover
 */
export function ignoreLeftover<R, E, In, L, Z>(
  self: Sink<R, E, In, L, Z>,
  __tsplusTrace?: string,
): Sink<R, E, In, never, Z> {
  return new Sink(self.channel.drain);
}

/**
 * Creates a sink containing the last value.
 *
 * @tsplus static fncts.io.SinkOps last
 */
export function last<In>(__tsplusTrace?: string): Sink<never, never, In, In, Maybe<In>> {
  return Sink.foldLeft(Nothing(), (_, inp) => Just(inp));
}

/**
 * Creates a sink that does not consume any input but provides the given chunk
 * as its leftovers
 *
 * @tsplus static fncts.io.SinkOps leftover
 */
export function leftover<L>(c: Lazy<Conc<L>>, __tsplusTrace?: string): Sink<never, never, unknown, L, void> {
  return new Sink(Channel.write(c));
}

/**
 * Logs the specified message at the current log level.
 *
 * @tsplus static fncts.io.SinkOps log
 */
export function log(message: Lazy<string>, __tsplusTrace?: string): Sink<never, never, unknown, never, void> {
  return Sink.fromIO(IO.log(message));
}

/**
 * A sink that collects all of its inputs into a chunk.
 *
 * @tsplus static fncts.io.SinkOps collectAll
 */
export function makeCollectAll<In>(): Sink<never, never, In, never, Conc<In>> {
  return new Sink(collectLoop<In>(Conc.empty()));
}

function collectLoop<A>(state: Conc<A>): Channel<never, never, Conc<A>, unknown, never, Conc<never>, Conc<A>> {
  return Channel.readWithCause(
    (inp: Conc<A>) => collectLoop(state.concat(inp)),
    Channel.failCauseNow,
    () => Channel.endNow(state),
  );
}

/**
 * A sink that collects first `n` elements into a chunk. Note that the chunk
 * is preallocated and must fit in memory.
 *
 * @tsplus static fncts.io.SinkOps collectAllN
 */
export function makeCollectAllN<In>(n: Lazy<number>): Sink<never, never, In, In, Conc<In>> {
  return Sink.fromIO(IO.succeed(new ConcBuilder<In>())).flatMap((builder) =>
    Sink.foldUntil<In, ConcBuilder<In>>(builder, n, (builder, inp) => builder.append(inp)).map((builder) =>
      builder.result(),
    ),
  );
}

/**
 * A sink that executes the provided effectful function for every element fed to it.
 *
 * @tsplus static fncts.io.SinkOps foreach
 */
export function makeForeach<R, Err, In>(
  f: (inp: In) => IO<R, Err, any>,
  __tsplusTrace?: string,
): Sink<R, Err, In, In, void> {
  return Sink.foreachWhile((inp) => f(inp).as(true));
}

/**
 * A sink that executes the provided effectful function for every chunk fed to
 * it.
 *
 * @tsplus static fncts.io.SinkOps foreachChunk
 */
export function makeForeachChunk<R, E, In>(
  f: (inp: Conc<In>) => IO<R, E, void>,
  __tsplusTrace?: string,
): Sink<R, E, In, never, void> {
  const process: Channel<R, E, Conc<In>, unknown, E, never, void> = Channel.readWithCause(
    (inp: Conc<In>) => Channel.fromIO(f(inp)) > process,
    Channel.failCauseNow,
    () => Channel.unit,
  );

  return new Sink(process);
}

/**
 * A sink that executes the provided effectful function for every element fed to it
 * until `f` evaluates to `false`.
 *
 * @tsplus static fncts.io.SinkOps foreachWhile
 */
export function makeForeachWhile<R, Err, In>(
  f: (_: In) => IO<R, Err, boolean>,
  __tsplusTrace?: string,
): Sink<R, Err, In, In, void> {
  const process: Channel<R, Err, Conc<In>, unknown, Err, Conc<In>, void> = Channel.readWithCause(
    (inp: Conc<In>) => foreachWhileLoop(f, inp, 0, inp.length, process),
    Channel.failCauseNow,
    () => Channel.unit,
  );
  return new Sink(process);
}

function foreachWhileLoop<R, Err, In>(
  f: (_: In) => IO<R, Err, boolean>,
  chunk: Conc<In>,
  idx: number,
  len: number,
  cont: Channel<R, Err, Conc<In>, unknown, Err, Conc<In>, void>,
): Channel<R, Err, Conc<In>, unknown, Err, Conc<In>, void> {
  if (idx === len) {
    return cont;
  }
  return Channel.fromIO(f(chunk.unsafeGet(idx)))
    .flatMap((b) => (b ? foreachWhileLoop(f, chunk, idx + 1, len, cont) : Channel.writeNow(chunk.drop(idx))))
    .catchAll((e) => Channel.writeNow(chunk.drop(idx)).apSecond(Channel.failNow(e)));
}

/**
 * A sink that executes the provided effectful function for every chunk fed to
 * it until `f` evaluates to `false`.
 *
 * @tsplus static fncts.io.SinkOps foreachChunkWhile
 */
export function makeForeachChunkWhile<R, E, In>(
  f: (chunk: Conc<In>) => IO<R, E, boolean>,
  __tsplusTrace?: string,
): Sink<R, E, In, In, void> {
  const reader: Channel<R, E, Conc<In>, unknown, E, never, void> = Channel.readWith(
    (inp: Conc<In>) => Channel.fromIO(f(inp)).flatMap((cont) => (cont ? reader : Channel.unit)),
    Channel.failNow,
    () => Channel.unit,
  );

  return new Sink(reader);
}

/**
 * A sink that folds its inputs with the provided function, termination
 * predicate and initial state.
 *
 * @tsplus static fncts.io.SinkOps fold
 */
export function makeFold<In, S>(
  z: Lazy<S>,
  contFn: Predicate<S>,
  f: (s: S, inp: In) => S,
  __tsplusTrace?: string,
): Sink<never, never, In, In, S> {
  return Sink.defer(new Sink(foldReader(z(), contFn, f)));
}

/**
 * @tsplus tailRec
 */
function foldChunkSplit<S, In>(
  contFn: (s: S) => boolean,
  f: (s: S, inp: In) => S,
  s: S,
  chunk: Conc<In>,
  idx: number,
  len: number,
): readonly [S, Conc<In>] {
  if (idx === len) {
    return [s, Conc.empty()];
  } else {
    const s1 = f(s, chunk[idx]);
    if (contFn(s1)) {
      return foldChunkSplit(contFn, f, s1, chunk, idx + 1, len);
    } else {
      return [s1, chunk.drop(idx + 1)];
    }
  }
}

function foldReader<S, In>(
  s: S,
  contFn: Predicate<S>,
  f: (s: S, inp: In) => S,
): Channel<never, never, Conc<In>, any, never, Conc<In>, S> {
  if (!contFn(s)) {
    return Channel.succeedNow(s);
  } else {
    return Channel.readWith(
      (inp: Conc<In>) => {
        const [nextS, leftovers] = foldChunkSplit(contFn, f, s, inp, 0, inp.length);
        if (leftovers.isNonEmpty) {
          return Channel.writeNow(leftovers).as(nextS);
        } else {
          return foldReader(nextS, contFn, f);
        }
      },
      (_: never) => Channel.failNow(_),
      (_: S) => Channel.succeedNow(_),
    );
  }
}

/**
 * Creates a sink that folds elements of type `In` into a structure of type
 * `S` until `max` elements have been folded.
 *
 * Like {@link foldWeighted}, but with a constant cost function of 1.
 *
 * @tsplus static fncts.io.SinkOps foldUntil
 */
export function makeFoldUntil<In, S>(
  z: Lazy<S>,
  max: Lazy<number>,
  f: (s: S, inp: In) => S,
  __tsplusTrace?: string,
): Sink<never, never, In, In, S> {
  return Sink.unwrap(
    IO.succeed(max).map((max) =>
      Sink.fold<In, readonly [S, number]>(
        [z(), 0],
        ([_, n]) => n < max,
        ([o, count], i) => [f(o, i), count + 1],
      ).map(([s]) => s),
    ),
  );
}

/**
 * A sink that folds its input chunks with the provided function, termination
 * predicate and initial state. `contFn` condition is checked only for the
 * initial value and at the end of processing of each chunk. `f` and `contFn`
 * must preserve chunking-invariance.
 *
 * @tsplus static fncts.io.SinkOps foldChunks
 */
export function makeFoldChunks<In, S>(
  z: Lazy<S>,
  contFn: Predicate<S>,
  f: (s: S, inp: Conc<In>) => S,
  __tsplusTrace?: string,
): Sink<never, never, In, never, S> {
  return Sink.defer(new Sink(foldChunksReader(z(), contFn, f)));
}

function foldChunksReader<In, S>(
  s: S,
  contFn: Predicate<S>,
  f: (s: S, inp: Conc<In>) => S,
): Channel<never, never, Conc<In>, unknown, never, never, S> {
  if (!contFn(s)) {
    return Channel.succeedNow(s);
  } else {
    return Channel.readWith(
      (inp: Conc<In>) => {
        const nextS = f(s, inp);
        return foldChunksReader(nextS, contFn, f);
      },
      (err: never) => Channel.failNow(err),
      (_: any) => Channel.succeedNow(_),
    );
  }
}

/**
 * A sink that effectfully folds its input chunks with the provided function,
 * termination predicate and initial state. `contFn` condition is checked only
 * for the initial value and at the end of processing of each chunk. `f` and
 * `contFn` must preserve chunking-invariance.
 *
 * @tsplus static fncts.io.SinkOps foldChunksIO
 */
export function makeFoldChunksIO<Env, Err, In, S>(
  z: Lazy<S>,
  contFn: Predicate<S>,
  f: (s: S, inp: Conc<In>) => IO<Env, Err, S>,
  __tsplusTrace?: string,
): Sink<Env, Err, In, In, S> {
  return Sink.defer(new Sink(foldChunksIOReader(z(), contFn, f)));
}

function foldChunksIOReader<Env, Err, In, S>(
  s: S,
  contFn: Predicate<S>,
  f: (s: S, inp: Conc<In>) => IO<Env, Err, S>,
): Channel<Env, Err, Conc<In>, unknown, Err, never, S> {
  if (!contFn(s)) {
    return Channel.succeedNow(s);
  } else {
    return Channel.readWith(
      (inp: Conc<In>) => Channel.fromIO(f(s, inp)).flatMap((s) => foldChunksIOReader(s, contFn, f)),
      (err: Err) => Channel.failNow(err),
      (_: any) => Channel.succeedNow(_),
    );
  }
}

/**
 * A sink that folds its inputs with the provided function and initial state.
 *
 * @tsplus static fncts.io.SinkOps foldLeft
 */
export function makeFoldLeft<In, S>(z: Lazy<S>, f: (s: S, inp: In) => S): Sink<never, never, In, never, S> {
  return Sink.fold(z, () => true, f).ignoreLeftover;
}

/**
 * A sink that folds its input chunks with the provided function and initial
 * state. `f` must preserve chunking-invariance.
 *
 * @tsplus static fncts.io.SinkOps foldLeftChunks
 */
export function makeFoldLeftChunks<In, S>(z: Lazy<S>, f: (s: S, inp: Conc<In>) => S): Sink<never, never, In, never, S> {
  return Sink.foldChunks(z, () => true, f).ignoreLeftover;
}

/**
 * A sink that effectfully folds its input chunks with the provided function
 * and initial state. `f` must preserve chunking-invariance.
 *
 * @tsplus static fncts.io.SinkOps foldLeftChunksIO
 */
export function makeFoldLeftChunksIO<R, E, In, S>(
  z: Lazy<S>,
  f: (s: S, inp: Conc<In>) => IO<R, E, S>,
  __tsplusTrace?: string,
): Sink<R, E, In, In, S> {
  return Sink.foldChunksIO(z, () => true, f);
}

/**
 * A sink that effectfully folds its inputs with the provided function and
 * initial state.
 *
 * @tsplus static fncts.io.SinkOps foldLeftIO
 */
export function makeFoldLeftIO<R, E, In, S>(
  z: Lazy<S>,
  f: (s: S, inp: In) => IO<R, E, S>,
  __tsplusTrace?: string,
): Sink<R, E, In, In, S> {
  return Sink.foldIO(z, () => true, f);
}

/**
 * A sink that effectfully folds its inputs with the provided function,
 * termination predicate and initial state.
 *
 * @tsplus static fncts.io.SinkOps foldIO
 */
export function makeFoldIO<R, E, In, S>(
  z: Lazy<S>,
  contFn: Predicate<S>,
  f: (s: S, inp: In) => IO<R, E, S>,
): Sink<R, E, In, In, S> {
  return Sink.defer(new Sink(foldIOReader(z(), contFn, f)));
}

function foldChunkSplitIO<R, E, In, S>(
  s: S,
  contFn: (s: S) => boolean,
  f: (s: S, inp: In) => IO<R, E, S>,
  chunk: Conc<In>,
  idx: number,
  len: number,
): IO<R, E, readonly [S, Maybe<Conc<In>>]> {
  if (idx === len) {
    return IO.succeedNow([s, Nothing()]);
  } else {
    return f(s, chunk[idx]).flatMap((s1) => {
      if (contFn(s1)) {
        return foldChunkSplitIO(s1, contFn, f, chunk, idx + 1, len);
      } else {
        return IO.succeedNow([s1, Just(chunk.drop(idx + 1))]);
      }
    });
  }
}

function foldIOReader<R, E, In, S>(
  s: S,
  contFn: (s: S) => boolean,
  f: (s: S, inp: In) => IO<R, E, S>,
): Channel<R, E, Conc<In>, unknown, E, Conc<In>, S> {
  if (!contFn(s)) {
    return Channel.succeedNow(s);
  } else {
    return Channel.readWith(
      (inp: Conc<In>) =>
        Channel.fromIO(foldChunkSplitIO(s, contFn, f, inp, 0, inp.length)).flatMap(([nextS, leftovers]) =>
          leftovers.match(
            () => foldIOReader(nextS, contFn, f),
            (l) => Channel.writeNow(l).as(nextS),
          ),
        ),
      (err: E) => Channel.failNow(err),
      (_: any) => Channel.succeedNow(_),
    );
  }
}

/**
 * Creates a sink that effectfully folds elements of type `In` into a
 * structure of type `S` until `max` elements have been folded.
 *
 * Like {@link makeFoldWeightedIO}, but with a constant cost function of 1.
 *
 * @tsplus static fncts.io.SinkOps foldUntilIO
 */
export function makeFoldUntilIO<R, E, In, S>(
  z: Lazy<S>,
  max: Lazy<number>,
  f: (s: S, inp: In) => IO<R, E, S>,
  __tsplusTrace?: string,
): Sink<R, E, In, In, S> {
  return Sink.foldIO<R, E, In, readonly [S, number]>(
    [z(), 0],
    ([_, n]) => n < max(),
    ([o, count], i) => f(o, i).map((s) => [s, count + 1]),
  ).map(([s]) => s);
}

/**
 * Creates a sink that folds elements of type `In` into a structure of type
 * `S`, until `max` worth of elements (determined by the `costFn`) have been
 * folded.
 *
 * The `decompose` function will be used for decomposing elements that cause
 * an `S` aggregate to cross `max` into smaller elements.
 *
 *
 * Be vigilant with this function, it has to generate "simpler" values or the
 * fold may never end. A value is considered indivisible if `decompose` yields
 * the empty chunk or a single-valued chunk. In these cases, there is no other
 * choice than to yield a value that will cross the threshold.
 *
 * The {@link makeFoldWeightedDecomposeIO} allows the decompose function to return a
 * `IO` value, and consequently it allows the sink to fail.
 *
 * @tsplus static fncts.io.SinkOps foldWeightedDecompose
 */
export function makeFoldWeightedDecompose<In, S>(
  z: Lazy<S>,
  costFn: (s: S, inp: In) => number,
  max: Lazy<number>,
  decompose: (inp: In) => Conc<In>,
  f: (s: S, inp: In) => S,
  __tsplusTrace?: string,
): Sink<never, never, In, In, S> {
  return Sink.defer(() => {
    /**
     * @tsplus tailRec
     */
    function fold(
      inp: Conc<In>,
      s: S,
      max: number,
      dirty: boolean,
      cost: number,
      idx: number,
    ): readonly [S, number, boolean, Conc<In>] {
      if (idx === inp.length) {
        return [s, cost, dirty, Conc.empty()];
      } else {
        const elem  = inp[idx];
        const total = cost + costFn(s, elem);

        if (total <= max) {
          return fold(inp, f(s, elem), max, true, total, idx + 1);
        } else {
          const decomposed = decompose(elem);

          if (decomposed.length <= 1 && !dirty) {
            return [f(s, elem), total, true, inp.drop(idx + 1)];
          } else if (decomposed.length <= 1 && dirty) {
            return [s, cost, dirty, inp.drop(idx)];
          } else {
            return fold(decomposed.concat(inp.drop(idx + 1)), s, max, dirty, cost, 0);
          }
        }
      }
    }
    function go(
      s: S,
      cost: number,
      dirty: boolean,
      max: number,
    ): Channel<never, never, Conc<In>, unknown, never, Conc<In>, S> {
      return Channel.readWith(
        (inp: Conc<In>) => {
          const [nextS, nextCost, nextDirty, leftovers] = fold(inp, s, max, dirty, cost, 0);

          if (leftovers.isNonEmpty) {
            return Channel.writeNow(leftovers) > Channel.succeedNow(nextS);
          } else if (cost > max) {
            return Channel.succeedNow(nextS);
          } else {
            return go(nextS, nextCost, nextDirty, max);
          }
        },
        (err: never) => Channel.failNow(err),
        (_: any) => Channel.succeedNow(s),
      );
    }

    return new Sink(go(z(), 0, false, max()));
  });
}

/**
 * Creates a sink that effectfully folds elements of type `In` into a
 * structure of type `S`, until `max` worth of elements (determined by the
 * `costFn`) have been folded.
 *
 * The `decompose` function will be used for decomposing elements that cause
 * an `S` aggregate to cross `max` into smaller elements. Be vigilant with
 * this function, it has to generate "simpler" values or the fold may never
 * end. A value is considered indivisible if `decompose` yields the empty
 * chunk or a single-valued chunk. In these cases, there is no other choice
 * than to yield a value that will cross the threshold.
 *
 * @tsplus static fncts.io.SinkOps foldWeightedDecomposeIO
 */
export function makeFoldWeightedDecomposeIO<R, E, In, S, R1, E1, R2, E2>(
  z: Lazy<S>,
  costFn: (s: S, inp: In) => IO<R1, E1, number>,
  max: Lazy<number>,
  decompose: (inp: In) => IO<R2, E2, Conc<In>>,
  f: (s: S, inp: In) => IO<R, E, S>,
  __tsplusTrace?: string,
): Sink<R | R1 | R2, E | E1 | E2, In, In, S> {
  return Sink.defer(() => {
    function fold(
      inp: Conc<In>,
      s: S,
      max: number,
      dirty: boolean,
      cost: number,
      idx: number,
    ): IO<R | R1 | R2, E | E1 | E2, readonly [S, number, boolean, Conc<In>]> {
      if (idx === inp.length) {
        return IO.succeedNow([s, cost, dirty, Conc.empty()]);
      } else {
        const elem = inp[idx];
        return costFn(s, elem)
          .map((_) => cost + _)
          .flatMap((total) => {
            if (total <= max) {
              return f(s, elem).flatMap((s) => fold(inp, s, max, true, total, idx + 1));
            } else {
              return decompose(elem).flatMap((decomposed) => {
                if (decomposed.length <= 1 && !dirty) {
                  return f(s, elem).map((s) => [s, total, true, inp.drop(idx + 1)]);
                } else if (decomposed.length <= 1 && dirty) {
                  return IO.succeedNow([s, cost, dirty, inp.drop(idx)]);
                } else {
                  return fold(decomposed.concat(inp.drop(idx + 1)), s, max, dirty, cost, 0);
                }
              });
            }
          });
      }
    }
    function go(
      s: S,
      cost: number,
      dirty: boolean,
      max: number,
    ): Channel<R | R1 | R2, E | E1 | E2, Conc<In>, unknown, E | E1 | E2, Conc<In>, S> {
      return Channel.readWith(
        (inp: Conc<In>) =>
          Channel.fromIO(fold(inp, s, max, dirty, cost, 0)).flatMap(([nextS, nextCost, nextDirty, leftovers]) => {
            if (leftovers.isNonEmpty) {
              return Channel.writeNow(leftovers) > Channel.succeedNow(nextS);
            } else if (cost > max) {
              return Channel.succeedNow(nextS);
            } else {
              return go(nextS, nextCost, nextDirty, max);
            }
          }),
        (err: E | E1 | E2) => Channel.failNow(err),
        (_: any) => Channel.succeedNow(s),
      );
    }

    return new Sink(go(z(), 0, false, max()));
  });
}

/**
 * Creates a sink that folds elements of type `In` into a structure of type
 * `S`, until `max` worth of elements (determined by the `costFn`) have been
 * folded.
 *
 * @note
 *   Elements that have an individual cost larger than `max` will force the
 *   sink to cross the `max` cost. See {@link makeFoldWeightedDecompose} for a variant
 *   that can handle these cases.
 *
 * @tsplus static fncts.io.SinkOps foldWeighted
 */
export function makeFoldWeighted<In, S>(
  z: Lazy<S>,
  costFn: (s: S, inp: In) => number,
  max: Lazy<number>,
  f: (s: S, inp: In) => S,
  __tsplusTrace?: string,
): Sink<never, never, In, In, S> {
  return Sink.foldWeightedDecompose(z, costFn, max, Conc.single, f);
}

/**
 * Creates a sink that effectfully folds elements of type `In` into a
 * structure of type `S`, until `max` worth of elements (determined by the
 * `costFn`) have been folded.
 *
 * @note
 *   Elements that have an individual cost larger than `max` will force the
 *   sink to cross the `max` cost. See {@link makeFoldWeightedDecomposeIO} for a
 *   variant that can handle these cases.
 *
 * @tsplus static fncts.io.SinkOps foldWeightedIO
 */
export function makeFoldWeightedIO<R, E, In, S, R1, E1>(
  z: Lazy<S>,
  costFn: (s: S, inp: In) => IO<R, E, number>,
  max: Lazy<number>,
  f: (s: S, inp: In) => IO<R1, E1, S>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In, In, S> {
  return Sink.foldWeightedDecomposeIO(z, costFn, max, (inp) => IO.succeedNow(Conc.single(inp)), f);
}

/**
 * Transforms this sink's result.
 *
 * @tsplus fluent fncts.io.Sink map
 */
export function map_<R, E, In, L, Z, Z1>(
  self: Sink<R, E, In, L, Z>,
  f: (z: Z) => Z1,
  __tsplusTrace?: string,
): Sink<R, E, In, L, Z1> {
  return new Sink(self.channel.map(f));
}

/**
 * Transforms the errors emitted by this sink using `f`.
 *
 * @tsplus fluent fncts.io.Sink mapError
 */
export function mapError_<R, E, In, L, Z, E1>(
  self: Sink<R, E, In, L, Z>,
  f: (e: E) => E1,
  __tsplusTrace?: string,
): Sink<R, E1, In, L, Z> {
  return new Sink(self.channel.mapError(f));
}

/**
 * Effectfully transforms this sink's result.
 *
 * @tsplus fluent fncts.io.Sink mapIO
 */
export function mapIO_<R, E, In, L, Z, R1, E1, Z1>(
  self: Sink<R, E, In, L, Z>,
  f: (z: Z) => IO<R1, E1, Z1>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In, L, Z1> {
  return new Sink(self.channel.mapIO(f));
}

/**
 * Runs this sink until it yields a result, then uses that result to create
 * another sink from the provided function which will continue to run until it
 * yields a result.
 *
 * This function essentially runs sinks in sequence.
 *
 * @tsplus fluent fncts.io.Sink matchSink
 */
export function matchSink_<R, E, In, L, Z, R1, E1, In1 extends In, L1, Z1, R2, E2, In2 extends In, L2, Z2>(
  self: Sink<R, E, In, L, Z>,
  onFailure: (e: E) => Sink<R1, E1, In1, L1, Z1>,
  onSuccess: (z: Z) => Sink<R2, E2, In2, L2, Z2>,
  __tsplusTrace?: string,
): Sink<R | R1 | R2, E1 | E2, In1 & In2, L | L1 | L2, Z1 | Z2> {
  return new Sink<R | R1 | R2, E1 | E2, In1 & In2, L | L1 | L2, Z1 | Z2>(
    self.channel.doneCollect.matchChannel(
      (e) => onFailure(e).channel,
      ([leftovers, z]) =>
        Channel.defer(() => {
          const leftoversRef = new AtomicReference(leftovers.filter((c) => c.isNonEmpty));
          const refReader    = Channel.succeed(leftoversRef.getAndSet(Conc.empty())).flatMap((chunk) =>
            Channel.writeChunk(chunk as unknown as Conc<Conc<In1 & In2>>),
          );
          const passthrough      = Channel.id<never, Conc<In1 & In2>, unknown>();
          const continuationSink = (refReader > passthrough).pipeTo(onSuccess(z).channel);
          return continuationSink.doneCollect.flatMap(
            ([newLeftovers, z1]) =>
              Channel.succeed(leftoversRef.get).flatMap(Channel.writeChunk) > Channel.writeChunk(newLeftovers).as(z1),
          );
        }),
    ),
  );
}

/**
 * Switch to another sink in case of failure
 *
 * @tsplus fluent fncts.io.Sink orElse
 */
export function orElse<R, E, In, L, Z, R1, E1, In1, L1, Z1>(
  self: Sink<R, E, In, L, Z>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In & In1, L | L1, Z | Z1> {
  return Sink.defer(new Sink<R | R1, E | E1, In & In1, L | L1, Z | Z1>(self.channel.orElse(that().channel)));
}

/**
 * Provides the sink with its required environment, which eliminates its
 * dependency on `R`.
 *
 * @tsplus fluent fncts.io.Sink provideEnvironment
 */
export function provideEnvironment<R, E, In, L, Z>(
  self: Sink<R, E, In, L, Z>,
  r: Lazy<Environment<R>>,
  __tsplusTrace?: string,
): Sink<never, E, In, L, Z> {
  return new Sink(self.channel.provideEnvironment(r));
}

/**
 * Runs both sinks in parallel on the input, returning the result or the
 * error from the one that finishes first.
 *
 * @tsplus fluent fncts.io.Sink race
 */
export function race<R, E, In, L, Z, R1, E1, In1, L1, Z1>(
  self: Sink<R, E, In, L, Z>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In & In1, L | L1, Z | Z1> {
  return self.raceBoth(that).map((result) => result.value);
}

/**
 * Runs both sinks in parallel on the input, returning the result or the error
 * from the one that finishes first.
 *
 * @tsplus fluent fncts.io.Sink raceBoth
 */
export function raceBoth<R, E, In, L, Z, R1, E1, In1, L1, Z1>(
  self: Sink<R, E, In, L, Z>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
  capacity: Lazy<number> = () => 16,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In & In1, L | L1, Either<Z, Z1>> {
  return self.raceWith(
    that,
    (selfDone) => MergeDecision.Done(IO.fromExitNow(selfDone).map(Either.left)),
    (thatDone) => MergeDecision.Done(IO.fromExitNow(thatDone).map(Either.right)),
    capacity,
  );
}

/**
 * Runs both sinks in parallel on the input, using the specified merge
 * function as soon as one result or the other has been computed.
 *
 * @tsplus fluent fncts.io.Sink raceWith
 */
export function raceWith<R, E, In, L, Z, R1, E1, In1, L1, Z1, R2, E2, Z2, R3, E3, Z3>(
  self: Sink<R, E, In, L, Z>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
  leftDone: (exit: Exit<E, Z>) => MergeDecision<R1, E1, Z1, E2, Z2>,
  rightDone: (exit: Exit<E1, Z1>) => MergeDecision<R, E, Z, E3, Z3>,
  capacity: Lazy<number> = () => 16,
  __tsplusTrace?: string,
): Sink<R | R1 | R2 | R3, E2 | E3, In & In1, L | L1, Z2 | Z3> {
  const scoped = IO.defer(() => {
    const that0     = that();
    const capacity0 = capacity();
    return Do((_) => {
      const hub     = _(Hub.makeBounded<Either<Exit<never, any>, Conc<In & In1>>>(capacity()));
      const c1      = _(Channel.fromHubScoped(hub));
      const c2      = _(Channel.fromHubScoped(hub));
      const reader  = Channel.toHub(hub);
      const writer  = c1.pipeTo(self.channel).mergeWith(c2.pipeTo(that0.channel), leftDone, rightDone);
      const channel = reader.mergeWith(
        writer,
        () => MergeDecision.Await(IO.fromExitNow),
        (done) => MergeDecision.Done(IO.fromExitNow(done)),
      );
      return new Sink<R | R1 | R2 | R3, E2 | E3, In & In1, L | L1, Z2 | Z3>(channel);
    });
  });
  return Sink.unwrapScoped(scoped);
}

/**
 * Accesses the specified service in the environment of the effect.
 *
 * @tsplus static fncts.io.SinkOps service
 */
export function service<S>(/** @tsplus auto */ tag: Tag<S>): Sink<S, never, unknown, never, S> {
  return Sink.serviceWith(Function.identity);
}

/**
 * Accesses the specified service in the environment of the sink.
 *
 * @tsplus static fncts.io.SinkOps serviceWith
 */
export function serviceWith<S, Z>(
  f: (service: S) => Z,
  /** @tsplus auto */ tag: Tag<S>,
): Sink<S, never, unknown, never, Z> {
  return Sink.fromIO(IO.serviceWith(f, tag));
}

/**
 * Accesses the specified service in the environment of the sink in the
 * context of an effect.
 *
 * @tsplus static fncts.io.SinkOps serviceWithIO
 */
export function serviceWithIO<S, R, E, Z>(
  f: (service: S) => IO<R, E, Z>,
  /** @tsplus auto */ tag: Tag<S>,
): Sink<S | R, E, unknown, never, Z> {
  return Sink.fromIO(IO.serviceWithIO(f, tag));
}

/**
 * Accesses the specified service in the environment of the sink in the
 * context of a sink.
 *
 * @tsplus static fncts.io.SinkOps serviceWithSink
 */
export function serviceWithSink<S, R, E, In, L, Z>(
  f: (service: S) => Sink<R, E, In, L, Z>,
  /** @tsplus auto */ tag: Tag<S>,
): Sink<S | R, E, In, L, Z> {
  return new Sink(
    Channel.unwrap(
      IO.serviceWith(
        f.compose((s) => s.channel),
        tag,
      ),
    ),
  );
}

/**
 * Splits the sink on the specified predicate, returning a new sink that
 * consumes elements until an element after the first satisfies the specified
 * predicate.
 *
 * @tsplus fluent fncts.io.Sink splitWhere
 */
export function splitWhere<R, E, In, L extends In, Z>(
  self: Sink<R, E, In, L, Z>,
  p: Predicate<In>,
  __tsplusTrace?: string,
): Sink<R, E, In, In, Z> {
  return new Sink(
    Channel.fromIO(Ref.make<Conc<In>>(Conc.empty())).flatMap((ref) =>
      splitter<R, E, In>(p, false, ref)
        .pipeToOrFail(self.channel)
        .collectElements.flatMap(([leftovers, z]) =>
          Channel.fromIO(ref.get).flatMap(
            (leftover) => Channel.writeNow(leftover.concat(leftovers.flatten)) > Channel.succeedNow(z),
          ),
        ),
    ),
  );
}

function splitter<R, E, In>(
  p: Predicate<In>,
  written: boolean,
  leftovers: Ref<Conc<In>>,
): Channel<R, never, Conc<In>, unknown, E, Conc<In>, unknown> {
  return Channel.readWithCause(
    (inp) => {
      if (inp.isEmpty) {
        return splitter(p, written, leftovers);
      } else if (written) {
        const index = inp.findIndex(p);
        if (index === -1) {
          return Channel.writeNow(inp) > splitter<R, E, In>(p, true, leftovers);
        } else {
          const [left, right] = inp.splitAt(index);
          return Channel.writeNow(left) > Channel.fromIO(leftovers.set(right));
        }
      } else {
        const index = inp.findIndex(p);
        if (index === -1) {
          return Channel.writeNow(inp) > splitter<R, E, In>(p, true, leftovers);
        } else {
          const [left, right] = inp.splitAt(Math.max(index, 1));
          return Channel.writeNow(left) > Channel.fromIO(leftovers.set(right));
        }
      }
    },
    Channel.failCauseNow,
    Channel.succeedNow,
  );
}

/**
 * A sink that immediately ends with the specified value.
 *
 * @tsplus static fncts.io.SinkOps succeed
 */
export function succeed<Z>(z: Lazy<Z>, __tsplusTrace?: string): Sink<never, never, unknown, never, Z> {
  return new Sink(Channel.succeed(z));
}

/**
 * A sink that immediately ends with the specified value.
 *
 * @tsplus static fncts.io.SinkOps succeedNow
 */
export function succeedNow<Z>(z: Z, __tsplusTrace?: string): Sink<never, never, unknown, never, Z> {
  return new Sink(Channel.succeedNow(z));
}

/**
 * Summarize a sink by running an effect when the sink starts and again when
 * it completes
 *
 * @tsplus fluent fncts.io.Sink summarized
 */
export function summarized<R, E, In, L, Z, R1, E1, B, C>(
  self: Sink<R, E, In, L, Z>,
  summary: Lazy<IO<R1, E1, B>>,
  f: (b1: B, b2: B) => C,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In, L, readonly [Z, C]> {
  return new Sink(
    Channel.unwrap(
      IO.succeed(summary).map((summary) =>
        Channel.fromIO(summary).flatMap((start) =>
          self.channel.flatMap((done) => Channel.fromIO(summary).map((end) => [done, f(start, end)])),
        ),
      ),
    ),
  );
}

/**
 * @tsplus getter fncts.io.Sink timed
 */
export function timed<R, E, In, L, Z>(
  self: Sink<R, E, In, L, Z>,
  __tsplusTrace?: string,
): Sink<R, E, In, L, readonly [Z, Duration]> {
  return self.summarized(Clock.currentTime, (start, end) => Duration.fromInterval(start, end));
}

/**
 * Creates a sink produced from an effect.
 *
 * @tsplus static fncts.io.SinkOps unwrap
 */
export function unwrap<R, E, R1, E1, In, L, Z>(
  io: Lazy<IO<R, E, Sink<R1, E1, In, L, Z>>>,
): Sink<R | R1, E | E1, In, L, Z> {
  return new Sink(Channel.unwrap(io().map((sink) => sink.channel)));
}

/**
 * Creates a sink produced from a scoped effect.
 *
 * @tsplus static fncts.io.SinkOps unwrapScoped
 */
export function unwrapScoped<R, E, R1, E1, In, L, Z>(
  scoped: Lazy<IO<R, E, Sink<R1, E1, In, L, Z>>>,
  __tsplusTrace?: string,
): Sink<Exclude<R, Scope> | R1, E | E1, In, L, Z> {
  return new Sink(Channel.unwrapScoped(scoped().map((sink) => sink.channel)));
}

/**
 * Feeds inputs to this sink until it yields a result, then switches over to
 * the provided sink until it yields a result, finally combining the two
 * results into a tuple.
 *
 * @tsplus fluent fncts.io.Sink zip
 */
export function zip<R, E, In, L, Z, R1, E1, In1 extends In, L1 extends L, Z1>(
  self: Sink<R, E, In, L, Z>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In & In1, L | L1, readonly [Z, Z1]> {
  return self.zipWith(that, Function.tuple);
}

/**
 * Runs both sinks in parallel on the input and combines the results in a
 * tuple.
 *
 * @tsplus fluent fncts.io.Sink zipC
 */
export function zipC<R, E, In, L, Z, R1, E1, In1 extends In, L1 extends L, Z1>(
  self: Sink<R, E, In, L, Z>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In & In1, L | L1, readonly [Z, Z1]> {
  return self.zipWithC(that, Function.tuple);
}

/**
 * Feeds inputs to this sink until it yields a result, then switches over to
 * the provided sink until it yields a result, finally combining the two
 * results with `f`.
 *
 * @tsplus fluent fncts.io.Sink zipWith
 */
export function zipWith<R, E, In, L, Z, R1, E1, In1 extends In, L1 extends L, Z1, Z2>(
  self: Lazy<Sink<R, E, In, L, Z>>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
  f: (z: Z, z1: Z1) => Z2,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In & In1, L | L1, Z2> {
  return Sink.defer(self().flatMap((z) => that().map((z1) => f(z, z1))));
}

/**
 * Runs both sinks in parallel on the input and combines the results using the
 * provided function.
 *
 * @tsplus fluent fncts.io.Sink zipWithC
 */
export function zipWithC<R, E, In, L, Z, R1, E1, In1, L1, Z1, Z2>(
  self: Lazy<Sink<R, E, In, L, Z>>,
  that: Lazy<Sink<R1, E1, In1, L1, Z1>>,
  f: (z: Z, z1: Z1) => Z2,
  __tsplusTrace?: string,
): Sink<R | R1, E | E1, In & In1, L | L1, Z2> {
  return Sink.defer(
    self().raceWith(
      that(),
      (exit) =>
        exit.match(
          (err) => MergeDecision.Done(IO.failCauseNow(err)),
          (lz) =>
            MergeDecision.Await((exit) =>
              exit.match(
                (cause) => IO.failCauseNow(cause),
                (rz) => IO.succeedNow(f(lz, rz)),
              ),
            ),
        ),
      (exit) =>
        exit.match(
          (err) => MergeDecision.Done(IO.failCauseNow(err)),
          (rz) =>
            MergeDecision.Await((exit) =>
              exit.match(
                (cause) => IO.failCauseNow(cause),
                (lz) => IO.succeedNow(f(lz, rz)),
              ),
            ),
        ),
    ),
  );
}
