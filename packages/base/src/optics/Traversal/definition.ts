import type { Applicative, Monoid } from "@fncts/base/typeclass";

import { Fold } from "@fncts/base/optics/Fold";
import { PSetter } from "@fncts/base/optics/Setter";

/**
 * @tsplus type fncts.optics.PTraversal
 */
export interface PTraversal<S, T, A, B> extends PSetter<S, T, A, B>, Fold<S, A> {
  readonly modifyA_: modifyA_<S, T, A, B>;
  readonly modifyA: modifyA<S, T, A, B>;
}

export interface PTraversalMin<S, T, A, B> {
  readonly modifyA_: modifyA_<S, T, A, B>;
}

/**
 * @tsplus type fncts.optics.PTraversalOps
 */
export interface PTraversalOps {}

export const PTraversal: PTraversalOps = {};

/**
 * @tsplus static fncts.optics.PTraversalOps __call
 */
export function mkPTraversal<S, T, A, B>(F: PTraversalMin<S, T, A, B>): PTraversal<S, T, A, B> {
  return {
    modifyA_: F.modifyA_,
    modifyA: (A) => (f) => (s) => F.modifyA_(A)(s, f),
    ...PSetter({
      modify_: (s, f) => F.modifyA_(Identity.Applicative)(s, f),
      set_: (s, b) => F.modifyA_(Identity.Applicative)(s, () => b),
    }),
    ...Fold({
      foldMap_:
        <M>(M: Monoid<M>) =>
        (s: S, f: (a: A) => M) =>
          F.modifyA_(Const.getApplicative(M))(s, (a) => Const(f(a))),
    }),
  };
}

/**
 * @tsplus type fncts.optics.Traversal
 */
export interface Traversal<S, A> extends PTraversal<S, S, A, A> {}

/**
 * @tsplus type fncts.optics.TraversalOps
 */
export interface TraversalOps extends PTraversalOps {}

/**
 * @tsplus static fncts.optics.TraversalOps __call
 */
export function mkTraversal<S, A>(F: PTraversalMin<S, S, A, A>): Traversal<S, A> {
  return PTraversal(F);
}

export interface modifyA_<S, T, A, B> {
  <F extends HKT, C = HKT.None>(F: Applicative<F, C>): <K, Q, W, X, I, _S, R, E>(
    s: S,
    f: (a: A) => HKT.Kind<F, C, K, Q, W, X, I, _S, R, E, B>,
  ) => HKT.Kind<F, C, K, Q, W, X, I, _S, R, E, T>;
}

export interface modifyA<S, T, A, B> {
  <F extends HKT, C = HKT.None>(F: Applicative<F, C>): <K, Q, W, X, I, _S, R, E>(
    f: (a: A) => HKT.Kind<F, C, K, Q, W, X, I, _S, R, E, B>,
  ) => (s: S) => HKT.Kind<F, C, K, Q, W, X, I, _S, R, E, T>;
}
