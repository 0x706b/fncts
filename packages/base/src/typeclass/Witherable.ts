import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { Filterable } from "@fncts/base/typeclass/Filterable";
import type { Traversable } from "@fncts/base/typeclass/Traversable";

import { pipe } from "@fncts/base/data/function";
/**
 * @tsplus type fncts.Witherable
 */
export interface Witherable<F extends HKT, FC = HKT.None> extends Filterable<F, FC>, Traversable<F, FC> {
  wither: <G extends HKT, GC = HKT.None>(
    G: Applicative<G, GC>,
  ) => <A, KG, QG, WG, XG, IG, SG, RG, EG, B>(
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  ) => <KF, QF, WF, XF, IF, SF, RF, EF>(
    wa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, A>,
  ) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, B>>;

  wilt: <G extends HKT, GC = HKT.None>(
    G: Applicative<G, GC>,
  ) => <A, KG, QG, WG, XG, IG, SG, RG, EG, B, B1>(
    f: (a: A) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B1>>,
  ) => <KF, QF, WF, XF, IF, SF, RF, EF>(
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
): <G extends HKT, GC = HKT.None>(
  G: Applicative<G, GC>,
) => <AF, KG, QG, WG, XG, IG, SG, RG, EG>(
  p: (a: AF) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, boolean>,
) => <KF, QF, WF, XF, IF, SF, RF, EF>(
  fa: HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, AF>,
) => HKT.Kind<G, GC, KG, QG, WG, XG, IG, SG, RG, EG, HKT.Kind<F, FC, KF, QF, WF, XF, IF, SF, RF, EF, AF>> {
  return (G) => (p) =>
    F.wither(G)((a) =>
      pipe(
        p(a),
        G.map((bb) => (bb ? Just(a) : Nothing())),
      ),
    );
}
