import { PTraversal } from "@fncts/base/optics/Traversal/definition";

/**
 * @tsplus fluent fncts.optics.PTraversal compose 4
 */
export function compose_<S, T, A, B, C, D>(
  self: PTraversal<S, T, A, B>,
  that: PTraversal<A, B, C, D>,
): PTraversal<S, T, C, D> {
  return PTraversal<S, T, C, D>({
    modifyA: (F) => (s, f) => self.modifyA(F)(s, (a) => that.modifyA(F)(a, f)),
  });
}
