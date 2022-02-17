/**
 * InterruptStatus tracks interruptability of the current stack region
 *
 * @tsplus type fncts.data.InterruptStatus
 * @tsplus companion fncts.data.InterruptStatusOps
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
