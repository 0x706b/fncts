import { InterruptStatus } from "./definition.js";

/**
 * @tsplus static fncts.data.InterruptStatusOps interruptible
 */
export const interruptible = new InterruptStatus(true);

/**
 * @tsplus static fncts.data.InterruptStatusOps uninterruptible
 */
export const uninterruptible = new InterruptStatus(false);

/**
 * @tsplus static fncts.data.InterruptStatusOps fromBoolean
 */
export function fromBoolean(b: boolean): InterruptStatus {
  return b ? InterruptStatus.interruptible : InterruptStatus.uninterruptible;
}
