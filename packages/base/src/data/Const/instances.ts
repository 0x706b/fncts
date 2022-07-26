import type * as P from "../../typeclass.js";
import type { ConstF } from "@fncts/base/data/Const/definition";

import { Const } from "@fncts/base/data/Const/definition";

/**
 * @tsplus static fncts.ConstOps getApply
 */
export function getApply<E>(S: P.Semigroup<E>) {
  return HKT.instance<P.Apply<ConstF, HKT.Fix<"E", E>>>({
    map: (fa, f) => fa.map(f),
    zip: (self, that) => Const(S.combine(self.getConst, that.getConst)),
    zipWith: (self, that, _f) => Const(S.combine(self.getConst, that.getConst)),
  });
}

/**
 * @tsplus static fncts.ConstOps getApplicative
 */
export function getApplicative<E>(M: P.Monoid<E>): P.Applicative<ConstF, HKT.Fix<"E", E>> {
  return {
    ...getApply(M),
    pure: <A>() => Const<E, A>(M.nat),
  };
}
