import type { UManaged } from "../definition.js";

import { FiberRef } from "../../FiberRef.js";
import { Future } from "../../Future.js";
import { IO } from "../../IO.js";
import { Managed } from "../definition.js";
import { ReleaseMap } from "../ReleaseMap.js";

/**
 * @tsplus getter fncts.control.Managed memoize
 */
export function memoize<R, E, A>(
  self: Managed<R, E, A>,
  __tsplusTrace?: string,
): UManaged<Managed<R, E, A>> {
  return Managed.releaseMap.mapIO((releaseMap) =>
    IO.gen(function* (_) {
      const future   = yield* _(Future.make<E, A>());
      const complete = yield* _(
        FiberRef.currentReleaseMap
          .locally(releaseMap)(self.io)
          .map(([, a]) => a)
          .fulfill(future).once,
      );
      return complete.apSecond(future.await).toManaged;
    }),
  );
}
