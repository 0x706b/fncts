import type { STM } from "../definition";

import { OnFailure } from "../definition";

/**
 * Recovers from all errors.
 *
 * @tsplus fluent fncts.control.STM catchAll
 */
export function catchAll_<R, E, A, R1, E1, B>(
  self: STM<R, E, A>,
  f: (e: E) => STM<R1, E1, B>
): STM<R1 & R, E1, A | B> {
  return new OnFailure<R1 & R, E, A | B, E1>(self, f);
}
