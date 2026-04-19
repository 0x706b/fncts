import type * as P from "../../typeclass.js";
import type { PureF } from "./definition.js";

import { map, succeedNow, zip, zipWith } from "./api.js";
/**
 * Applicative instance for `Pure` computations.
 *
 * @tsplus static fncts.control.PureOps Applicative
 *
 * @tsplus implicit
 */
export const Applicative = HKT.instance<P.Applicative<PureF>>({
  map,
  zip,
  zipWith,
  pure: succeedNow,
});
