import type { UIO } from "../../IO";
import type { Fiber } from "../definition";

/**
 * Interrupts the fiber from whichever fiber is calling this method. The
 * interruption will happen in a separate daemon fiber, and the returned
 * effect will always resume immediately without waiting.
 *
 * @tsplus getter fncts.control.Fiber interruptFork
 */
export function interruptFork<E, A>(fiber: Fiber<E, A>): UIO<void> {
  return fiber.interrupt.forkDaemon.asUnit;
}
