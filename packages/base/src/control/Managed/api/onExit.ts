import type { Exit } from "../../../data/Exit";

import { ExecutionStrategy } from "../../../data/ExecutionStrategy";
import { FiberRef } from "../../FiberRef";
import { IO } from "../../IO";
import { Managed } from "../definition";
import { Finalizer } from "../Finalizer";
import { ReleaseMap } from "../ReleaseMap";

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
        const r1              = yield* _(IO.ask<R1>());
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
                  .result.zipWith(cleanup(exitEA).give(r1).result, (l, r) =>
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
