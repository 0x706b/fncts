import type { Lazy } from "../../../data/function.js";
import type { Has } from "../../../prelude.js";
import type { Scope } from "../../Scope.js";
import type { URIO } from "../definition.js";

import { IO } from "../definition.js";

/**
 * @tsplus static fncts.control.IOOps addFinalizer
 */
export function addFinalizer<R>(finalizer: Lazy<URIO<R, any>>, __tsplusTrace?: string): IO<R & Has<Scope>, never, void> {
  return IO.addFinalizerExit(() => finalizer());
}