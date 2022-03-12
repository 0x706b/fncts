import type { Exit } from "../../../data/Exit.js";
import type { UIO } from "../../IO.js";
import type { Fiber } from "../definition.js";

import { IO } from "../../IO.js";

/**
 * Interrupts the fiber from whichever fiber is calling this method. If the
 * fiber has already exited, the returned effect will resume immediately.
 * Otherwise, the effect will resume when the fiber exits.
 *
 * @tsplus getter fncts.control.Fiber interrupt
 */
export function interrupt<E, A>(fiber: Fiber<E, A>): UIO<Exit<E, A>> {
  return IO.fiberId.chain((id) => fiber.interruptAs(id));
}
