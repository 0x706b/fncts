import type { Functor } from "@fncts/base/typeclass/Functor";

export interface FunctorWithIndex<F extends HKT> extends Functor<F> {
  mapWithIndex<K, W, Q, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, K, W, Q, X, I, S, R, E, A>,
    f: (i: HKT.IndexFor<F, K>, a: A) => B,
  ): HKT.Kind<F, K, W, Q, X, I, S, R, E, B>;
}

/**
 * @tsplus type fncts.FunctorWithIndexOps
 */
export interface FunctorWithIndexOps {}

export const FunctorWithIndex: FunctorWithIndexOps = {};
