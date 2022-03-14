import type { Conc } from "../../../collection/immutable/Conc.js";
import type { Managed } from "../definition.js";

import { ExecutionStrategy } from "../../../data/ExecutionStrategy.js";
import { FiberRef } from "../../FiberRef.js";
import { IO } from "../../IO.js";
import { ReleaseMap } from "../ReleaseMap.js";

/**
 * @tsplus static fncts.control.ManagedOps foreachC
 */
export function foreachC_<R, E, A, B>(
  as: Iterable<A>,
  f: (a: A) => Managed<R, E, B>,
): Managed<R, E, Conc<B>> {
  return ReleaseMap.makeManagedC.mapIO((parallelReleaseMap) => {
    const makeInnerMap = FiberRef.currentReleaseMap.locally(parallelReleaseMap)(
      ReleaseMap.makeManaged(ExecutionStrategy.sequential).io.map(([, r]) => r),
    );
    return IO.foreachC(as, (a) =>
      makeInnerMap.chain((innerMap) =>
        FiberRef.currentReleaseMap.locally(innerMap)(f(a).io.map(([_, a]) => a)),
      ),
    );
  });
}

/**
 * @tsplus static fncts.control.ManagedOps foreachDiscardC
 */
export function foreachDiscardC_<R, E, A, B>(
  as: Iterable<A>,
  f: (a: A) => Managed<R, E, B>,
): Managed<R, E, void> {
  return ReleaseMap.makeManagedC.mapIO((parallelReleaseMap) => {
    const makeInnerMap = FiberRef.currentReleaseMap.locally(parallelReleaseMap)(
      ReleaseMap.makeManaged(ExecutionStrategy.sequential).io.map(([, r]) => r),
    );
    return IO.foreachDiscardC(as, (a) =>
      makeInnerMap.chain((innerMap) =>
        FiberRef.currentReleaseMap.locally(innerMap)(f(a).io.map(([_, a]) => a)),
      ),
    );
  });
}
