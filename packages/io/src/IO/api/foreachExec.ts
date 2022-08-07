/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `Conc<B>`.
 *
 * For a sequential version of this method, see `foreach`.
 *
 * @tsplus static fncts.io.IOOps foreachExec
 */
export function foreachExec_<R, E, A, B>(
  as: Iterable<A>,
  es: ExecutionStrategy,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, Conc<B>> {
  return es.match(
    () => IO.foreach(as, f),
    () => IO.foreachC(as, f).withConcurrencyUnbounded,
    (fiberBound) => IO.foreachC(as, f).withConcurrency(fiberBound),
  );
}
