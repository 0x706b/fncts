import type { Callback, FiberState } from "./definition.js";

import { CancellerState } from "../CancellerState.js";
import { FiberStatus } from "../FiberStatus.js";
import { Done, Executing } from "./definition.js";

/**
 * @tsplus static fncts.data.FiberStateOps initial
 */
export function initial<E, A>(): FiberState<E, A> {
  return new Executing(
    FiberStatus.running(false),
    new Set(),
    Cause.empty(),
    new Set(),
    CancellerState.empty,
    null,
  );
}

/**
 * @tsplus static fncts.data.FiberStateOps done
 */
export function done<E, A>(value: Exit<E, A>): FiberState<E, A> {
  return new Done(value);
}

/**
 * @tsplus static fncts.data.FiberStateOps executing
 */
export function executing<E, A>(
  status: FiberStatus,
  observers: Set<Callback<never, Exit<E, A>>>,
  suppressed: Cause<never>,
  interruptors: Set<FiberId>,
  asyncCanceller: CancellerState,
  mailbox: UIO<any> | null,
): FiberState<E, A> {
  return new Executing(status, observers, suppressed, interruptors, asyncCanceller, mailbox);
}
