import type { EvalF } from "./definition.js";

import * as P from "../../prelude.js";
import { ap_, map_, zipWith_ } from "./api.js";
import { now } from "./constructors.js";

/**
 * @tsplus static fncts.EvalOps Functor
 */
export const Functor: P.Functor<EvalF> = P.Functor({
  map_,
});

/**
 * @tsplus static fncts.EvalOps Apply
 */
export const Apply: P.Apply<EvalF> = P.Apply({
  map_,
  ap_,
  zipWith_,
});

/**
 * @tsplus static fncts.EvalOps Applicative
 */
export const Applicative: P.Applicative<EvalF> = P.Applicative({
  map_,
  ap_,
  zipWith_,
  pure: now,
});
