import { PTraversal } from "../definition.js";

/**
 * @tsplus fluent fncts.optics.PTraversal compose 4
 */
export function compose_<S, T, A, B, C, D>(
  self: PTraversal<S, T, A, B>,
  that: PTraversal<A, B, C, D>,
): PTraversal<S, T, C, D> {
  return PTraversal<S, T, C, D>({
    modifyA_: (F) => (s, f) => self.modifyA_(F)(s, (a) => that.modifyA_(F)(a, f)),
  });
}
