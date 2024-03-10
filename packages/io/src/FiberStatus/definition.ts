import type { RuntimeFlags } from "../RuntimeFlags.js";

export const enum FiberStatusTag {
  Done,
  Running,
  Suspended,
}

/**
 * @tsplus companion fncts.FiberStatus.DoneOps
 */
export class Done {
  readonly _tag       = FiberStatusTag.Done;
  readonly trace      = Trace.none;
  readonly isFinished = true;
}

/**
 * @tsplus companion fncts.FiberStatus.RunningOps
 */
export class Running {
  readonly _tag = FiberStatusTag.Running;
  constructor(
    readonly runtimeFlags: RuntimeFlags,
    readonly trace?: string,
  ) {}
  readonly isFinished = false;
}

/**
 * @tsplus companion fncts.FiberStatus.SuspendedOps
 */
export class Suspended {
  readonly _tag = FiberStatusTag.Suspended;
  constructor(
    readonly runtimeFlags: RuntimeFlags,
    readonly blockingOn: FiberId,
    readonly trace?: string,
  ) {}
  readonly isFinished = false;
}

/**
 * @tsplus type fncts.FiberStatus
 */
export type FiberStatus = Done | Running | Suspended;

/**
 * @tsplus type fncts.FiberStatusOps
 */
export interface FiberStatusOps {}

export const FiberStatus: FiberStatusOps = {};
