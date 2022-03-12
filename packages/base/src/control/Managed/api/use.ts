import type { IO } from "../../IO.js";
import type { Managed } from "../definition.js";

import { ExecutionStrategy } from "../../../data/ExecutionStrategy.js";
import { FiberRef } from "../../FiberRef.js";
import { ReleaseMap } from "../ReleaseMap.js";

/**
 * @tsplus fluent fncts.control.Managed use
 */
export function use_<R, E, A, R2, E2, B>(
  ma: Managed<R, E, A>,
  f: (a: A) => IO<R2, E2, B>,
): IO<R & R2, E | E2, B> {
  return ReleaseMap.make.chain((releaseMap) =>
    FiberRef.currentReleaseMap.locally(releaseMap)(
      FiberRef.currentReleaseMap.get.bracketExit(
        () => ma.io.chain(([_, a]) => f(a)),
        (releaseMap, exit) => releaseMap.releaseAll(exit, ExecutionStrategy.sequential),
      ),
    ),
  );
}
