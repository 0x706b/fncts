import type { Either } from "../data/Either";
import type { Maybe } from "../data/Maybe";
import type { Applicative } from "./Applicative";
import type { FilterableMin } from "./Filterable";
import type { TraversableMin } from "./Traversable";

import { Just, Nothing } from "../data/Maybe";
import { Filterable } from "./Filterable";
import { HKT } from "./HKT";
import { Traversable } from "./Traversable";

/**
 * @tsplus type fncts.Witherable
 */
export interface Witherable<F extends HKT, FC = HKT.None> extends Filterable<F, FC>, Traversable<F, FC> {
  readonly wilt_: wilt_<F, FC>;
  readonly wilt: wilt<F, FC>;
  readonly wither_: wither_<F, FC>;
  readonly wither: wither<F, FC>;
}

/**
 * @tsplus type fncts.WitherableOps
 */
export interface WitherableOps {}

export const Witherable: WitherableOps = {};

export type WitherableMin<F extends HKT, FC = HKT.None> = FilterableMin<F, FC> &
  TraversableMin<F, FC> & {
    readonly wilt_: wilt_<F, FC>;
    readonly wither_: wither_<F, FC>;
  };

/**
 * @tsplus static fncts.WitherableOps __call
 */
export function mkWitherable<F extends HKT, FC = HKT.None>(F: WitherableMin<F, FC>): Witherable<F, FC> {
  return HKT.instance({
    ...Filterable(F),
    ...Traversable(F),
    wilt_: F.wilt_,
    wilt: <G extends HKT, CG = HKT.None>(A: Applicative<G, CG>) => {
      const wilt_ = F.wilt_(A);
      return <KG, QG, WG, XG, IG, SG, RG, EG, A, B, B1>(f: (a: A) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B1>>) =>
        <K, Q, W, X, I, S, R, E>(wa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>) =>
          wilt_(wa, f);
    },
    wither_: F.wither_,
    wither: <G extends HKT, CG = HKT.None>(A: Applicative<G, CG>) => {
      const wither_ = F.wither_(A);
      return <KG, QG, WG, XG, IG, SG, RG, EG, A, B>(f: (a: A) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>) =>
        <K, Q, W, X, I, S, R, E>(wa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>) =>
          wither_(wa, (a) => f(a));
    },
  });
}

export interface wither<F extends HKT, FC = HKT.None> {
  <G extends HKT, GC = HKT.None>(A: Applicative<G, GC>): <KG, QG, WG, XG, IG, SG, RG, EG, A, B>(
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  ) => <KF, QF, WF, XF, IF, SF, RF, EF>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
}

export interface wither_<F extends HKT, FC = HKT.None> {
  <G extends HKT, GC = HKT.None>(A: Applicative<G, GC>): <KF, QF, WF, XF, IF, SF, RF, EF, KG, QG, WG, XG, IG, SG, RG, EG, A, B>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
}

export interface witherSelf<F extends HKT, FC = HKT.None> {
  <KF, QF, WF, XF, IF, SF, RF, EF, A>(self: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>): <G extends HKT, GC = HKT.None>(
    A: Applicative<G, GC>,
  ) => <KG, QG, WG, XG, IG, SG, RG, EG, B>(
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>;
}

export function mkWither<F extends HKT, FC = HKT.None>(): (
  i: <FK, FQ, FW, FX, FI, FS, FR, FE, A, B, G>(_: {
    A: A;
    B: B;
    G: G;
    FK: FK;
    FQ: FQ;
    FW: FW;
    FX: FX;
    FI: FI;
    FS: FS;
    FR: FR;
    FE: FE;
  }) => (
    A: Applicative<HKT.F<G>>,
  ) => (
    f: (a: A) => HKT.FK1<G, Maybe<B>>,
  ) => (wa: HKT.Kind<F, FC, FK, FQ, FW, FX, FI, FS, FR, FE, A>) => HKT.FK1<G, HKT.Kind<F, FC, FK, FQ, FW, FX, FI, FS, FR, FE, B>>,
) => wither<F, FC>;
export function mkWither() {
  return (i: any) => i();
}

export function mkWither_<F extends HKT, FC = HKT.None>(): (
  i: <FK, FQ, FW, FX, FI, FS, FR, FE, A, B, G>(_: {
    A: A;
    B: B;
    G: G;
    FK: FK;
    FQ: FQ;
    FW: FW;
    FX: FX;
    FI: FI;
    FS: FS;
    FR: FR;
    FE: FE;
  }) => (
    A: Applicative<HKT.F<G>>,
  ) => (
    wa: HKT.Kind<F, FC, FK, FQ, FW, FX, FI, FS, FR, FE, A>,
    f: (a: A) => HKT.FK1<G, Maybe<B>>,
  ) => HKT.FK1<G, HKT.Kind<F, FC, FK, FQ, FW, FX, FI, FS, FR, FE, B>>,
) => wither_<F, FC>;
export function mkWither_() {
  return (i: any) => i();
}

export interface wilt<F extends HKT, FC = HKT.None> {
  <G extends HKT, CG = HKT.None>(A: Applicative<G, CG>): <KG, QG, WG, XG, IG, SG, RG, EG, A, B, B1>(
    f: (a: A) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B1>>,
  ) => <KF, QF, WF, XF, IF, SF, RF, EF>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
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
    readonly [HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B1>]
  >;
}

export interface wilt_<F extends HKT, FC = HKT.None> {
  <G extends HKT, CG = HKT.None>(A: Applicative<G, CG>): <KF, QF, WF, XF, IF, SF, RF, EF, KG, QG, WG, XG, IG, SG, RG, EG, B1, A, B>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (a: A) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B1>>,
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
    readonly [HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B1>]
  >;
}

export interface wiltSelf<F extends HKT, FC = HKT.None> {
  <KF, QF, WF, XF, IF, SF, RF, EF, A>(self: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>): <G extends HKT, GC = HKT.None>(
    A: Applicative<G, GC>,
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

export function mkWilt<F extends HKT, FC = HKT.None>(): (
  i: <KF, QF, WF, XF, IF, SF, RF, EF, A, B, B1, G>(_: {
    A: A;
    B: B;
    B1: B1;
    G: G;
    KF: KF;
    QF: QF;
    WF: WF;
    XF: XF;
    IF: IF;
    SF: SF;
    RF: RF;
    EF: EF;
  }) => (
    A: Applicative<HKT.F<G>>,
  ) => (
    f: (a: A) => HKT.FK1<G, Either<B, B1>>,
  ) => (
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => HKT.FK1<G, readonly [HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B1>]>,
) => wilt<F, FC>;
export function mkWilt() {
  return (i: any) => i();
}

export interface filterA_<F extends HKT, CF = HKT.None> {
  <G extends HKT, CG = HKT.None>(G: Applicative<G, CG>): <KF, QF, WF, XF, IF, SF, RF, EF, AF, KG, QG, WG, XG, IG, SG, RG, EG>(
    fa: HKT.Kind<F, CF, KF, QF, WF, XF, IF, SF, RF, EF, AF>,
    p: (a: AF) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, boolean>,
  ) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, CF, KF, QF, WF, XF, IF, SF, RF, EF, AF>>;
}

export function filterAF_<F extends HKT, CF = HKT.None>(F: WitherableMin<F, CF>): filterA_<F, CF> {
  return (G) => (fa, p) => F.wither_(G)(fa, (a) => G.map_(p(a), (bb) => (bb ? Just(a) : Nothing())));
}

export interface filterA<F extends HKT, CF = HKT.None> {
  <G extends HKT, CG = HKT.None>(G: Applicative<G, CG>): <AF, KG, QG, WG, XG, IG, SG, RG, EG>(
    p: (a: AF) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, boolean>,
  ) => <KF, QF, WF, XF, IF, SF, RF, EF>(
    fa: HKT.Kind<F, CF, KF, QF, WF, XF, IF, SF, RF, EF, AF>,
  ) => HKT.Kind<G, CG, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, CF, KF, QF, WF, XF, IF, SF, RF, EF, AF>>;
}

export function filterAF<F extends HKT, CF = HKT.None>(F: WitherableMin<F, CF>): filterA<F, CF> {
  return (G) => (p) => (fa) => filterAF_(F)(G)(fa, p);
}
