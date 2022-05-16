import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { Foldable } from "@fncts/base/typeclass/Foldable";
import type { Functor } from "@fncts/base/typeclass/Functor";

import { identity } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.Traversable
 */
export interface Traversable<F extends HKT> extends Functor<F>, Foldable<F> {
  traverse<G extends HKT, KF, QF, WF, XF, IF, SF, RF, EF, KG, QG, WG, XG, IG, SG, RG, EG, A, B>(
    ta: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, B>,
    /** @tsplus auto */ G: Applicative<G>,
  ): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
}

/**
 * @tsplus type fncts.TraversableOps
 */
export interface TraversableOps {}

export const Traversable: TraversableOps = {};

/**
 * @tsplus fluent fncts.Kind traverse
 */
export function traverse<
  F extends HKT,
  G extends HKT,
  KF,
  QF,
  WF,
  XF,
  IF,
  SF,
  RF,
  EF,
  KG,
  QG,
  WG,
  XG,
  IG,
  SG,
  RG,
  EG,
  A,
  B,
>(
  ta: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  f: (a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, B>,
  /** @tsplus auto */ F: Traversable<F>,
  /** @tsplus auto */ G: Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>> {
  return F.traverse(ta, f, G);
}

/**
 * @tsplus fluent fncts.Kind sequence
 */
export function sequence<
  F extends HKT,
  G extends HKT,
  KF,
  QF,
  WF,
  XF,
  IF,
  SF,
  RF,
  EF,
  KG,
  QG,
  WG,
  XG,
  IG,
  SG,
  RG,
  EG,
  A,
>(
  ta: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, A>>,
  /** @tsplus auto */ F: Traversable<F>,
  /** @tsplus auto */ G: Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>> {
  return ta.traverse(identity);
}
