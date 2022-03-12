import type { Lazy } from "../data/function.js";

import { HKT } from "./HKT.js";

/**
 * @tsplus type fncts.Functor
 */
export interface Functor<F extends HKT, C = HKT.None> extends HKT.Typeclass<F, C> {
  readonly map_: map_<F, C>;
  readonly map: map<F, C>;
  readonly as_: as_<F, C>;
  readonly as: as<F, C>;
}

/**
 * @tsplus type fncts.FunctorOps
 */
export interface FunctorOps {}

export const Functor: FunctorOps = {};

export type FunctorMin<F extends HKT, C = HKT.None> = {
  readonly map_: map_<F, C>;
};

/**
 * @tsplus static fncts.FunctorOps __call
 */
export function mkFunctor<F extends HKT, C = HKT.None>(F: FunctorMin<F, C>): Functor<F, C> {
  return HKT.instance<Functor<F, C>>({
    map_: F.map_,
    map: (f) => (fa) => F.map_(fa, f),
    as_: (fa, b) => F.map_(fa, () => b()),
    as: (b) => (fa) => F.map_(fa, () => b()),
  });
}

export interface map_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => B,
  ): HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>;
}

export interface map<F extends HKT, C = HKT.None> {
  <A, B>(f: (a: A) => B): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>;
}

export interface as_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    b: Lazy<B>,
  ): HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>;
}

export interface as<F extends HKT, C = HKT.None> {
  <B>(b: Lazy<B>): <K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>;
}
