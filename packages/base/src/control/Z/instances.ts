import type * as P from "../../typeclass.js";
import type { ZF } from "./definition.js";

import { map, succeedNow, zip, zipWith } from "./api.js";
/**
 * @tsplus static fncts.control.ZOps Applicative
 * @tsplus implicit
 */
export const Applicative = HKT.instance<P.Applicative<ZF>>({
  map,
  zip,
  zipWith,
  pure: succeedNow,
});
