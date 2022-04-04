import type { Applicative, CompatibleApplicative } from "@fncts/base/prelude/Applicative";
import type { FoldableMin } from "@fncts/base/prelude/Foldable";
import type { FunctorMin } from "@fncts/base/prelude/Functor";

import { identity } from "@fncts/base/data/function";
import { Foldable } from "@fncts/base/prelude/Foldable";
import { Functor } from "@fncts/base/prelude/Functor";

/**
 * @tsplus type fncts.Traversable
 */
export interface Traversable<F extends HKT, FC = HKT.None> extends Functor<F, FC>, Foldable<F, FC> {
  readonly traverse_: traverse_<F, FC>;
  readonly traverse: traverse<F, FC>;
  readonly sequence: sequence<F, FC>;
}

/**
 * @tsplus type fncts.TraversableOps
 */
export interface TraversableOps {}

export const Traversable: TraversableOps = {};

export type TraversableMin<F extends HKT, FC = HKT.None> = FunctorMin<F, FC> &
  FoldableMin<F, FC> & {
    readonly traverse_: traverse_<F, FC>;
  };

/**
 * @tsplus static fncts.TraversableOps __call
 */
export function mkTraversable<F extends HKT, FC = HKT.None>(
  F: TraversableMin<F, FC>,
): Traversable<F, FC> {
  const sequence: sequence<F, FC> = (A) => {
    const traverse_ = F.traverse_(A);
    return (ta) => traverse_(ta, identity);
  };
  return HKT.instance<Traversable<F, FC>>({
    ...Functor(F),
    ...Foldable(F),
    traverse_: F.traverse_,
    traverse: (A) => {
      const traverse_ = F.traverse_(A);
      return (f) => (ta) => traverse_(ta, f);
    },
    sequence,
  });
}

export interface traverse_<F extends HKT, FC = HKT.None> {
  <G extends HKT, GC = HKT.None>(A: Applicative<G, GC>): <
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
    ta: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, B>,
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

export interface traverseSelf<F extends HKT, FC = HKT.None> {
  <KF, QF, WF, XF, IF, SF, RF, EF, A>(ta: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>): <
    G extends HKT,
    GC = HKT.None,
  >(
    A: Applicative<G, GC>,
  ) => <KG, QG, WG, XG, IG, SG, RG, EG, B>(
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, B>,
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

export interface traverse<F extends HKT, FC = HKT.None> {
  <G extends HKT, GC = HKT.None>(A: Applicative<G, GC>): <KG, QG, WG, XG, IG, SG, RG, EG, A, B>(
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, B>,
  ) => <KF, QF, WF, XF, IF, SF, RF, EF>(
    ta: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
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

export function mkTraverse_<F extends HKT, FC = HKT.None>(): (
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
    G: Applicative<HKT.F<G>>,
  ) => (
    ta: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => HKT.FK1<G, B>,
  ) => HKT.FK1<G, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>>,
) => traverse_<F, FC>;
export function mkTraverse_() {
  return (i: any) => i();
}

export function mkTraverse<F extends HKT, FC = HKT.None>(): (
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
    G: Applicative<HKT.F<G>>,
  ) => (
    f: (a: A) => HKT.FK1<G, B>,
  ) => (
    ta: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.FK1<G, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>>,
) => traverse<F, FC>;
export function mkTraverse() {
  return (i: any) => i();
}

export interface sequence<F extends HKT, FC = HKT.None> {
  <G extends HKT, GC = HKT.None>(A: Applicative<G, GC>): <
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
    ta: HKT.Kind<
      F,
      FC,
      KF,
      QF,
      WF,
      XF,
      IF,
      SF,
      RF,
      EF,
      HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, A>
    >,
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
    HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>
  >;
}

export interface sequenceSelf<F extends HKT, FC = HKT.None> {
  <KF, QF, WF, XF, IF, SF, RF, EF, A>(self: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>): <
    G extends HKT,
    GC = HKT.None,
  >(
    A: CompatibleApplicative<G, GC, A>,
  ) => [A] extends [
    HKT.Kind<
      G,
      GC,
      infer KG,
      infer QG,
      infer WG,
      infer XG,
      infer IG,
      infer SG,
      infer RG,
      infer EG,
      infer B
    >,
  ]
    ? HKT.Kind<
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
      >
    : never;
}
