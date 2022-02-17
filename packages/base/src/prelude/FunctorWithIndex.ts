import type { FunctorMin } from "./Functor";

import { Functor } from "./Functor";
import { HKT } from "./HKT";

export interface FunctorWithIndex<F extends HKT, C = HKT.None>
  extends Functor<F, C> {
  readonly mapWithIndex_: mapWithIndex_<F, C>;
  readonly mapWithIndex: mapWithIndex<F, C>;
}

export type FunctorWithIndexMin<F extends HKT, FC = HKT.None> = FunctorMin<
  F,
  FC
> & {
  readonly mapWithIndex_: mapWithIndex_<F, FC>;
};

/**
 * @tsplus type fncts.FunctorWithIndexOps
 */
export interface FunctorWithIndexOps {}

export const FunctorWithIndex: FunctorWithIndexOps = {};

/**
 * @tsplus static fncts.FunctorWithIndexOps __call
 */
export function mkFunctorWithIndex<F extends HKT, C = HKT.None>(
  F: FunctorWithIndexMin<F, C>
): FunctorWithIndex<F, C> {
  return HKT.instance<FunctorWithIndex<F, C>>({
    ...Functor(F),
    mapWithIndex_: F.mapWithIndex_,
    mapWithIndex: (f) => (fa) => F.mapWithIndex_(fa, f),
  });
}

export interface mapWithIndex_<F extends HKT, C = HKT.None> {
  <K, W, Q, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, C, K, W, Q, X, I, S, R, E, A>,
    f: (i: HKT.IndexFor<F, HKT.OrFix<C, "K", K>>, a: A) => B
  ): HKT.Kind<F, C, K, W, Q, X, I, S, R, E, B>;
}

export interface mapWithIndex<F extends HKT, C = HKT.None> {
  <K, A, B>(f: (i: HKT.IndexFor<F, HKT.OrFix<C, "K", K>>, a: A) => B): <
    W,
    Q,
    X,
    I,
    S,
    R,
    E
  >(
    fa: HKT.Kind<F, C, K, W, Q, X, I, S, R, E, A>
  ) => HKT.Kind<F, C, K, W, Q, X, I, S, R, E, B>;
}
