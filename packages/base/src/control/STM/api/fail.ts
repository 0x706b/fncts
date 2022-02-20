import type { Lazy } from "../../../data/function";
import type { STM } from "../definition";

import { Effect, FailException } from "../definition";

/**
 * Returns a value that models failure in the transaction.
 *
 * @tsplus static fncts.control.STMOps failNow
 */
export function failNow<E>(e: E): STM<unknown, E, never> {
  return fail(e);
}

/**
 * Returns a value that models failure in the transaction.
 *
 * @tsplus static fncts.control.STMOps fail
 */
export function fail<E>(e: Lazy<E>): STM<unknown, E, never> {
  return new Effect(() => {
    throw new FailException(e());
  });
}
