import type { Managed } from "../definition.js";

import { ExecutionStrategy } from "../../../data/ExecutionStrategy.js";
import { FiberRef } from "../../FiberRef.js";
import { ReleaseMap } from "../ReleaseMap.js";

/**
 * @tsplus fluent fncts.control.Managed zipWithC
 */
export function zipWithC_<R, E, A, R1, E1, B, C>(
  self: Managed<R, E, A>,
  that: Managed<R1, E1, B>,
  f: (a: A, b: B) => C,
): Managed<R & R1, E | E1, C> {
  return ReleaseMap.makeManaged(ExecutionStrategy.concurrent).mapIO((parallelReleaseMap) => {
    const innerMap = FiberRef.currentReleaseMap.locally(parallelReleaseMap)(
      ReleaseMap.makeManaged(ExecutionStrategy.sequential).io,
    );
    return innerMap.zip(innerMap).chain(([[, l], [, r]]) =>
      FiberRef.currentReleaseMap
        .locally(l)(self.io)
        .zipWithC(FiberRef.currentReleaseMap.locally(r)(that.io), ([, a], [, b]) => f(a, b)),
    );
  });
}
