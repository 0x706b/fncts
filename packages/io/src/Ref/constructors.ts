import { Atomic } from "./Atomic.js";

/**
 * @tsplus static fncts.io.RefOps make
 */
export function make<A>(a: Lazy<A>, __tsplusTrace?: string): UIO<Ref<A>> {
  return IO.succeed(unsafeMake(a()));
}

/**
 * @tsplus static fncts.io.RefOps unsafeMake
 */
export function unsafeMake<A>(a: A, __tsplusTrace?: string): Ref.Atomic<A> {
  return new Atomic(a);
}
