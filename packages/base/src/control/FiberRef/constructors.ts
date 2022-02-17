import type { UIO } from "../IO";
import type { FiberRef } from "./definition";

import { identity } from "../../data/function";
import { IO } from "../IO";
import { RuntimeFiberRef } from "./definition";

/**
 * @tsplus static fncts.control.FiberRefOps unsafeMake
 */
export function unsafeMake<A>(
  initial: A,
  fork: (a: A) => A = identity,
  join: (a0: A, a1: A) => A = (_, a) => a
): FiberRef.Runtime<A> {
  return new RuntimeFiberRef(initial, fork, join);
}

/**
 * @tsplus static fncts.control.FiberRefOps make
 */
export function make<A>(
  initial: A,
  fork: (a: A) => A = identity,
  join: (a: A, a1: A) => A = (_, a) => a
): UIO<FiberRef.Runtime<A>> {
  return IO.defer(() => {
    const ref = unsafeMake(initial, fork, join);
    return ref.update(identity).as(ref);
  });
}
