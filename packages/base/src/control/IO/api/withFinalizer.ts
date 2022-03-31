import type { Has } from "../../../prelude.js";
import type { Scope } from "../../Scope.js";
import type { URIO } from "../definition.js";

import { IO } from "../definition.js";

/**
 * @tsplus fluent fncts.control.IO withFinalizer
 */
export function withFinalizer_<R, E, A, R1>(
  self: IO<R, E, A>,
  finalizer: (a: A) => URIO<R1, any>,
): IO<R & R1 & Has<Scope>, E, A> {
  return IO.acquireRelease(self, finalizer);
}
