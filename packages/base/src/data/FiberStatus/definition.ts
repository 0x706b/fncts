import type { FiberId } from "../FiberId";

export const enum FiberStatusTag {
  Done = "Done",
  Finishing = "Finishing",
  Running = "Running",
  Suspended = "Suspended",
}

/**
 * @tsplus companion fncts.data.FiberStatus.DoneOps
 */
export class Done {
  readonly _tag = FiberStatusTag.Done;
}

/**
 * @tsplus companion fncts.data.FiberStatus.FinishingOps
 */
export class Finishing {
  readonly _tag = FiberStatusTag.Finishing;
  constructor(readonly interrupting: boolean) {}
}

/**
 * @tsplus companion fncts.data.FiberStatus.RunningOps
 */
export class Running {
  readonly _tag = FiberStatusTag.Running;
  constructor(readonly interrupting: boolean) {}
}

/**
 * @tsplus companion fncts.data.FiberStatus.SuspendedOps
 */
export class Suspended {
  readonly _tag = FiberStatusTag.Suspended;
  constructor(
    readonly previous: FiberStatus,
    readonly interruptible: boolean,
    readonly epoch: number,
    readonly blockingOn: FiberId,
    readonly asyncTrace?: string
  ) {}
}

/**
 * @tsplus type fncts.data.FiberStatus
 */
export type FiberStatus = Done | Finishing | Running | Suspended;

/**
 * @tsplus type fncts.data.FiberStatusOps
 */
export interface FiberStatusOps {}

export const FiberStatus: FiberStatusOps = {};
