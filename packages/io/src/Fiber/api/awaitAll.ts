/**
 * Awaits on all fibers to be completed, successfully or not.
 *
 * @tsplus static fncts.io.FiberOps awaitAll
 */
export function awaitAll<E, A>(as: Iterable<Fiber<E, A>>, __tsplusTrace?: string): IO<never, never, Exit<E, Conc<A>>> {
  return IO.foreachC(as, (f) => f.await.flatMap(IO.fromExitNow)).result;
}
