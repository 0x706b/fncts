import type { Monoid } from "@fncts/base/typeclass/Monoid";

/**
 * @tsplus type fncts.Foldable
 */
export interface Foldable<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  foldLeft: <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    b: B,
    f: (b: B, a: A) => B,
  ) => B;
  foldRight: <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    b: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ) => Eval<B>;
}

/**
 * @tsplus type fncts.FoldableOps
 */
export interface FoldableOps {}

export const Foldable: FoldableOps = {};

/**
 * @tsplus static fncts.FoldableOps foldMap
 */
export function foldMap<F extends HKT, FC = HKT.None>(
  F: Foldable<F, FC>,
): <K, Q, W, X, I, S, R, E, A, M>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  f: (a: A) => M,
  /** @tsplus auto */ M: Monoid<M>,
) => M {
  return (fa, f, M) => F.foldLeft(fa, M.nat, (b, a) => M.combine(b, f(a)));
}
