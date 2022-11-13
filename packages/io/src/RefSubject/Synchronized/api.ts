import { concrete, RefSubject } from "@fncts/io/RefSubject";
import { SynchronizedRefSubjectInternal } from "@fncts/io/RefSubject/Synchronized/definition";

/**
 * @tsplus static fncts.io.Push.RefSubject.SynchronizedOps make
 * @tsplus static fncts.io.Push.RefSubject.SynchronizedOps __call
 */
export function make<A>(initial: Lazy<A>): UIO<RefSubject.Synchronized<never, never, A, A>> {
  return Do((Δ) => {
    const ref       = Δ(RefSubject.make(initial));
    const semaphore = Δ(TSemaphore(1).commit);
    return new SynchronizedRefSubjectInternal(semaphore, (concrete(ref), ref));
  });
}
