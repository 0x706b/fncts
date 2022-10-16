import type { Monoid } from "@fncts/base/typeclass/Monoid";

/**
 * @tsplus type fncts.Foldable
 */
export interface Foldable<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => <K, Q, W, X, I, S, R, E>(fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>) => B;
  foldRight: <A, B>(
    b: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ) => <K, Q, W, X, I, S, R, E>(fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>) => Eval<B>;
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
): <A, M>(
  f: (a: A) => M,
  /** @tsplus auto */ M: Monoid<M>,
) => <K, Q, W, X, I, S, R, E>(fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>) => M {
  return (f, M) => F.foldLeft(M.nat, (b, a) => M.combine(f(a))(b));
}
