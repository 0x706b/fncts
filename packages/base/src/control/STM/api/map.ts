import { STM } from "../definition";

/**
 * Maps the value produced by the effect.
 *
 * @tsplus fluent fncts.control.STM map
 */
export function map_<R, E, A, B>(
  self: STM<R, E, A>,
  f: (a: A) => B
): STM<R, E, B> {
  return self.chain((a) => STM.succeedNow(f(a)));
}
