import type * as P from "@fncts/base/typeclass";

import { PTraversal } from "@fncts/base/optics/Traversal/definition";

/**
 * @tsplus static fncts.optics.PTraversalOps fromTraversable
 */
export function fromTraversable<T extends HKT>(T: P.Traversable<T>) {
  return <
    A,
    B,
    K = HKT.Low<"K">,
    Q = HKT.Low<"Q">,
    W = HKT.Low<"W">,
    X = HKT.Low<"X">,
    I = HKT.Low<"I">,
    S = HKT.Low<"S">,
    R = HKT.Low<"R">,
    E = HKT.Low<"E">,
  >() =>
    PTraversal<HKT.Kind<T, K, Q, W, X, I, S, R, E, A>, HKT.Kind<T, K, Q, W, X, I, S, R, E, B>, A, B>({
      modifyA: (s, f, F) => T.traverse(s, f, F),
    });
}
