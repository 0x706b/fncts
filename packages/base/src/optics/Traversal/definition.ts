import type { Applicative, Monoid } from "@fncts/base/typeclass";

import { Fold } from "@fncts/base/optics/Fold";
import { PSetter } from "@fncts/base/optics/Setter";

/**
 * @tsplus type fncts.optics.PTraversal
 */
export interface PTraversal<S, T, A, B> extends PSetter<S, T, A, B>, Fold<S, A> {
  modifyA: <F extends HKT, FC = HKT.None>(
    F: Applicative<F, FC>,
  ) => <K, Q, W, X, I, _S, R, E>(
    s: S,
    f: (a: A) => HKT.Kind<F, FC, K, Q, W, X, I, _S, R, E, B>,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, _S, R, E, T>;
}

export interface PTraversalMin<S, T, A, B> {
  modifyA: <F extends HKT, FC = HKT.None>(
    F: Applicative<F, FC>,
  ) => <K, Q, W, X, I, _S, R, E>(
    s: S,
    f: (a: A) => HKT.Kind<F, FC, K, Q, W, X, I, _S, R, E, B>,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, _S, R, E, T>;
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
    modifyA: F.modifyA,
    ...PSetter<S, T, A, B>({
      modify_: (s, f) =>
        F.modifyA(Identity.Applicative)(
          s,
          f.compose((b) => Identity.get(b)),
        ).getIdentity,
      set_: (s, b) => F.modifyA(Identity.Applicative)(s, () => Identity.get(b)).getIdentity,
    }),
    ...Fold<S, A>({
      foldMap_:
        <M>(M: Monoid<M>) =>
        (s: S, f: (a: A) => M) =>
          F.modifyA(Const.getApplicative(M))(s, (a) => Const(f(a))).getConst,
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
