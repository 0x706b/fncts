/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `Conc<B>`.
 *
 * For a sequential version of this method, see `foreach`.
 *
 * @tsplus static fncts.io.IOOps foreachWithIndexDiscardExec
 */
export function foreachWithIndexDiscardExec<R, E, A, B>(
  as: Iterable<A>,
  es: ExecutionStrategy,
  f: (index: number, a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, void> {
  return es.match(
    () => IO.foreachWithIndexDiscard(as, f),
    () =>
      IO.withConcurrencyUnboundedMask((restore) => IO.foreachConcurrent(as.zipWithIndex, ([i, a]) => restore(f(i, a)))),
    (fiberBound) =>
      IO.withConcurrencyMask(fiberBound, (restore) =>
        IO.foreachConcurrent(as.zipWithIndex, ([i, a]) => restore(f(i, a))),
      ),
  );
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `Conc<B>`.
 *
 * For a sequential version of this method, see `foreach`.
 *
 * @tsplus static fncts.io.IOOps foreachExec
 */
export function foreachExec<R, E, A, B>(
  as: Iterable<A>,
  es: ExecutionStrategy,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, Conc<B>> {
  return es.match(
    () => IO.foreach(as, f),
    () => IO.withConcurrencyUnboundedMask((restore) => IO.foreachConcurrent(as, (a) => restore(f(a)))),
    (fiberBound) => IO.withConcurrencyMask(fiberBound, (restore) => IO.foreachConcurrent(as, (a) => restore(f(a)))),
  );
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `Conc<B>`.
 *
 * For a sequential version of this method, see `foreach`.
 *
 * @tsplus static fncts.io.IOOps foreachExecDiscard
 */
export function foreachDiscardExec<R, E, A, B>(
  as: Iterable<A>,
  es: ExecutionStrategy,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, void> {
  return es.match(
    () => IO.foreachDiscard(as, f),
    () => IO.withConcurrencyUnboundedMask((restore) => IO.foreachConcurrentDiscard(as, (a) => restore(f(a)))),
    (fiberBound) =>
      IO.withConcurrencyMask(fiberBound, (restore) => IO.foreachConcurrentDiscard(as, (a) => restore(f(a)))),
  );
}
