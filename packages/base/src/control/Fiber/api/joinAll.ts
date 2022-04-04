/**
 * Joins all fibers, awaiting their _successful_ completion.
 * Attempting to join a fiber that has erred will result in
 * a catchable error, _if_ that error does not result from interruption.
 *
 * @tsplus static fncts.control.FiberOps joinAll
 */
export function joinAll<E, A>(as: Iterable<Fiber<E, A>>): IO<unknown, E, Conc<A>> {
  return Fiber.awaitAll(as)
    .chain(IO.fromExitNow)
    .tap(() => IO.foreach(as, (f) => f.inheritRefs));
}
