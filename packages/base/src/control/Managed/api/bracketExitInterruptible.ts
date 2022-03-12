import { IO } from "../../IO.js";
import { Managed } from "../definition.js";

/**
 * Lifts a `IO<R, E, A>` into `Managed<R, E, A>` with a release action.
 * The acquire action will be performed interruptibly, while release
 * will be performed uninterruptibly.
 *
 * @trace call
 * @trace 1
 */
export function bracketExitInterruptible_<R, E, A, R1>(
  acquire: IO<R, E, A>,
  release: (a: A) => IO<R1, never, unknown>,
  __tsplusTrace?: string,
): Managed<R & R1, E, A> {
  return Managed.fromIO(acquire).onExitFirst((exit) => exit.match(() => IO.unit, release));
}
