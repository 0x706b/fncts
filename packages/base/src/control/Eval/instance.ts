import type { EvalF } from "@fncts/base/control/Eval/definition";

import { ap_, map_, zipWith_ } from "@fncts/base/control/Eval/api";
import { now } from "@fncts/base/control/Eval/constructors";
import * as P from "@fncts/base/typeclass";

/**
 * @tsplus static fncts.control.EvalOps Functor
 */
export const Functor: P.Functor<EvalF> = P.Functor({
  map_,
});

/**
 * @tsplus static fncts.control.EvalOps Apply
 */
export const Apply: P.Apply<EvalF> = P.Apply({
  map_,
  ap_,
  zipWith_,
});

/**
 * @tsplus static fncts.control.EvalOps Applicative
 */
export const Applicative: P.Applicative<EvalF> = P.Applicative({
  map_,
  ap_,
  zipWith_,
  pure: now,
});
