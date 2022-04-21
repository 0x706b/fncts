/**
 * Interrupts the fiber from whichever fiber is calling this method. If the
 * fiber has already exited, the returned effect will resume immediately.
 * Otherwise, the effect will resume when the fiber exits.
 *
 * @tsplus getter fncts.io.Fiber interrupt
 */
export function interrupt<E, A>(fiber: Fiber<E, A>): UIO<Exit<E, A>> {
  fiber.concrete()
  return IO.fiberId.flatMap((id) => fiber.interruptAs(id));
}
