import type { Exit } from "../../../data/Exit.js";
import type { Lazy } from "../../../data/function.js";
import type { Has } from "../../../prelude.js";
import type { Scope } from "../../Scope.js";

import { IO } from "../definition.js";

/**
 * @tsplus static fncts.control.IOOps acquireReleaseInterruptible
 */
export function acquireReleaseInterruptible<R, E, A>(acquire: Lazy<IO<R, E, A>>) {
  return <R1>(release: IO<R1, never, any>, __tsplusTrace?: string): IO<R & R1 & Has<Scope>, E, A> =>
    IO.acquireReleaseInterruptibleExit(acquire)(() => release);
}