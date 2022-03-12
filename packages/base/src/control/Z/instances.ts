import type { ZF } from "./definition.js";

import * as P from "../../prelude.js";
import { ap_, crossWith_, map_, succeedNow } from "./api.js";

/**
 * @tsplus static fncts.control.ZOps Applicative
 */
export const Applicative: P.Applicative<ZF> = P.Applicative({
  map_,
  ap_,
  zipWith_: crossWith_,
  pure: succeedNow,
});
