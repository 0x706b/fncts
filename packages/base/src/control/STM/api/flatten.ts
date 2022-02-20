import type { STM } from "../definition";

import { identity } from "../../../data/function";

/**
 * Flattens out a nested `STM` effect.
 *
 * @tsplus getter fncts.control.STM flatten
 */
export function flatten<R, E, R1, E1, B>(
  stm: STM<R, E, STM<R1, E1, B>>
): STM<R1 & R, E | E1, B> {
  return stm.chain(identity);
}
