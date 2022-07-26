import type { EvalF } from "@fncts/base/control/Eval/definition";
import type * as P from "@fncts/base/typeclass";

import { map_, zip_, zipWith_ } from "@fncts/base/control/Eval/api";
import { now } from "@fncts/base/control/Eval/constructors";

/**
 * @tsplus static fncts.control.EvalOps Functor
 * @tsplus implicit
 */
export const Functor = HKT.instance<P.Functor<EvalF>>({
  map: map_,
});

/**
 * @tsplus static fncts.control.EvalOps Apply
 * @tsplus implicit
 */
export const Apply = HKT.instance<P.Apply<EvalF>>({
  map: map_,
  zip: zip_,
  zipWith: zipWith_,
});

/**
 * @tsplus static fncts.control.EvalOps Applicative
 * @tsplus implicit
 */
export const Applicative = HKT.instance<P.Applicative<EvalF>>({
  ...Apply,
  pure: now,
});
