import type { Has } from "../../../prelude.js";
import type { Fiber } from "../../Fiber.js";
import type { Scope } from "../../Scope.js";

import { IO } from "../definition.js";

/**
 * @tsplus getter fncts.control.IO forkScoped
 */
export function forkScoped<R, E, A>(
  self: IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R & Has<Scope>, never, Fiber.Runtime<E, A>> {
  return IO.uninterruptibleMask(({ restore }) =>
    restore(self).forkDaemon.tap((fiber) => IO.addFinalizer(fiber.interrupt)),
  );
}
