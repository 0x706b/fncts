import type { ExecutionStrategy } from "../../../../data/ExecutionStrategy.js";

import { Managed } from "../../definition.js";
import { ReleaseMap } from "../definition.js";

/**
 * @tsplus static fncts.control.Managed.ReleaseMapOps makeManaged
 */
export function makeManaged(strategy: ExecutionStrategy): Managed<unknown, never, ReleaseMap> {
  return Managed.bracketExit(ReleaseMap.make, (rm, exit) => rm.releaseAll(exit, strategy));
}
