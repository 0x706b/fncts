import type { Fiber } from "../definition";

import { Cause } from "../../../data/Cause";
import { IO } from "../../IO";
import { SyntheticFiber } from "../definition";

/**
 * Zips this fiber with the specified fiber, combining their results using
 * the specified combiner function. Both joins and interruptions are performed
 * in sequential order from left to right.
 *
 * @tsplus fluent fncts.control.Fiber zipWith
 */
export function zipWith_<E, A, E1, B, C>(
  self: Fiber<E, A>,
  that: Fiber<E1, B>,
  f: (a: A, b: B) => C,
): Fiber.Synthetic<E | E1, C> {
  return {
    _tag: "SyntheticFiber",
    await: self.await.chain(IO.fromExitNow).zipWithC(that.await.chain(IO.fromExitNow), f).result,
    getRef: (ref) => self.getRef(ref).zipWith(that.getRef(ref), (a, b) => ref.join(a, b)),
    inheritRefs: self.inheritRefs.apSecond(that.inheritRefs),
    interruptAs: (id) =>
      self
        .interruptAs(id)
        .zipWith(that.interruptAs(id), (ea, eb) => ea.zipWithCause(eb, f, Cause.both)),
    poll: self.poll.zipWith(that.poll, (fa, fb) =>
      fa.zipWith(fb, (ea, eb) => ea.zipWithCause(eb, f, Cause.both)),
    ),
  };
}
