import type { Functor } from "@fncts/base/typeclass/Functor";

export interface FunctorWithIndex<F extends HKT, FC = HKT.None> extends Functor<F, FC> {
  readonly mapWithIndex: <K, W, Q, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, W, Q, X, I, S, R, E, A>,
    f: (i: HKT.IndexFor<F, K>, a: A) => B,
  ) => HKT.Kind<F, FC, K, W, Q, X, I, S, R, E, B>;
}

/**
 * @tsplus type fncts.FunctorWithIndexOps
 */
export interface FunctorWithIndexOps {}

export const FunctorWithIndex: FunctorWithIndexOps = {};
