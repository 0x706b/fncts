function collectLoop<Err, A>(state: Conc<A>): Channel<unknown, Err, Conc<A>, unknown, Err, Conc<never>, Conc<A>> {
  return Channel.readWithCause(
    (inp: Conc<A>) => collectLoop(state.concat(inp)),
    Channel.failCauseNow,
    () => Channel.endNow(state),
  );
}

/**
 * A sink that collects all of its inputs into a chunk.
 *
 * @tsplus static fncts.control.SinkOps collectAll
 */
export function collectAll<Err, A>(): Sink<unknown, Err, A, never, Conc<A>> {
  return new Sink(collectLoop<Err, A>(Conc.empty()));
}

const drainLoop: Channel<unknown, never, Conc<unknown>, unknown, never, Conc<never>, void> = Channel.readWithCause(
  () => drainLoop,
  Channel.failCauseNow,
  () => Channel.unit,
);

/**
 * A sink that ignores all of its inputs.
 *
 * @tsplus static fncts.control.SinkOps drain
 */
export const drain: Sink<unknown, never, unknown, never, void> = new Sink(drainLoop);

/**
 * @tsplus static fncts.control.SinkOps dropWhile
 */
export function dropWhile<Err, In>(predicate: Predicate<In>): Sink<unknown, never, In, In, any> {
  const loop: Channel<unknown, never, Conc<In>, any, never, Conc<In>, any> = Channel.readWith(
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
 * A sink that executes the provided effectful function for every element fed to it.
 *
 * @tsplus static fncts.control.SinkOps foreach
 */
export function foreach<R, Err, In>(f: (inp: In) => IO<R, Err, any>): Sink<R, Err, In, In, void> {
  return Sink.foreachWhile((inp) => f(inp).as(true));
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
    .chain((b) => (b ? foreachWhileLoop(f, chunk, idx + 1, len, cont) : Channel.writeNow(chunk.drop(idx))))
    .catchAll((e) => Channel.writeNow(chunk.drop(idx)).apSecond(Channel.failNow(e)));
}

/**
 * A sink that executes the provided effectful function for every element fed to it
 * until `f` evaluates to `false`.
 *
 * @tsplus static fncts.control.SinkOps foreachWhile
 */
export function foreachWhile<R, Err, In>(f: (_: In) => IO<R, Err, boolean>): Sink<R, Err, In, In, void> {
  const process: Channel<R, Err, Conc<In>, unknown, Err, Conc<In>, void> = Channel.readWithCause(
    (inp: Conc<In>) => foreachWhileLoop(f, inp, 0, inp.length, process),
    Channel.failCauseNow,
    () => Channel.unit,
  );
  return new Sink(process);
}
