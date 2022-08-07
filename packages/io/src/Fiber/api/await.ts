/**
 * @tsplus getter fncts.io.Fiber await
 */
export function wait<E, A>(fiber: Fiber<E, A>, __tsplusTrace?: string): UIO<Exit<E, A>> {
  fiber.concrete();
  return fiber.await;
}
