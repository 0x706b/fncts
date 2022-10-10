import { PTraversal } from "@fncts/base/optics/Traversal/definition";

/**
 * @tsplus pipeable fncts.optics.PTraversal compose 4
 */
export function compose<A, B, C, D>(that: PTraversal<A, B, C, D>) {
  return <S, T>(self: PTraversal<S, T, A, B>): PTraversal<S, T, C, D> => {
    return PTraversal<S, T, C, D>({
      modifyA: (F) => (f) => self.modifyA(F)(that.modifyA(F)(f)),
    });
  };
}
