import { AtomicReference } from "@fncts/base/internal/AtomicReference";

import { Atomic } from "./Atomic.js";

/**
 * Create a new `Ref` from a lazy initial value.
 *
 * @tsplus static fncts.io.RefOps make
 */
export function make<A>(a: Lazy<A>, __tsplusTrace?: string): UIO<Ref<A>> {
  return IO.succeed(unsafeMake(a()));
}

/**
 * Unsafely create a `Ref` from an already computed value.
 *
 * @tsplus static fncts.io.RefOps unsafeMake
 */
export function unsafeMake<A>(a: A, __tsplusTrace?: string): Ref.Atomic<A> {
  return new Atomic(new AtomicReference(a));
}
