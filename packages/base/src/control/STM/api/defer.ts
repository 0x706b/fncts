import type { Lazy } from "../../../data/function";

import { STM } from "../definition";

/**
 * Suspends creation of the specified transaction lazily.
 *
 * @tsplus static fncts.control.STMOps defer
 */
export function defer<R, E, A>(make: Lazy<STM<R, E, A>>): STM<R, E, A> {
  return STM.succeed(make).flatten;
}
