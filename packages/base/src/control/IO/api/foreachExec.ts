import type { Conc } from "../../../collection/immutable/Conc";
import type { ExecutionStrategy } from "../../../data/ExecutionStrategy";

import { IO } from "../definition";

/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a new `Conc<B>`.
 *
 * For a sequential version of this method, see `foreach`.
 *
 * @tsplus static fncts.control.IOOps foreachExec
 */
export function foreachExec_<R, E, A, B>(
  as: Iterable<A>,
  es: ExecutionStrategy,
  f: (a: A) => IO<R, E, B>
): IO<R, E, Conc<B>> {
  return es.match(
    () => IO.foreach(as, f),
    () => IO.foreachC(as, f).withConcurrencyUnbounded,
    (fiberBound) => IO.foreachC(as, f).withConcurrency(fiberBound)
  );
}
