import type * as P from "../../../prelude.js";
import type { HKT } from "../../../prelude.js";

import { PTraversal } from "../definition.js";

/**
 * @tsplus static fncts.optics.PTraversalOps fromTraversable
 */
export function fromTraversable<T extends HKT, C = HKT.None>(
  T: P.Traversable<T, C>,
): <
  A,
  B,
  K = HKT.Low<T, "K">,
  Q = HKT.Low<T, "Q">,
  W = HKT.Low<T, "W">,
  X = HKT.Low<T, "X">,
  I = HKT.Low<T, "I">,
  S = HKT.Low<T, "S">,
  R = HKT.Low<T, "R">,
  E = HKT.Low<T, "E">,
  K1 = HKT.Low<T, "K">,
  Q1 = HKT.Low<T, "Q">,
  W1 = HKT.Low<T, "W">,
  X1 = HKT.Low<T, "X">,
  I1 = HKT.Low<T, "I">,
  S1 = HKT.Low<T, "S">,
  R1 = HKT.Low<T, "R">,
  E1 = HKT.Low<T, "E">,
>() => PTraversal<
  HKT.Kind<T, C, K, Q, W, X, I, S, R, E, A>,
  HKT.Kind<T, C, K1, Q1, W1, X1, I1, S1, R1, E1, B>,
  A,
  B
>;
export function fromTraversable<T>(
  T: P.Traversable<HKT.F<T>>,
): <A, B>() => PTraversal<
  HKT.FK<T, any, any, any, any, any, any, any, any, A>,
  HKT.FK<T, any, any, any, any, any, any, any, any, B>,
  A,
  B
> {
  return <A, B>() =>
    PTraversal<
      HKT.FK<T, any, any, any, any, any, any, any, any, A>,
      HKT.FK<T, any, any, any, any, any, any, any, any, B>,
      A,
      B
    >({
      modifyA_: (F) => {
        const traverseF_ = T.traverse_(F);
        return (s, f) => traverseF_(s, f);
      },
    });
}
