import * as P from "../../prelude.js";
import { map_ } from "./api.js";
import { Const } from "./definition.js";

export interface ConstF extends P.HKT {
  readonly type: Const<this["E"], this["A"]>;
  readonly variance: {
    E: "_";
    A: "_";
  };
}

/**
 * @tsplus static fncts.data.ConstOps getApply
 */
export function getApply<E>(S: P.Semigroup<E>): P.Apply<ConstF, P.HKT.Fix<"E", E>> {
  type CE = P.HKT.Fix<"E", E>;
  const ap_: P.ap_<ConstF, CE>           = (fab, fa) => Const(S.combine_(fab, fa));
  const zipWith_: P.zipWith_<ConstF, CE> = (fa, fb, _f) => Const(S.combine_(fa, fb));
  return P.Apply({
    map_,
    ap_,
    zipWith_,
  });
}

/**
 * @tsplus static fncts.data.ConstOps getApplicative
 */
export function getApplicative<E>(M: P.Monoid<E>): P.Applicative<ConstF, P.HKT.Fix<"E", E>> {
  return P.Applicative({
    ...getApply(M),
    pure: <A>() => Const<E, A>(M.nat),
  });
}
