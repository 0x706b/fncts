import type { Functor } from "@fncts/base/typeclass/Functor";

export interface FunctorWithIndex<F extends HKT, FC = HKT.None> extends Functor<F, FC> {
  readonly mapWithIndex: <K, A, B>(
    f: (i: HKT.IndexFor<F, K>, a: A) => B,
  ) => <W, Q, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, W, Q, X, I, S, R, E, A>,
  ) => HKT.Kind<F, FC, K, W, Q, X, I, S, R, E, B>;
}

/**
 * @tsplus type fncts.FunctorWithIndexOps
 */
export interface FunctorWithIndexOps {}

export const FunctorWithIndex: FunctorWithIndexOps = {};
