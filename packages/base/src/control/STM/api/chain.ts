import type { STM } from "../definition";

import { OnSuccess } from "../definition";

/**
 * Feeds the value produced by this effect to the specified function,
 * and then runs the returned effect as well to produce its results.
 *
 * @tsplus fluent fncts.control.STM chain
 */
export function chain_<R, E, A, R1, E1, B>(
  self: STM<R, E, A>,
  f: (a: A) => STM<R1, E1, B>
): STM<R1 & R, E | E1, B> {
  return new OnSuccess<R1 & R, E | E1, A, B>(self, f);
}
