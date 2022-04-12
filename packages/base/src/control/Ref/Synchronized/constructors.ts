import { PSynchronizedInternal } from "./definition.js";

/**
 * @tsplus static fncts.control.Ref.SynchronizedOps make
 */
export function makeSynchronized<A>(a: Lazy<A>): UIO<Ref.Synchronized<A>> {
  return IO.gen(function* (_) {
    const ref       = yield* _(Ref.make(a));
    const semaphore = yield* _(TSemaphore.make(1).commit);
    return new PSynchronizedInternal(new Set([semaphore]), ref.get, (a) => ref.set(a));
  });
}
