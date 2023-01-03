import { PSynchronizedInternal } from "./definition.js";

/**
 * @tsplus static fncts.io.Ref.SynchronizedOps unsafeMake
 */
export function unsafeMakeSynchronized<A>(a: A, __tsplusTrace?: string): Ref.Synchronized<A> {
  const ref       = Ref.unsafeMake(a);
  const semaphore = Semaphore.unsafeMake(1);
  return new PSynchronizedInternal(semaphore, ref.get, (a: A) => ref.set(a));
}

/**
 * @tsplus static fncts.io.Ref.SynchronizedOps make
 */
export function makeSynchronized<A>(a: Lazy<A>, __tsplusTrace?: string): UIO<Ref.Synchronized<A>> {
  return Do((_) => {
    const ref       = _(Ref.make(a));
    const semaphore = _(Semaphore(1));
    return new PSynchronizedInternal(semaphore, ref.get, (a: A) => ref.set(a));
  });
}
