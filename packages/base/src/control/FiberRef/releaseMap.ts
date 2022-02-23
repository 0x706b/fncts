import { ReleaseMap } from "../Managed/ReleaseMap";
import { FiberRef } from "./definition";

/**
 * @tsplus static fncts.control.FiberRefOps currentReleaseMap
 */
export const currentReleaseMap: FiberRef<ReleaseMap> = FiberRef.unsafeMake(
  ReleaseMap.unsafeMake()
);
