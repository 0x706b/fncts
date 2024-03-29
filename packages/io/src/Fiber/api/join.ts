/**
 * Joins the fiber, which suspends the joining fiber until the result of the
 * fiber has been determined. Attempting to join a fiber that has erred will
 * result in a catchable error. Joining an interrupted fiber will result in an
 * "inner interruption" of this fiber, unlike interruption triggered by another
 * fiber, "inner interruption" can be caught and recovered.
 *
 * @tsplus getter fncts.io.Fiber join
 */
export function join<E, A>(fiber: Fiber<E, A>, __tsplusTrace?: string): FIO<E, A> {
  fiber.concrete();
  return fiber.await.flatMap(IO.fromExitNow).tap(() => fiber.inheritRefs);
}
