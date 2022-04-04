import type { FoldableMin } from "@fncts/base/prelude/Foldable";
import type { Monoid } from "@fncts/base/prelude/Monoid";

import { Foldable } from "@fncts/base/prelude/Foldable";

/**
 * @tsplus type fncts.FoldableWithIndex
 */
export interface FoldableWithIndex<F extends HKT, FC = HKT.None> extends Foldable<F, FC> {
  readonly foldLeftWithIndex_: foldLeftWithIndex_<F, FC>;
  readonly foldLeftWithIndex: foldLeftWithIndex<F, FC>;
  readonly foldRightWithIndex_: foldRightWithIndex_<F, FC>;
  readonly foldRightWithIndex: foldRightWithIndex<F, FC>;
  readonly foldMapWithIndex_: foldMapWithIndex_<F, FC>;
  readonly foldMapWithIndex: foldMapWithIndex<F, FC>;
}

/**
 * @tsplus type fncts.FoldableWithIndexOps
 */
export interface FoldableWithIndexOps {}

export const FoldableWithIndex: FoldableWithIndexOps = {};

export type FoldableWithIndexMin<F extends HKT, FC = HKT.None> = FoldableMin<F, FC> & {
  readonly foldLeftWithIndex_: foldLeftWithIndex_<F, FC>;
  readonly foldRightWithIndex_: foldRightWithIndex_<F, FC>;
};

/**
 * @tsplus static fncts.FoldableWithIndexOps __call
 */
export function mkFoldableWithIndex<F extends HKT, FC = HKT.None>(
  F: FoldableWithIndexMin<F, FC>,
): FoldableWithIndex<F, FC> {
  const foldMapWithIndex_: foldMapWithIndex_<F, FC> = (M) => (fa, f) =>
    F.foldLeftWithIndex_(fa, M.nat, (i, b, a) => M.combine_(b, f(i, a)));
  return HKT.instance<FoldableWithIndex<F, FC>>({
    ...Foldable(F),
    foldLeftWithIndex_: F.foldLeftWithIndex_,
    foldLeftWithIndex: (b, f) => (fa) => F.foldLeftWithIndex_(fa, b, f),
    foldRightWithIndex_: F.foldRightWithIndex_,
    foldRightWithIndex: (b, f) => (fa) => F.foldRightWithIndex_(fa, b, f),
    foldMapWithIndex_,
    foldMapWithIndex: (M) => (f) => (fa) => foldMapWithIndex_(M)(fa, f),
  });
}

export interface foldLeftWithIndex_<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    b: B,
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, b: B, a: A) => B,
  ): B;
}

export interface foldLeftWithIndex<F extends HKT, FC = HKT.None> {
  <K, A, B>(b: B, f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, b: B, a: A) => B): <
    Q,
    W,
    X,
    I,
    S,
    R,
    E,
  >(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => B;
}

export interface foldRightWithIndex_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    b: Eval<B>,
    f: (i: HKT.IndexFor<F, HKT.OrFix<C, "K", K>>, a: A, b: Eval<B>) => Eval<B>,
  ): Eval<B>;
}

export interface foldRightWithIndex<F extends HKT, C = HKT.None> {
  <K, A, B>(
    b: Eval<B>,
    f: (i: HKT.IndexFor<F, HKT.OrFix<C, "K", K>>, a: A, b: Eval<B>) => Eval<B>,
  ): <Q, W, X, I, S, R, E>(fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>) => Eval<B>;
}

export interface foldMapWithIndex_<F extends HKT, C = HKT.None> {
  <M>(M: Monoid<M>): <K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    f: (k: HKT.IndexFor<F, HKT.OrFix<C, "K", K>>, a: A) => M,
  ) => M;
}

export interface foldMapWithIndex<F extends HKT, C = HKT.None> {
  <M>(M: Monoid<M>): <K, A>(
    f: (i: HKT.IndexFor<F, HKT.OrFix<C, "K", K>>, a: A) => M,
  ) => <Q, W, X, I, S, R, E>(fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>) => M;
}
