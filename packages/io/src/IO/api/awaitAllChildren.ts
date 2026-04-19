/**
 * Awaits all child fibers before completing.
 *
 * @tsplus getter fncts.io.IO awaitAllChildren
 */
export function awaitAllChildren<R, E, A>(self: IO<R, E, A>): IO<R, E, A> {
  return self.ensuringChildren(Fiber.awaitAll);
}
