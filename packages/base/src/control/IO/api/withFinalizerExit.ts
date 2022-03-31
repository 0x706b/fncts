import type { Exit } from "../../../data/Exit.js";
import type { Has } from "../../../prelude.js";
import type { Scope } from "../../Scope.js";
import type { URIO } from "../definition.js";

import { IO } from "../definition.js";

/**
 * @tsplus fluent fncts.control.IO withFinalizerExit
 */
export function withFinalizerExit_<R, E, A, R1>(
  self: IO<R, E, A>,
  finalizer: (a: A, exit: Exit<any, any>) => URIO<R1, any>,
): IO<R & R1 & Has<Scope>, E, A> {
  return IO.acquireReleaseExit(self, finalizer);
}
