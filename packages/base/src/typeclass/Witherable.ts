import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { Filterable } from "@fncts/base/typeclass/Filterable";
import type { Traversable } from "@fncts/base/typeclass/Traversable";

/**
 * @tsplus type fncts.Witherable
 */
export interface Witherable<F extends HKT, FC = HKT.None> extends Filterable<F, FC>, Traversable<F, FC> {
  wither: <KF, QF, WF, XF, IF, SF, RF, EF, A>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => <G extends HKT, GC = HKT.None>(
    G: Applicative<G, GC>,
  ) => <KG, QG, WG, XG, IG, SG, RG, EG, B>(
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
  wilt: <KF, QF, WF, XF, IF, SF, RF, EF, A>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => <G extends HKT, GC = HKT.None>(
    G: Applicative<G, GC>,
  ) => <KG, QG, WG, XG, IG, SG, RG, EG, B, B1>(
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B1>>,
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
    readonly [HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B1>]
  >;
}

/**
 * @tsplus type fncts.WitherableOps
 */
export interface WitherableOps {}

export const Witherable: WitherableOps = {};

/**
 * @tsplus static fncts.WitherableOps filterA
 */
export function filterA<F extends HKT, FC = HKT.None>(
  F: Witherable<F, FC>,
): <KF, QF, WF, XF, IF, SF, RF, EF, AF>(
  fa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, AF>,
) => <G extends HKT, GC = HKT.None>(
  G: Applicative<G, GC>,
) => <KG, QG, WG, XG, IG, SG, RG, EG>(
  p: (a: AF) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, boolean>,
) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, AF>> {
  return (fa) => (G) => (p) => F.wither(fa)(G)((a) => G.map(p(a), (bb) => (bb ? Just(a) : Nothing())));
}
