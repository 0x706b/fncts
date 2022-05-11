import type { Foldable } from "@fncts/base/typeclass/Foldable";
import type { Monoid } from "@fncts/base/typeclass/Monoid";

/**
 * @tsplus type fncts.FoldableWithIndex
 */
export interface FoldableWithIndex<F extends HKT> extends Foldable<F> {
  foldLeftWithIndex<K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    b: B,
    f: (i: HKT.IndexFor<F, K>, b: B, a: A) => B,
  ): B;
  foldRightWithIndex<K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    b: Eval<B>,
    f: (i: HKT.IndexFor<F, K>, a: A, b: Eval<B>) => Eval<B>,
  ): Eval<B>;
}

/**
 * @tsplus type fncts.FoldableWithIndexOps
 */
export interface FoldableWithIndexOps {}

export const FoldableWithIndex: FoldableWithIndexOps = {};

/**
 * @tsplus fluent fncts.Kind foldLeftWithIndex
 */
export function foldLeftWithIndex<F extends HKT, K, Q, W, X, I, S, R, E, A, B>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  b: B,
  f: (i: HKT.IndexFor<F, K>, b: B, a: A) => B,
  /** @tsplus auto */ F: FoldableWithIndex<F>,
): B {
  return F.foldLeftWithIndex(fa, b, f);
}

/**
 * @tsplus fluent fncts.Kind foldRightWithIndex
 */
export function foldRightWithIndex<F extends HKT, K, Q, W, X, I, S, R, E, A, B>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  b: Eval<B>,
  f: (i: HKT.IndexFor<F, K>, a: A, b: Eval<B>) => Eval<B>,
  /** @tsplus auto */ F: FoldableWithIndex<F>,
): Eval<B> {
  return F.foldRightWithIndex(fa, b, f);
}

/**
 * @tsplus fluent fncts.Kind foldMapWithIndex
 */
export function foldMapWithIndex<F extends HKT, K, Q, W, X, I, S, R, E, A, M>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  f: (k: HKT.IndexFor<F, K>, a: A) => M,
  /** @tsplus auto */ M: Monoid<M>,
  /**
   * @tsplus auto
   * @tsplus implicit local
   */
  F: FoldableWithIndex<F>,
): M {
  return fa.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(b, f(i, a)));
}
