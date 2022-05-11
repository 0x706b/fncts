/**
 * @tsplus type fncts.Functor
 */
export interface Functor<F extends HKT> extends HKT.Typeclass<F> {
  map<K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => B,
  ): HKT.Kind<F, K, Q, W, X, I, S, R, E, B>;
}

/**
 * @tsplus type fncts.FunctorOps
 */
export interface FunctorOps {}

export const Functor: FunctorOps = {};

/**
 * @tsplus fluent fncts.Kind map
 */
export function map<F extends HKT, K, Q, W, X, I, S, R, E, A, B>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  f: (a: A) => B,
  /** @tsplus auto */ F: Functor<F>,
): HKT.Kind<F, K, Q, W, X, I, S, R, E, B> {
  return F.map(fa, f);
}

/**
 * @tsplus fluent fncts.Kind as
 */
export function as<F extends HKT, K, Q, W, X, I, S, R, E, A, B>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  b: Lazy<B>,
  /** @tsplus auto */ F: Functor<F>,
): HKT.Kind<F, K, Q, W, X, I, S, R, E, B> {
  return fa.map(() => b(), F);
}
