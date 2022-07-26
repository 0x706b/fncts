import type { Foldable } from "@fncts/base/typeclass/Foldable";
import type { Monoid } from "@fncts/base/typeclass/Monoid";

/**
 * @tsplus type fncts.FoldableWithIndex
 */
export interface FoldableWithIndex<F extends HKT, FC = HKT.None> extends Foldable<F, FC> {
  foldLeftWithIndex: <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    b: B,
    f: (i: HKT.IndexFor<F, K>, b: B, a: A) => B,
  ) => B;
  foldRightWithIndex: <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    b: Eval<B>,
    f: (i: HKT.IndexFor<F, K>, a: A, b: Eval<B>) => Eval<B>,
  ) => Eval<B>;
}

/**
 * @tsplus type fncts.FoldableWithIndexOps
 */
export interface FoldableWithIndexOps {}

export const FoldableWithIndex: FoldableWithIndexOps = {};

/**
 * @tsplus static fncts.FoldableWithIndexOps foldMapWithIndex
 */
export function foldMapWithIndex<F extends HKT, FC = HKT.None>(
  F: FoldableWithIndex<F, FC>,
): <K, Q, W, X, I, S, R, E, A, M>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  f: (k: HKT.IndexFor<F, K>, a: A) => M,
  /** @tsplus auto */ M: Monoid<M>,
) => M {
  return (fa, f, M) => F.foldLeftWithIndex(fa, M.nat, (i, b, a) => M.combine(b, f(i, a)));
}
