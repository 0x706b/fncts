import type { FiberStatus } from "./definition.js";

import { Done, Finishing, Running, Suspended } from "./definition.js";

/**
 * @tsplus static fncts.data.FiberStatusOps done
 */
export const done: FiberStatus = new Done();

/**
 * @tsplus static fncts.data.FiberStatusOps finishing
 */
export function finishing(interrupting: boolean): FiberStatus {
  return new Finishing(interrupting);
}

/**
 * @tsplus static fncts.data.FiberStatusOps running
 */
export function running(interrupting: boolean): FiberStatus {
  return new Running(interrupting);
}

/**
 * @tsplus static fncts.data.FiberStatusOps suspended
 */
export function suspended(
  interrupting: boolean,
  interruptible: boolean,
  epoch: number,
  blockingOn: FiberId,
  asyncTrace?: string,
): FiberStatus {
  return new Suspended(interrupting, interruptible, epoch, blockingOn, asyncTrace);
}
