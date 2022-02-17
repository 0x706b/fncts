import type { Applicative } from "./Applicative";
import type { FoldableWithIndexMin } from "./FoldableWithIndex";
import type { FunctorWithIndexMin } from "./FunctorWithIndex";
import type { TraversableMin } from "./Traversable";

import { FoldableWithIndex } from "./FoldableWithIndex";
import { FunctorWithIndex } from "./FunctorWithIndex";
import { HKT } from "./HKT";
import { Traversable } from "./Traversable";

/**
 * @tsplus type fncts.TraversableWithIndex
 */
export interface TraversableWithIndex<F extends HKT, FC = HKT.None>
  extends FunctorWithIndex<F, FC>,
    FoldableWithIndex<F, FC>,
    Traversable<F, FC> {
  readonly traverseWithIndex_: traverseWithIndex_<F, FC>;
  readonly traverseWithIndex: traverseWithIndex<F, FC>;
}

/**
 * @tsplus type fncts.TraversableWithIndexOps
 */
export interface TraversableWithIndexOps {}

export const TraversableWithIndex: TraversableWithIndexOps = {};

export type TraversableWithIndexMin<
  F extends HKT,
  FC = HKT.None
> = FunctorWithIndexMin<F, FC> &
  FoldableWithIndexMin<F, FC> &
  TraversableMin<F, FC> & {
    readonly traverseWithIndex_: traverseWithIndex_<F, FC>;
  };

/**
 * @tsplus static fncts.TraversableWithIndexOps __call
 */
export function mkTraversableWithIndex<F extends HKT, FC = HKT.None>(
  F: TraversableWithIndexMin<F, FC>
): TraversableWithIndex<F, FC> {
  return HKT.instance<TraversableWithIndex<F, FC>>({
    ...FunctorWithIndex(F),
    ...FoldableWithIndex(F),
    ...Traversable(F),
    traverseWithIndex_: F.traverseWithIndex_,
    traverseWithIndex: (A) => {
      const traverseWithIndex_ = F.traverseWithIndex_(A);
      return (f) => (ta) => traverseWithIndex_(ta, f);
    },
  });
}

export interface traverseWithIndex_<F extends HKT, FC = HKT.None> {
  <G extends HKT, CG = HKT.None>(A: Applicative<G, CG>): <
    KG,
    QG,
    WG,
    XG,
    IG,
    SG,
    RG,
    EG,
    KF,
    QF,
    WF,
    XF,
    IF,
    SF,
    RF,
    EF,
    A,
    B
  >(
    ta: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (
      i: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
      a: A
    ) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, B>
  ) => HKT.Kind<
    G,
    CG,
    KG,
    QG,
    WG,
    XG,
    IG,
    SG,
    RG,
    EG,
    HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>
  >;
}

export interface traverseWithIndex<F extends HKT, FC = HKT.None> {
  <G extends HKT, GC = HKT.None>(A: Applicative<G, GC>): <
    KG,
    QG,
    WG,
    XG,
    IG,
    SG,
    RG,
    EG,
    KF,
    A,
    B
  >(
    f: (
      i: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
      a: A
    ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, B>
  ) => <QF, WF, XF, IF, SF, RF, EF>(
    ta: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>
  ) => HKT.Kind<
    G,
    GC,
    KG,
    QG,
    WG,
    XG,
    IG,
    SG,
    RG,
    EG,
    HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>
  >;
}

export interface traverseWithIndexSelf<F extends HKT, FC = HKT.None> {
  <KF, QF, WF, XF, IF, SF, RF, EF, A>(
    ta: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>
  ): <G extends HKT, GC = HKT.None>(
    A: Applicative<G, GC>
  ) => <KG, QG, WG, XG, IG, SG, RG, EG, B>(
    f: (
      i: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
      a: A
    ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, B>
  ) => HKT.Kind<
    G,
    GC,
    KG,
    QG,
    WG,
    XG,
    IG,
    SG,
    RG,
    EG,
    HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>
  >;
}

export function mkTraverseWithIndex<F extends HKT, FC = HKT.None>(): (
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
    A: Applicative<HKT.F<G>>
  ) => (
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, a: A) => HKT.FK1<G, B>
  ) => (
    ta: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>
  ) => HKT.FK1<G, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>>
) => traverseWithIndex_<F, FC>;
export function mkTraverseWithIndex() {
  return (i: any) => i();
}

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
    G: Applicative<HKT.F<G>>
  ) => (
    ta: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, a: A) => HKT.FK1<G, B>
  ) => HKT.FK1<G, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>>
) => traverseWithIndex_<F, FC>;
export function mkTraverseWithIndex_() {
  return (i: any) => i();
}
