/**
 * InterruptStatus tracks interruptability of the current stack region
 *
 * @tsplus type fncts.InterruptStatus
 * @tsplus companion fncts.InterruptStatusOps
 */
export class InterruptStatus {
  constructor(readonly isInterruptible: boolean) {}

  get isUninteruptible(): boolean {
    return !this.isInterruptible;
  }

  get toBoolean(): boolean {
    return this.isInterruptible;
  }
}
