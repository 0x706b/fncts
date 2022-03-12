import { ReleaseMap } from "../Managed/ReleaseMap.js";
import { FiberRef } from "./definition.js";

/**
 * @tsplus static fncts.control.FiberRefOps currentReleaseMap
 */
export const currentReleaseMap: FiberRef<ReleaseMap> = FiberRef.unsafeMake(ReleaseMap.unsafeMake());
