import type { UIO } from "../../control/IO.js";
import type { CancellerState } from "../CancellerState.js";
import type { Exit } from "../Exit.js";
import type { FiberId } from "../FiberId.js";

import { Cause } from "../Cause.js";
import { FiberStatus } from "../FiberStatus.js";

/**
 * @tsplus type fncts.data.FiberState
 */
export type FiberState<E, A> = Executing<E, A> | Done<E, A>;

/**
 * @tsplus type fncts.data.FiberStateOps
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
  readonly _tag = "Done";

  readonly interrupted                = Cause.empty<never>();
  readonly status: FiberStatus        = FiberStatus.done;
  readonly interruptors: Set<FiberId> = new Set();

  constructor(readonly value: Exit<E, A>) {}
}
