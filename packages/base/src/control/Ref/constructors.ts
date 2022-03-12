import type { Lazy } from "../../data/function.js";
import type { UIO } from "../IO.js";
import type { PRef, Ref } from "./definition.js";

import { IO } from "../IO.js";
import { Atomic } from "./Atomic.js";

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
