import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { Filterable } from "@fncts/base/typeclass/Filterable";
import type { Traversable } from "@fncts/base/typeclass/Traversable";

/**
 * @tsplus type fncts.Witherable
 */
export interface Witherable<F extends HKT> extends Filterable<F>, Traversable<F> {
  wither<G extends HKT, KF, QF, WF, XF, IF, SF, RF, EF, KG, QG, WG, XG, IG, SG, RG, EG, A, B>(
    wa: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
    /** @tsplus auto */ G: Applicative<G>,
  ): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
  wilt<G extends HKT, KF, QF, WF, XF, IF, SF, RF, EF, KG, QG, WG, XG, IG, SG, RG, EG, B1, A, B>(
    wa: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B1>>,
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
    readonly [HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B1>]
  >;
}

/**
 * @tsplus type fncts.WitherableOps
 */
export interface WitherableOps {}

export const Witherable: WitherableOps = {};

/**
 * @tsplus fluent fncts.Kind wither
 */
export function wither<
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
  f: (a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  /** @tsplus auto */ F: Witherable<F>,
  /** @tsplus auto */ G: Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>> {
  return F.wither(wa, f);
}

export function wilt<
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
  B1,
  A,
  B,
>(
  wa: HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  f: (a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B1>>,
  /** @tsplus auto */ F: Witherable<F>,
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
  readonly [HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B>, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, B1>]
> {
  return F.wilt(wa, f);
}

/**
 * @tsplus fluent fncts.Kind filterA
 */
export function filterA<
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
  p: (a: AF) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, boolean>,
  /** @tsplus auto */ F: Witherable<F>,
  /** @tsplus auto */ G: Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, KF, QF, WF, XF, IF, SF, RF, EF, AF>> {
  return fa.wither((a) => p(a).map((bb) => (bb ? Just(a) : Nothing()), G));
}
