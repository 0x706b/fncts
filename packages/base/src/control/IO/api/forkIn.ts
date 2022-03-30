import type { RuntimeFiber } from "../../Fiber.js";
import type { Scope } from "../../Scope.js";
import type { URIO } from "../definition.js";

import { IO } from "../definition.js";

/**
 * Forks the workflow in the specified scope. The fiber will be interrupted
 * when the scope is closed.
 *
 * @tsplus fluent fncts.control.IO forkIn
 */
export function forkIn_<R, E, A>(
  self: IO<R, E, A>,
  scope: Scope,
  __tsplusTrace?: string,
): URIO<R, RuntimeFiber<E, A>> {
  return IO.uninterruptibleMask(({ restore }) =>
    restore(self).forkDaemon.tap((fiber) => scope.addFinalizer(fiber.interrupt)),
  );
}
