import type { Lazy } from "../../../data/function.js";
import type { Has } from "../../../prelude.js";
import type { Scope } from "../../Scope.js";
import type { IO, URIO } from "../definition.js";

/**
 * @tsplus fluent fncts.control.IO withFinalizer
 */
export function withFinalizer_<R, E, A, R1>(self: IO<R, E, A>, finalizer: Lazy<URIO<R1, any>>): IO<R & R1 & Has<Scope>, E, A> {
  return self.withFinalizerExit(() => finalizer());
}