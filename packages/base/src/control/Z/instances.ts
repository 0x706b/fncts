import type * as P from "../../typeclass.js";
import type { ZF } from "./definition.js";

import { map_, succeedNow, zip_, zipWith_ } from "./api.js";

/**
 * @tsplus static fncts.control.ZOps Applicative
 * @tsplus implicit
 */
export const Applicative = HKT.instance<P.Applicative<ZF>>({
  map: map_,
  zip: zip_,
  zipWith: zipWith_,
  pure: succeedNow,
});
