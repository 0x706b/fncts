import type { Monoid } from "@fncts/base/typeclass/Monoid";

/**
 * @tsplus type fncts.Foldable
 */
export interface Foldable<F extends HKT> extends HKT.Typeclass<F> {
  foldLeft<K, Q, W, X, I, S, R, E, A, B>(fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>, b: B, f: (b: B, a: A) => B): B;
  foldRight<K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    b: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ): Eval<B>;
}

/**
 * @tsplus type fncts.FoldableOps
 */
export interface FoldableOps {}

export const Foldable: FoldableOps = {};

/**
 * @tsplus fluent fncts.Kind foldLeft
 */
export function foldLeft<F extends HKT, K, Q, W, X, I, S, R, E, A, B>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  b: B,
  f: (b: B, a: A) => B,
  /** @tsplus auto */ F: Foldable<F>,
): B {
  return F.foldLeft(fa, b, f);
}

/**
 * @tsplus fluent fncts.Kind foldRight
 */
export function foldRight<F extends HKT, K, Q, W, X, I, S, R, E, A, B>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  b: Eval<B>,
  f: (a: A, b: Eval<B>) => Eval<B>,
  /** @tsplus auto */ F: Foldable<F>,
): Eval<B> {
  return F.foldRight(fa, b, f);
}

/**
 * @tsplus fluent fncts.Kind foldMap
 */
export function foldMap<F extends HKT, K, Q, W, X, I, S, R, E, A, M>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  f: (a: A) => M,
  /**
   * @tsplus auto
   * @tsplus implicit local
   */
  F: Foldable<F>,
  /** @tsplus auto */
  M: Monoid<M>,
): M {
  return fa.foldLeft(M.nat, (b, a) => M.combine(b, f(a)));
}
