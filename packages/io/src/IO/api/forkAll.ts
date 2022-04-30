/**
 * Returns an effect that forks all of the specified values, and returns a
 * composite fiber that produces a list of their results, in order.
 *
 * @tsplus static fncts.io.IOOps forkAll
 */
export function forkAll<R, E, A>(as: Seq<IO<R, E, A>>, __tsplusTrace?: string): URIO<R, Fiber<E, Conc<A>>> {
  return IO.foreach(as, (io) => io.fork).map(Fiber.sequenceIterable);
}
