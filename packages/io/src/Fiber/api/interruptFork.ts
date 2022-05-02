/**
 * Interrupts the fiber from whichever fiber is calling this method. The
 * interruption will happen in a separate daemon fiber, and the returned
 * effect will always resume immediately without waiting.
 *
 * @tsplus getter fncts.io.Fiber interruptFork
 */
export function interruptFork<E, A>(fiber: Fiber<E, A>, __tsplusTrace?: string): UIO<void> {
  return fiber.interrupt.forkDaemon.asUnit;
}
