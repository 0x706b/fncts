import type { Maybe } from "../../../data/Maybe";

import { STM } from "../definition";

/**
 * Simultaneously filters and chains the value produced by this effect.
 * Continues on the effect returned from f.
 *
 * @tsplus fluent fncts.control.STM filterMapSTM
 */
export function filterMapSTM_<R, E, A, R1, E1, B>(
  self: STM<R, E, A>,
  f: (a: A) => Maybe<STM<R1, E1, B>>
): STM<R & R1, E | E1, B> {
  return self.matchSTM(STM.failNow, (a) => f(a).getOrElse(STM.retry));
}
