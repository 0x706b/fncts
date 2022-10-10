import type { Applicative, CompatibleApplicative } from "@fncts/base/typeclass/Applicative";
import type { Foldable } from "@fncts/base/typeclass/Foldable";
import type { Functor } from "@fncts/base/typeclass/Functor";

import { identity } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.Traversable
 */
export interface Traversable<F extends HKT, FC = HKT.None> extends Functor<F, FC>, Foldable<F, FC> {
  traverse: <G extends HKT, GC = HKT.None>(
    G: Applicative<G, GC>,
  ) => <A, KG, QG, WG, XG, IG, SG, RG, EG, B>(
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, B>,
  ) => <KF, QF, WF, XF, IF, SF, RF, EF>(
    ta: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
}

/**
 * @tsplus type fncts.TraversableOps
 */
export interface TraversableOps {}

export const Traversable: TraversableOps = {};

/**
 * @tsplus static fncts.TraversableOps makeTraverse
 */
export function mkTraverse_<F extends HKT, FC = HKT.None>(): (
  i: <K, Q, W, X, I, S, R, E, A, B, G>(_: {
    A: A;
    B: B;
    G: G;
    K: K;
    Q: Q;
    W: W;
    X: X;
    I: I;
    S: S;
    R: R;
    E: E;
  }) => (
    G: Applicative<HKT.F<G>>,
  ) => (
    f: (a: A) => HKT.FK1<G, B>,
  ) => (ta: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>) => HKT.FK1<G, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>>,
) => Traversable<F, FC>["traverse"];
export function mkTraverse_() {
  return (i: any) => i();
}

/**
 * @tsplus static fncts.TraversableOps sequence
 */
export function sequence<F extends HKT, FC>(
  F: Traversable<F, FC>,
): <G extends HKT, GC = HKT.None>(
  G: Applicative<G, GC>,
) => <KF, QF, WF, XF, IF, SF, RF, EF, KG, QG, WG, XG, IG, SG, RG, EG, A>(
  ta: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, A>>,
) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>> {
  return (G) => F.traverse(G)(identity);
}
