/**
 * Passes the success of this fiber to the specified callback, and continues
 * with the fiber that it returns.
 *
 * @tsplus pipeable fncts.io.Fiber mapFiber
 */
export function mapFiber<A, E1, A1>(f: (a: A) => Fiber<E1, A1>, __tsplusTrace?: string) {
  return <E>(fiber: Fiber<E, A>): UIO<Fiber<E | E1, A1>> => {
    return fiber.await.map((exit) => exit.match(Fiber.failCause, f));
  };
}
