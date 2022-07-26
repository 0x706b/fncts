/**
 * @tsplus type fncts.Functor
 */
export interface Functor<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  readonly map: <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => B,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
}

/**
 * @tsplus type fncts.FunctorOps
 */
export interface FunctorOps {}

export const Functor: FunctorOps = {};

/**
 * @tsplus static fncts.FunctorOps as
 */
export function as<F extends HKT, FC = HKT.None>(
  F: Functor<F, FC>,
): <K, Q, W, X, I, S, R, E, A, B>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  b: Lazy<B>,
) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B> {
  return F.map;
}
