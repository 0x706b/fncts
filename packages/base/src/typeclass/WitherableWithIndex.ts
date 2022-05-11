import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { FilterableWithIndex } from "@fncts/base/typeclass/FilterableWithIndex";
import type { TraversableWithIndex } from "@fncts/base/typeclass/TraversableWithIndex";
import type { Witherable } from "@fncts/base/typeclass/Witherable";

/**
 * @tsplus type fncts.WitherableWithIndex
 */
export interface WitherableWithIndex<F extends HKT>
  extends FilterableWithIndex<F>,
    TraversableWithIndex<F>,
    Witherable<F> {
  witherWithIndex<G extends HKT, KF, QF, WF, XF, IF, SF, RF, EF, KG, QG, WG, XG, IG, SG, RG, EG, A, B>(
    wa: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (k: HKT.IndexFor<F, KF>, a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
    /** @tsplus auto */ G: Applicative<G>,
  ): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
  wiltWithIndex<G extends HKT, KF, QF, WF, XF, IF, SF, RF, EF, KG, QG, WG, XG, IG, SG, RG, EG, A, B, B2>(
    wa: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (k: HKT.IndexFor<F, KF>, a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B2>>,
    /** @tsplus auto */ G: Applicative<G>,
  ): HKT.Kind<
    G,
    KG,
    QG,
    WG,
    XG,
    IG,
    SG,
    RG,
    EG,
    readonly [HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B2>]
  >;
}

/**
 * @tsplus type fncts.WitherableWithIndexOps
 */
export interface WitherableWithIndexOps {}

export const WitherableWithIndex: WitherableWithIndexOps = {};

/**
 * @tsplus fluent fncts.Kind witherWithIndex
 */
export function witherWithIndex<
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
  wa: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  f: (k: HKT.IndexFor<F, KF>, a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  /** @tsplus auto */
  F: WitherableWithIndex<F>,
  /** @tsplus auto */
  G: Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>> {
  return F.witherWithIndex(wa, f, G);
}

/**
 * @tsplus fluent fncts.Kind wiltWithIndex
 */
export function wiltWithIndex<
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
  B2,
>(
  wa: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  f: (k: HKT.IndexFor<F, KF>, a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B2>>,
  /** @tsplus auto */
  F: WitherableWithIndex<F>,
  /** @tsplus auto */ G: Applicative<G>,
): HKT.Kind<
  G,
  KG,
  QG,
  WG,
  XG,
  IG,
  SG,
  RG,
  EG,
  readonly [HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B2>]
> {
  return F.wiltWithIndex(wa, f, G);
}

export function filterWithIndexA<
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
  AF,
  KG,
  QG,
  WG,
  XG,
  IG,
  SG,
  RG,
  EG,
>(
  fa: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, AF>,
  p: (i: HKT.IndexFor<F, KF>, a: AF) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, boolean>,
  /**
   * @tsplus auto
   * @tsplus implicit local
   */
  F: WitherableWithIndex<F>,
  /**
   * @tsplus auto
   * @tsplus implicit local
   */
  G: Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, AF>> {
  return fa.witherWithIndex((i, a) => p(i, a).map((bb) => (bb ? Just(a) : Nothing()), G));
}
