import { Effect, FailException, InterruptException, RetryException, Succeed, SucceedNow } from "../definition.js";

/**
 * Returns a value that models failure in the transaction.
 *
 * @tsplus static fncts.io.STMOps failNow
 */
export function failNow<E>(e: E, __tsplusTrace?: string): STM<never, E, never> {
  return fail(e);
}

/**
 * Returns a value that models failure in the transaction.
 *
 * @tsplus static fncts.io.STMOps fail
 */
export function fail<E>(e: Lazy<E>, __tsplusTrace?: string): STM<never, E, never> {
  return new Effect(() => {
    throw new FailException(e());
  });
}

/**
 * Returns the fiber id of the fiber committing the transaction.
 *
 * @tsplus static fncts.io.STMOps fiberId
 */
export const fiberId: STM<never, never, FiberId> = new Effect((_, fiberId) => fiberId);

/**
 * Interrupts the fiber running the effect with the specified fiber id.
 *
 * @tsplus static fncts.io.STMOps interruptAs
 */
export function interruptAs(fiberId: FiberId, __tsplusTrace?: string): STM<never, never, never> {
  return new Effect(() => {
    throw new InterruptException(fiberId);
  });
}

/**
 * @tsplus static fncts.io.STMOps retry
 */
export const retry: STM<never, never, never> = new Effect(() => {
  throw new RetryException();
});

/**
 * Returns an `STM` effect that succeeds with the specified value.
 *
 * @tsplus static fncts.io.STMOps succeed
 * @tsplus static fncts.io.STMOps __call
 */
export function succeed<A>(effect: Lazy<A>, __tsplusTrace?: string): STM<never, never, A> {
  return new Succeed(effect);
}

/**
 * Returns an `STM` effect that succeeds with the specified value.
 *
 * @tsplus static fncts.io.STMOps succeedNow
 */
export function succeedNow<A>(a: A, __tsplusTrace?: string): STM<never, never, A> {
  return new SucceedNow(a);
}
