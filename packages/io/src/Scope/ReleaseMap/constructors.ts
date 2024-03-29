import type { State } from "./definition.js";

import { identity } from "@fncts/base/data/function";

import { ReleaseMap, Running } from "./definition.js";

/**
 * @tsplus static fncts.io.Scope.ReleaseMapOps unsafeMake
 */
export function unsafeMake(): ReleaseMap {
  return ReleaseMap.get(Ref.unsafeMake<State>(new Running(0, HashMap.empty(), identity)));
}

/**
 * @tsplus static fncts.io.Scope.ReleaseMapOps make
 */
export const make: UIO<ReleaseMap> = IO.succeed(ReleaseMap.unsafeMake());
