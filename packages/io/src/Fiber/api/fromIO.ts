/**
 * Lifts an `IO` into a `Fiber`.
 *
 * @tsplus static fncts.io.FiberOps fromIO
 */
export function fromIO<E, A>(effect: FIO<E, A>, __tsplusTrace?: string): UIO<Fiber<E, A>> {
  return effect.result.map((exit) => Fiber.done(exit));
}
