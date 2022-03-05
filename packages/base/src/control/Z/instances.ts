import type { ZF } from "./definition";

import * as P from "../../prelude";
import { ap_, crossWith_, map_, succeedNow } from "./api";

/**
 * @tsplus static fncts.control.ZOps Applicative
 */
export const Applicative: P.Applicative<ZF> = P.Applicative({
  map_,
  ap_,
  zipWith_: crossWith_,
  pure: succeedNow,
});
