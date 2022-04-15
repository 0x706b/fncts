/**
 * @tsplus static fncts.InterruptStatusOps interruptible
 */
export const interruptible = new InterruptStatus(true);

/**
 * @tsplus static fncts.InterruptStatusOps uninterruptible
 */
export const uninterruptible = new InterruptStatus(false);

/**
 * @tsplus static fncts.InterruptStatusOps fromBoolean
 */
export function fromBoolean(b: boolean): InterruptStatus {
  return b ? InterruptStatus.interruptible : InterruptStatus.uninterruptible;
}
