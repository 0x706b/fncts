import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { FoldableWithIndex } from "@fncts/base/typeclass/FoldableWithIndex";
import type { FunctorWithIndex } from "@fncts/base/typeclass/FunctorWithIndex";
import type { Traversable } from "@fncts/base/typeclass/Traversable";

/**
 * @tsplus type fncts.TraversableWithIndex
 */
export interface TraversableWithIndex<F extends HKT> extends FunctorWithIndex<F>, FoldableWithIndex<F>, Traversable<F> {
  traverseWithIndex<G extends HKT, KG, QG, WG, XG, IG, SG, RG, EG, KF, QF, WF, XF, IF, SF, RF, EF, A, B>(
    ta: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (i: HKT.IndexFor<F, KF>, a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, B>,
    /** @tsplus auto */ G: Applicative<G>,
  ): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
}

/**
 * @tsplus type fncts.TraversableWithIndexOps
 */
export interface TraversableWithIndexOps {}

export const TraversableWithIndex: TraversableWithIndexOps = {};

export function traverseWithIndex<
  F extends HKT,
  G extends HKT,
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
  B,
>(
  ta: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  f: (i: HKT.IndexFor<F, KF>, a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, B>,
  /** @tsplus auto */ F: TraversableWithIndex<F>,
  /** @tsplus auto */ G: Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>> {
  return F.traverseWithIndex(ta, f, G);
}
