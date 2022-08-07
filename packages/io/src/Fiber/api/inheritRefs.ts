/**
 * @tsplus getter fncts.io.Fiber inheritRefs
 */
export function inheritRefs<E, A>(fiber: Fiber<E, A>, __tsplusTrace?: string): UIO<void> {
  fiber.concrete();
  return fiber.inheritRefs;
}
