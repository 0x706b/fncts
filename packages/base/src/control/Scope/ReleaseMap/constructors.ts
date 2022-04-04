import type { State } from "./definition.js";

import { identity } from "../../../data/function.js";
import { ReleaseMap, Running } from "./definition.js";

/**
 * @tsplus static fncts.control.Scope.ReleaseMapOps unsafeMake
 */
export function unsafeMake(): ReleaseMap {
  return ReleaseMap.get(Ref.unsafeMake<State>(new Running(0, HashMap.makeDefault(), identity)));
}

/**
 * @tsplus static fncts.control.Scope.ReleaseMapOps make
 */
export const make: UIO<ReleaseMap> = IO.succeed(ReleaseMap.unsafeMake());
