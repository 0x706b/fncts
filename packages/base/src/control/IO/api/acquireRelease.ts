import type { Lazy } from "../../../data/function.js";
import type { Has } from "../../../prelude.js";
import type { Scope } from "../../Scope.js";

import { IO } from "../definition.js";

/**
 * @tsplus static fncts.control.IOOps acquireRelease
 */
export function acquireRelease<R, E, A, R1>(
  acquire: Lazy<IO<R, E, A>>,
  release: (a: A) => IO<R1, never, any>,
): IO<R & R1 & Has<Scope>, E, A> {
  return IO.acquireReleaseExit(acquire, (a, _) => release(a));
}
