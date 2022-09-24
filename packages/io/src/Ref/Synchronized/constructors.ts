import { PSynchronizedInternal } from "./definition.js";

/**
 * @tsplus static fncts.io.Ref.SynchronizedOps make
 */
export function makeSynchronized<A>(a: Lazy<A>, __tsplusTrace?: string): UIO<Ref.Synchronized<A>> {
  return Do((_) => {
    const ref       = _(Ref.make(a));
    const semaphore = _(TSemaphore.make(1).commit);
    return new PSynchronizedInternal(semaphore, ref.get, (a: A) => ref.set(a));
  });
}
