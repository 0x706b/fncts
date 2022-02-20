import type { Lazy } from "../../../data/function";
import type { STM } from "../definition";

import { Succeed, SucceedNow } from "../definition";

/**
 * Returns an `STM` effect that succeeds with the specified value.
 *
 * @tsplus static fncts.control.STMOps succeed
 * @tsplus static fncts.control.STMOps __call
 */
export function succeed<A>(effect: Lazy<A>): STM<unknown, never, A> {
  return new Succeed(effect);
}

/**
 * Returns an `STM` effect that succeeds with the specified value.
 *
 * @tsplus static fncts.control.STMOps succeedNow
 */
export function succeedNow<A>(a: A): STM<unknown, never, A> {
  return new SucceedNow(a);
}
