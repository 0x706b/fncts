import type { Exit } from "../../../data/Exit.js";

import { ExecutionStrategy } from "../../../data/ExecutionStrategy.js";
import { FiberRef } from "../../FiberRef.js";
import { IO } from "../../IO.js";
import { Managed } from "../definition.js";
import { Finalizer } from "../Finalizer.js";
import { ReleaseMap } from "../ReleaseMap.js";

/**
 * Ensures that a cleanup function runs when this ZManaged is finalized, after
 * the existing finalizers.
 *
 * @tsplus fluent fncts.control.Managed onExit
 */
export function onExit_<R, E, A, R1>(
  ma: Managed<R, E, A>,
  cleanup: (exit: Exit<E, A>) => IO<R1, never, unknown>,
): Managed<R & R1, E, A> {
  return new Managed(
    IO.uninterruptibleMask(({ restore }) =>
      IO.gen(function* (_) {
        const r1              = yield* _(IO.environment<R1>());
        const outerReleaseMap = yield* _(FiberRef.currentReleaseMap.get);
        const innerReleaseMap = yield* _(ReleaseMap.make);
        const exitEA          = yield* _(
          FiberRef.currentReleaseMap.locally(innerReleaseMap)(
            restore(ma.io.map(([_, a]) => a)).result,
          ),
        );
        const releaseMapEntry = yield* _(
          outerReleaseMap.add(
            Finalizer.get(
              (exit) =>
                innerReleaseMap
                  .releaseAll(exit, ExecutionStrategy.sequential)
                  .result.zipWith(cleanup(exitEA).provideEnvironment(r1).result, (l, r) =>
                    IO.fromExitNow(l.apSecond(r)),
                  ).flatten,
            ),
          ),
        );
        const a = yield* _(IO.fromExitNow(exitEA));
        return [releaseMapEntry, a];
      }),
    ),
  );
}
