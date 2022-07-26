import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { FoldableWithIndex } from "@fncts/base/typeclass/FoldableWithIndex";
import type { FunctorWithIndex } from "@fncts/base/typeclass/FunctorWithIndex";
import type { Traversable } from "@fncts/base/typeclass/Traversable";

/**
 * @tsplus type fncts.TraversableWithIndex
 */
export interface TraversableWithIndex<F extends HKT, FC = HKT.None>
  extends FunctorWithIndex<F, FC>,
    FoldableWithIndex<F, FC>,
    Traversable<F, FC> {
  traverseWithIndex: <KF, QF, WF, XF, IF, SF, RF, EF, A>(
    ta: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => <G extends HKT, GC = HKT.None>(
    G: Applicative<G, GC>,
  ) => <KG, QG, WG, XG, IG, SG, RG, EG, B>(
    f: (i: HKT.IndexFor<F, KF>, a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, B>,
  ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
}

/**
 * @tsplus type fncts.TraversableWithIndexOps
 */
export interface TraversableWithIndexOps {}

export const TraversableWithIndex: TraversableWithIndexOps = {};

/**
 * @tsplus static fncts.TraversableWithIndexOps makeTraverseWithIndex
 */
export function mkTraverseWithIndex_<F extends HKT, FC = HKT.None>(): (
  i: <K, Q, W, X, I, S, R, E, A, B, G>(_: {
    A: A;
    B: B;
    G: G;
    K: HKT.OrFix<FC, "K", K>;
    Q: Q;
    W: W;
    X: X;
    I: I;
    S: S;
    R: R;
    E: E;
  }) => (
    ta: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => (
    G: Applicative<HKT.F<G>>,
  ) => (
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, a: A) => HKT.FK1<G, B>,
  ) => HKT.FK1<G, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>>,
) => TraversableWithIndex<F, FC>["traverseWithIndex"];
export function mkTraverseWithIndex_() {
  return (i: any) => i();
}
