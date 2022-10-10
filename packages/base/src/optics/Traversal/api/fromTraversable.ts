import type * as P from "@fncts/base/typeclass";

import { PTraversal } from "@fncts/base/optics/Traversal/definition";

/**
 * @tsplus static fncts.optics.PTraversalOps fromTraversable
 */
export function fromTraversable<F extends HKT, FC = HKT.None>(T: P.Traversable<F, FC>) {
  return <
    A,
    B,
    K = HKT.Low<F, "K">,
    Q = HKT.Low<F, "Q">,
    W = HKT.Low<F, "W">,
    X = HKT.Low<F, "X">,
    I = HKT.Low<F, "I">,
    S = HKT.Low<F, "S">,
    R = HKT.Low<F, "R">,
    E = HKT.Low<F, "E">,
  >() =>
    PTraversal<HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>, A, B>({
      modifyA: T.traverse,
    });
}
