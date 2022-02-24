import type { Either } from "../data/Either";
import type { Maybe } from "../data/Maybe";
import type { Applicative } from "./Applicative";
import type { FilterableWithIndexMin } from "./FilterableWithIndex";
import type { TraversableWithIndexMin } from "./TraversableWithIndex";
import type { WitherableMin } from "./Witherable";

import { Just, Nothing } from "../data/Maybe";
import { FilterableWithIndex } from "./FilterableWithIndex";
import { HKT } from "./HKT";
import { TraversableWithIndex } from "./TraversableWithIndex";
import { Witherable } from "./Witherable";

/**
 * @tsplus type fncts.WitherableWithIndex
 */
export interface WitherableWithIndex<F extends HKT, FC = HKT.None>
  extends FilterableWithIndex<F, FC>,
    TraversableWithIndex<F, FC>,
    Witherable<F, FC> {
  readonly witherWithIndex_: witherWithIndex_<F, FC>;
  readonly witherWithIndex: witherWithIndex<F, FC>;
  readonly wiltWithIndex_: wiltWithIndex_<F, FC>;
  readonly wiltWithIndex: wiltWithIndex<F, FC>;
}

/**
 * @tsplus type fncts.WitherableWithIndexOps
 */
export interface WitherableWithIndexOps {}

export const WitherableWithIndex: WitherableWithIndexOps = {};

export type WitherableWithIndexMin<F extends HKT, FC = HKT.None> = FilterableWithIndexMin<F, FC> &
  TraversableWithIndexMin<F, FC> &
  WitherableMin<F, FC> & {
    readonly witherWithIndex_: witherWithIndex_<F, FC>;
    readonly wiltWithIndex_: wiltWithIndex_<F, FC>;
  };

/**
 * @tsplus static fncts.WitherableWithIndexOps __call
 */
export function mkWitherableWithIndex<F extends HKT, FC = HKT.None>(
  F: WitherableWithIndexMin<F, FC>,
): WitherableWithIndex<F, FC> {
  return HKT.instance({
    ...FilterableWithIndex(F),
    ...TraversableWithIndex(F),
    ...Witherable(F),
    wiltWithIndex_: F.wiltWithIndex_,
    wiltWithIndex: <G extends HKT, CG = HKT.None>(AG: Applicative<G, CG>) => {
      const wiltWithIndex_ = F.wiltWithIndex_(AG);
      return <KG, QG, WG, XG, IG, SG, RG, EG, A, B, B1, KF>(
          f: (
            k: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
            a: A,
          ) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B1>>,
        ) =>
        <QF, WF, XF, IF, SF, RF, EF>(wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>) =>
          wiltWithIndex_(wa, f);
    },
    witherWithIndex_: F.witherWithIndex_,
    witherWithIndex: <G extends HKT, CG = HKT.None>(AG: Applicative<G, CG>) => {
      const witherWithIndex_ = F.witherWithIndex_(AG);
      return <KG, QG, WG, XG, IG, SG, RG, EG, A, B, KF>(
          f: (
            k: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
            a: A,
          ) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
        ) =>
        <QF, WF, XF, IF, SF, RF, EF>(wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>) =>
          witherWithIndex_(wa, f);
    },
  });
}

export interface witherWithIndex<F extends HKT, FC = HKT.None> {
  <G extends HKT, GC = HKT.None>(F: Applicative<G, GC>): <KG, QG, WG, XG, IG, SG, RG, EG, A, B, KF>(
    f: (
      k: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
      a: A,
    ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  ) => <QF, WF, XF, IF, SF, RF, EF>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
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

export interface witherWithIndex_<F extends HKT, FC = HKT.None> {
  <G extends HKT, GC = HKT.None>(F: Applicative<G, GC>): <
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
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (
      k: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
      a: A,
    ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
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

export interface witherWithIndexSelf<F extends HKT, FC = HKT.None> {
  <KF, QF, WF, XF, IF, SF, RF, EF, A>(self: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>): <
    G extends HKT,
    GC = HKT.None,
  >(
    F: Applicative<G, GC>,
  ) => <KG, QG, WG, XG, IG, SG, RG, EG, B>(
    f: (
      k: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
      a: A,
    ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
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

export function mkWitherWithIndex<F extends HKT, FC = HKT.None>(): (
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
    G: Applicative<HKT.F<G>>,
  ) => (
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>, a: A) => HKT.FK1<G, Maybe<B>>,
  ) => (
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => HKT.FK1<G, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>,
) => witherWithIndex<F, FC>;
export function mkWitherWithIndex() {
  return (i: any) => i();
}

export function mkWitherWithIndex_<F extends HKT, FC = HKT.None>(): (
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
    G: Applicative<HKT.F<G>>,
  ) => (
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>, a: A) => HKT.FK1<G, Maybe<B>>,
  ) => HKT.FK1<G, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>,
) => witherWithIndex_<F, FC>;
export function mkWitherWithIndex_() {
  return (i: any) => i();
}

export interface wiltWithIndex<F extends HKT, FC = HKT.None> {
  <G extends HKT, GC = HKT.None>(F: Applicative<G, GC>): <
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
    KF,
  >(
    f: (
      k: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
      a: A,
    ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B2>>,
  ) => <QF, WF, XF, IF, SF, RF, EF>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
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
    readonly [
      HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>,
      HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B2>,
    ]
  >;
}

export interface wiltWithIndex_<F extends HKT, FC = HKT.None> {
  <G extends HKT, GC = HKT.None>(F: Applicative<G, GC>): <
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
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (
      k: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
      a: A,
    ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B2>>,
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
    readonly [
      HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>,
      HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B2>,
    ]
  >;
}

export interface wiltWithIndexSelf<F extends HKT, FC = HKT.None> {
  <KF, QF, WF, XF, IF, SF, RF, EF, A>(self: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>): <
    G extends HKT,
    GC = HKT.None,
  >(
    F: Applicative<G, GC>,
  ) => <KG, QG, WG, XG, IG, SG, RG, EG, B1, B2>(
    f: (
      k: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>,
      a: A,
    ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Either<B1, B2>>,
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
    readonly [
      HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B1>,
      HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B2>,
    ]
  >;
}

export function mkWiltWithIndex<F extends HKT, FC = HKT.None>(): (
  i: <KF, QF, WF, XF, IF, SF, RF, EF, A, B, B2, G>(_: {
    A: A;
    B: B;
    B2: B2;
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
    G: Applicative<HKT.F<G>>,
  ) => (
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>, a: A) => HKT.FK1<G, Either<B, B2>>,
  ) => (
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => HKT.FK1<
    G,
    readonly [
      HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>,
      HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B2>,
    ]
  >,
) => wiltWithIndex<F, FC>;
export function mkWiltWithIndex() {
  return (i: any) => i();
}

export function mkWiltWithIndex_<F extends HKT, FC = HKT.None>(): (
  i: <KF, QF, WF, XF, IF, SF, RF, EF, A, B1, B2, G>(_: {
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
    B: B1;
    B2: B2;
  }) => (
    G: Applicative<HKT.F<G>>,
  ) => (
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", KF>>, a: A) => HKT.FK1<G, Either<B1, B2>>,
  ) => HKT.FK1<
    G,
    readonly [
      HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B1>,
      HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B2>,
    ]
  >,
) => wiltWithIndex_<F, FC>;
export function mkWiltWithIndex_() {
  return (i: any) => i();
}

export interface FilterWithIndexAFn_<F extends HKT, CF = HKT.None> {
  <G extends HKT, CG = HKT.None>(G: Applicative<G, CG>): <
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
    fa: HKT.Kind<F, CF, KF, QF, WF, XF, IF, SF, RF, EF, AF>,
    p: (
      i: HKT.IndexFor<F, HKT.OrFix<CF, "K", KF>>,
      a: AF,
    ) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, boolean>,
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
    HKT.Kind<F, CF, KF, QF, WF, XF, IF, SF, RF, EF, AF>
  >;
}

export function filterWithIndexAF_<F extends HKT, CF = HKT.None>(
  F: WitherableWithIndexMin<F, CF>,
): FilterWithIndexAFn_<F, CF> {
  return (G) => (fa, p) =>
    F.witherWithIndex_(G)(fa, (i, a) => G.map_(p(i, a), (bb) => (bb ? Just(a) : Nothing())));
}

export interface filterWithIndexA<F extends HKT, CF = HKT.None> {
  <G extends HKT, CG = HKT.None>(G: Applicative<G, CG>): <KF, AF, KG, QG, WG, XG, IG, SG, RG, EG>(
    p: (
      i: HKT.IndexFor<F, HKT.OrFix<CF, "K", KF>>,
      a: AF,
    ) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, boolean>,
  ) => <QF, WF, XF, IF, SF, RF, EF>(
    fa: HKT.Kind<F, CF, KF, QF, WF, XF, IF, SF, RF, EF, AF>,
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
    HKT.Kind<F, CF, KF, QF, WF, XF, IF, SF, RF, EF, AF>
  >;
}

export function filterWithIndexAF<F extends HKT, CF = HKT.None>(
  F: WitherableWithIndexMin<F, CF>,
): filterWithIndexA<F, CF> {
  return (G) => (p) => (fa) => filterWithIndexAF_(F)(G)(fa, p);
}
