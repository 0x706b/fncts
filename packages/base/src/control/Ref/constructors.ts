import type { Lazy } from "../../data/function";
import type { UIO } from "../IO";
import type { PRef, Ref } from "./definition";

import { IO } from "../IO";
import { Atomic } from "./Atomic";

/**
 * @tsplus static fncts.control.RefOps make
 */
export function make<A>(a: Lazy<A>): UIO<Ref<A>> {
  return IO.succeed(unsafeMake(a()));
}

/**
 * @tsplus static fncts.control.RefOps unsafeMake
 */
export function unsafeMake<A>(a: A): Ref.Atomic<A> {
  return new Atomic(a);
}
