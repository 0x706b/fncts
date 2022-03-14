import type { Conc } from "../../../collection/immutable/Conc.js";
import type { ExecutionStrategy } from "../../../data/ExecutionStrategy.js";

import { Managed } from "../definition.js";

/**
 * @tsplus static fncts.control.ManagedOps foreachExec
 */
export function foreachExec_<R, E, A, B>(
  as: Iterable<A>,
  strategy: ExecutionStrategy,
  f: (a: A) => Managed<R, E, B>,
): Managed<R, E, Conc<B>> {
  return strategy.match(
    () => Managed.foreach(as, f),
    () => Managed.foreachC(as, f).withConcurrencyUnbounded,
    (fiberBound) => Managed.foreachC(as, f).withConcurrency(fiberBound),
  );
}
