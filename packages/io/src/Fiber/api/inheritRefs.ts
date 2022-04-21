/**
 * @tsplus getter fncts.io.Fiber inheritRefs
 */
export function inheritRefs<E, A>(fiber: Fiber<E, A>): UIO<void> {
  fiber.concrete();
  return fiber.inheritRefs;
}
