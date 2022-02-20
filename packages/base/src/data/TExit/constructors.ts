import type { FiberId } from "../FiberId";
import type { TExit } from "./definition";

import { Fail, Halt, Interrupt, Retry, Succeed } from "./definition";

/**
 * @tsplus static fncts.data.TExitOps unit
 */
export const unit: TExit<never, void> = new Succeed(undefined);

/**
 * @tsplus static fncts.data.TExitOps succeed
 */
export function succeed<E = never, A = never>(a: A): TExit<E, A> {
  return new Succeed(a);
}

/**
 * @tsplus static fncts.data.TExitOps fail
 */
export function fail<E = never, A = never>(e: E): TExit<E, A> {
  return new Fail(e);
}

/**
 * @tsplus static fncts.data.TExitOps halt
 */
export function halt(e: unknown): TExit<never, never> {
  return new Halt(e);
}

/**
 * @tsplus static fncts.data.TExitOps retry
 */
export const retry: TExit<never, never> = new Retry();

/**
 * @tsplus static fncts.data.TExitOps interrupt
 */
export function interrupt(fiberId: FiberId): TExit<never, never> {
  return new Interrupt(fiberId);
}
