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

  get isInterrupting() {
    return false;
  }

  withInterrupting(): FiberStatus {
    return this;
  }
}

/**
 * @tsplus companion fncts.data.FiberStatus.FinishingOps
 */
export class Finishing {
  readonly _tag = FiberStatusTag.Finishing;
  constructor(readonly interrupting: boolean) {}

  get isInterrupting() {
    return this.interrupting;
  }

  withInterrupting(newInterrupting: boolean): FiberStatus {
    return new Finishing(newInterrupting);
  }
}

/**
 * @tsplus companion fncts.data.FiberStatus.RunningOps
 */
export class Running {
  readonly _tag = FiberStatusTag.Running;
  constructor(readonly interrupting: boolean) {}

  get isInterrupting() {
    return this.interrupting;
  }

  withInterrupting(newInterrupting: boolean): FiberStatus {
    return new Running(newInterrupting);
  }
}

/**
 * @tsplus companion fncts.data.FiberStatus.SuspendedOps
 */
export class Suspended {
  readonly _tag = FiberStatusTag.Suspended;
  constructor(
    readonly interrupting: boolean,
    readonly interruptible: boolean,
    readonly epoch: number,
    readonly blockingOn: FiberId,
    readonly asyncTrace?: string,
  ) {}

  get isInterrupting() {
    return this.interrupting;
  }

  withInterrupting(newInterrupting: boolean) {
    return new Suspended(
      newInterrupting,
      this.interruptible,
      this.epoch,
      this.blockingOn,
      this.asyncTrace,
    );
  }
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
