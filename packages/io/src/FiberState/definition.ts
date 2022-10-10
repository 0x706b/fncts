import type { CancellerState } from "../CancellerState.js";

import { FiberStatus } from "../FiberStatus.js";

/**
 * @tsplus type fncts.FiberState
 */
export type FiberState<E, A> = Executing<E, A> | Done<E, A>;

/**
 * @tsplus type fncts.FiberStateOps
 */
export interface FiberStateOps {}

export const FiberState: FiberStateOps = {};

export declare namespace FiberState {
  type Callback<E, A> = (exit: Exit<E, A>) => void;
}

export type Callback<E, A> = (exit: Exit<E, A>) => void;

export class Executing<E, A> {
  readonly _tag = "Executing";

  constructor(
    public status: FiberStatus,
    public observers: Set<Callback<never, Exit<E, A>>>,
    public suppressed: Cause<never>,
    public interruptors: Set<FiberId>,
    public asyncCanceller: CancellerState,
    public mailbox: UIO<any> | null,
  ) {}
}

export class Done<E, A> {
  readonly _tag                       = "Done";
  readonly interrupted                = Cause.empty<never>();
  readonly status: FiberStatus        = FiberStatus.done;
  readonly interruptors: Set<FiberId> = new Set();

  constructor(readonly value: Exit<E, A>) {}
}
