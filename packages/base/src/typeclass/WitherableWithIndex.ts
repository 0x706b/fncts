import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { FilterableWithIndex } from "@fncts/base/typeclass/FilterableWithIndex";
import type { TraversableWithIndex } from "@fncts/base/typeclass/TraversableWithIndex";
import type { Witherable } from "@fncts/base/typeclass/Witherable";

/**
 * @tsplus type fncts.WitherableWithIndex
 */
export interface WitherableWithIndex<F extends HKT, FC = HKT.None>
  extends FilterableWithIndex<F, FC>,
    TraversableWithIndex<F, FC>,
    Witherable<F, FC> {
  witherWithIndex: <KF, QF, WF, XF, IF, SF, RF, EF, A>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => <G extends HKT, GC = HKT.None>(
    G: Applicative<G, GC>,
  ) => <KG, QG, WG, XG, IG, SG, RG, EG, B>(
    f: (k: HKT.IndexFor<F, KF>, a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
  wiltWithIndex: <KF, QF, WF, XF, IF, SF, RF, EF, A, B, B2>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => <G extends HKT, GC = HKT.None>(
    G: Applicative<G, GC>,
  ) => <KG, QG, WG, XG, IG, SG, RG, EG, B, B2>(
    f: (k: HKT.IndexFor<F, KF>, a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B2>>,
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
    readonly [HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B2>]
  >;
}

/**
 * @tsplus type fncts.WitherableWithIndexOps
 */
export interface WitherableWithIndexOps {}

export const WitherableWithIndex: WitherableWithIndexOps = {};

/**
 * @tsplus static fncts.WitherableWithIndexOps makeWitherWithIndex
 */
export function makeWitherWithIndex<F extends HKT, FC = HKT.None>(): (
  i: <KF, QF, WF, XF, IF, SF, RF, EF, A, B, G>(_: {
    A: A;
    B: B;
    G: G;
    FK: KF;
    FQ: QF;
    FW: WF;
    FX: XF;
    FI: IF;
    FS: SF;
    FR: RF;
    FE: EF;
  }) => (
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => (
    G: Applicative<HKT.F<G>>,
  ) => (
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>, a: A) => HKT.FK1<G, Maybe<B>>,
  ) => HKT.FK1<G, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>,
) => WitherableWithIndex<F, FC>["witherWithIndex"];
export function makeWitherWithIndex() {
  return (i: any) => i();
}

/**
 * @tsplus static fncts.WitherableWithIndexOps makeWiltWithIndex
 */
export function makeWiltWithIndex<F extends HKT, FC = HKT.None>(): (
  i: <KF, QF, WF, XF, IF, SF, RF, EF, A, B, B1, G>(_: {
    G: G;
    FK: KF;
    FQ: QF;
    FW: WF;
    FX: XF;
    FI: IF;
    FS: SF;
    FR: RF;
    FE: EF;
    A: A;
    B: B;
    B1: B1;
  }) => (
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => (
    G: Applicative<HKT.F<G>>,
  ) => (
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>, a: A) => HKT.FK1<G, Either<B, B1>>,
  ) => HKT.FK1<
    G,
    readonly [HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B1>]
  >,
) => WitherableWithIndex<F, FC>["wiltWithIndex"];
export function makeWiltWithIndex() {
  return (i: any) => i();
}

export function filterWithIndexA<F extends HKT, FC = HKT.None>(
  F: WitherableWithIndex<F, FC>,
): <KF, QF, WF, XF, IF, SF, RF, EF, AF>(
  fa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, AF>,
) => <G extends HKT, GC = HKT.None>(
  G: Applicative<G, GC>,
) => <KG, QG, WG, XG, IG, SG, RG, EG>(
  p: (i: HKT.IndexFor<F, KF>, a: AF) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, boolean>,
) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, AF>> {
  return (fa) => (G) => (p) => F.witherWithIndex(fa)(G)((i, a) => G.map(p(i, a), (bb) => (bb ? Just(a) : Nothing())));
}
