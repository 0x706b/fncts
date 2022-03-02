import type { RuntimeFiber } from "../../Fiber";

import { ExecutionStrategy } from "../../../data/ExecutionStrategy";
import { tuple } from "../../../data/function";
import { FiberRef } from "../../FiberRef";
import { IO } from "../../IO";
import { Managed } from "../definition";
import { Finalizer } from "../Finalizer";
import { ReleaseMap } from "../ReleaseMap";

/**
 * Creates a `Managed` value that acquires the original resource in a fiber,
 * and provides that fiber. The finalizer for this value will interrupt the fiber
 * and run the original finalizer.
 *
 * @tsplus getter fncts.control.Managed fork
 */
export function fork<R, E, A>(self: Managed<R, E, A>, __tsplusTrace?: string): Managed<R, never, RuntimeFiber<E, A>> {
  return new Managed(
    IO.uninterruptibleMask(({ restore }) =>
      IO.gen(function* (_) {
        const outerReleaseMap = yield* _(FiberRef.currentReleaseMap.get);
        const innerReleaseMap = yield* _(ReleaseMap.make);
        const fiber           = yield* _(FiberRef.currentReleaseMap.locally(innerReleaseMap)(restore(self.io.map(([_, a]) => a).forkDaemon)));
        const releaseMapEntry = yield* _(
          outerReleaseMap.add(Finalizer.get((e) => fiber.interrupt.apSecond(innerReleaseMap.releaseAll(e, ExecutionStrategy.sequential)))),
        );
        return tuple(releaseMapEntry, fiber);
      }),
    ),
  );
}
