/**
 * @tsplus type fncts.Functor
 */
export interface Functor<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  readonly map: <A, B>(
    f: (a: A) => B,
  ) => <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
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
): <B>(
  b: Lazy<B>,
) => <K, Q, W, X, I, S, R, E, A>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B> {
  return F.map;
}
