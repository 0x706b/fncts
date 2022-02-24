import type { UIO } from "../../IO";
import type { State } from "./definition";

import { HashMap } from "../../../collection/immutable/HashMap";
import { identity } from "../../../data/function";
import { IO } from "../../IO";
import { Ref } from "../../Ref";
import { ReleaseMap, Running } from "./definition";

/**
 * @tsplus static fncts.control.Managed.ReleaseMapOps unsafeMake
 */
export function unsafeMake(): ReleaseMap {
  return ReleaseMap.get(Ref.unsafeMake<State>(new Running(0, HashMap.makeDefault(), identity)));
}

/**
 * @tsplus static fncts.control.Managed.ReleaseMapOps make
 */
export const make: UIO<ReleaseMap> = IO.succeed(ReleaseMap.unsafeMake());
