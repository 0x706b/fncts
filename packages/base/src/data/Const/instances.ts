import type * as P from "../../typeclass.js";
import type { Const1F } from "@fncts/base/data/Const/definition";

import { Const } from "@fncts/base/data/Const/definition";

/**
 * @tsplus static fncts.ConstOps getApply
 */
export function getApply<E>(S: P.Semigroup<E>): P.Apply<Const1F<E>> {
  return {
    map: (fa, f) => fa.map(f),
    zip: (self, that) => Const(S.combine(self.getConst, that.getConst)),
    zipWith: (self, that, _f) => Const(S.combine(self.getConst, that.getConst)),
  };
}

/**
 * @tsplus static fncts.ConstOps getApplicative
 */
export function getApplicative<E>(M: P.Monoid<E>): P.Applicative<Const1F<E>> {
  return {
    ...getApply(M),
    pure: <A>() => Const<E, A>(M.nat),
  };
}
