import { SynchronizedInternal } from "@fncts/io/Ref/Synchronized";

import { Atomic } from "./Atomic.js";

/**
 * @tsplus static fncts.io.RefOps make
 * @tsplus static fncts.io.RefOps __call
 */
export function make<A>(a: Lazy<A>, __tsplusTrace?: string): UIO<Ref<A>> {
  return IO.succeed(unsafeMake(a()));
}

/**
 * @tsplus static fncts.io.Ref.SynchronizedOps make
 * @tsplus static fncts.io.Ref.SynchronizedOps __call
 */
export function makeSynchronized<A>(a: Lazy<A>, __tsplusTrace?: string): UIO<Ref.Synchronized<A>> {
  return Do((_) => {
    const ref       = _(Ref.make(a));
    const semaphore = _(TSemaphore.make(1).commit);
    return new SynchronizedInternal(semaphore, ref.get, (a: A) => ref.set(a));
  });
}

/**
 * @tsplus static fncts.io.RefOps unsafeMake
 */
export function unsafeMake<A>(a: A, __tsplusTrace?: string): Ref.Atomic<A> {
  return new Atomic(a);
}
