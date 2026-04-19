import type { FiberRefsPatch } from "@fncts/io/FiberRefs";

/**
 * Returns a memoized version of this effect that caches its result.
 *
 * @tsplus getter fncts.io.IO memoize
 */
export function memoize<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): UIO<IO<R, E, A>> {
  return Do((Δ) => {
    const future   = Δ(Future.make<E, readonly [FiberRefsPatch, A]>());
    const complete = Δ(self.diffFiberRefs.fulfill(future).once);
    return complete > future.await.flatMap(([patch, a]) => IO.patchFiberRefs(patch).as(a));
  });
}
