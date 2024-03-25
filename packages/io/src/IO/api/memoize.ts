import type { FiberRefsPatch } from "@fncts/io/FiberRefs";

/**
 * @tsplus getter fncts.io.IO memoize
 */
export function memoize<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): UIO<IO<R, E, A>> {
  return Do((_) => {
    const future   = _(Future.make<E, readonly [FiberRefsPatch, A]>());
    const complete = _(self.diffFiberRefs.fulfill(future).once);
    return complete > future.await.flatMap(([patch, a]) => IO.patchFiberRefs(patch).as(a));
  });
}
