import type { Foldable } from "@fncts/base/typeclass/Foldable";
import type { Monoid } from "@fncts/base/typeclass/Monoid";

/**
 * @tsplus type fncts.FoldableWithIndex
 */
export interface FoldableWithIndex<F extends HKT, FC = HKT.None> extends Foldable<F, FC> {
  foldLeftWithIndex: <K, A, B>(
    b: B,
    f: (i: HKT.IndexFor<F, K>, b: B, a: A) => B,
  ) => <Q, W, X, I, S, R, E>(fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>) => B;
  foldRightWithIndex: <K, A, B>(
    b: Eval<B>,
    f: (i: HKT.IndexFor<F, K>, a: A, b: Eval<B>) => Eval<B>,
  ) => <Q, W, X, I, S, R, E>(fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>) => Eval<B>;
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
): <K, A, M>(
  f: (k: HKT.IndexFor<F, K>, a: A) => M,
  /** @tsplus auto */ M: Monoid<M>,
) => <Q, W, X, I, S, R, E>(fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>) => M {
  return (f, M) => F.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(f(i, a))(b));
}
