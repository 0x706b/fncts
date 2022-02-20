import { Either } from "../../../data/Either";
import { STM } from "../definition";

/**
 * Effectfully folds over the `STM` effect, handling both failure and
 * success.
 *
 * @tsplus fluent fncts.control.STM matchSTM
 */
export function matchSTM_<R, E, A, R1, E1, B, R2, E2, C>(
  self: STM<R, E, A>,
  g: (e: E) => STM<R2, E2, C>,
  f: (a: A) => STM<R1, E1, B>
): STM<R1 & R2 & R, E1 | E2, B | C> {
  return self
    .map(Either.right)
    .catchAll((e) => g(e).map(Either.left))
    .chain((ca) => ca.match(STM.succeedNow, f));
}
