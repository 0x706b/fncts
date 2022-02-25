import type { FiberId } from "../../../data/FiberId";
import type { Lazy } from "../../../data/function";
import type { FIO } from "../definition";

import { Cause } from "../../../data/Cause";
import { InterruptStatus } from "../../../data/InterruptStatus";
import { IO, SetInterrupt } from "../definition";

/**
 * Returns an effect that is interrupted as if by the specified fiber.
 *
 * @tsplus static fncts.control.IOOps interruptAs
 */
export function interruptAs(fiberId: FiberId, __tsplusTrace?: string): FIO<never, never> {
  return IO.failCauseNow(Cause.interrupt(fiberId));
}

/**
 * Returns an effect that is interrupted as if by the fiber calling this
 * method.
 *
 * @tsplus static fncts.control.IOOps interrupt
 */
export const interrupt: IO<unknown, never, never> = IO.fiberId.chain(IO.interruptAs);

/**
 * Switches the interrupt status for this effect. If `true` is used, then the
 * effect becomes interruptible (the default), while if `false` is used, then
 * the effect becomes uninterruptible. These changes are compositional, so
 * they only affect regions of the effect.
 *
 * @tsplus fluent fncts.control.IO setInterruptStatus
 */
export function setInterruptStatus_<R, E, A>(self: IO<R, E, A>, flag: InterruptStatus, __tsplusTrace?: string): IO<R, E, A> {
  return new SetInterrupt(self, flag, __tsplusTrace);
}

/**
 * Returns a new effect that performs the same operations as this effect, but
 * interruptibly, even if composed inside of an uninterruptible region.
 *
 * Note that effects are interruptible by default, so this function only has
 * meaning if used within an uninterruptible region.
 *
 * WARNING: This operator "punches holes" into effects, allowing them to be
 * interrupted in unexpected places. Do not use this operator unless you know
 * exactly what you are doing. Instead, you should use `uninterruptibleMask`.
 *
 * @tsplus getter fncts.control.IO interruptible
 */
export function interruptible<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return self.setInterruptStatus(InterruptStatus.interruptible);
}

/**
 * Performs this effect uninterruptibly. This will prevent the effect from
 * being terminated externally, but the effect may fail for internal reasons
 * (e.g. an uncaught error) or terminate due to defect.
 *
 * Uninterruptible effects may recover from all failure causes (including
 * interruption of an inner effect that has been made interruptible).
 *
 * @tsplus getter fncts.control.IO uninterruptible
 */
export function uninterruptible<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return self.setInterruptStatus(InterruptStatus.uninterruptible);
}

/**
 * Makes the effect uninterruptible, but passes it a restore function that
 * can be used to restore the inherited interruptibility from whatever region
 * the effect is composed into.
 *
 * @tsplus static fncts.control.IOOps uninterruptibleMask
 */
export function uninterruptibleMask<R, E, A>(f: (restore: InterruptStatusRestore) => IO<R, E, A>): IO<R, E, A> {
  return IO.checkInterruptible((flag) => f(new InterruptStatusRestore(flag)).uninterruptible);
}

/**
 * Calls the specified function, and runs the effect it returns, if this
 * effect is interrupted.
 *
 * @tsplus fluent fncts.control.IO onInterrupt
 */
export function onInterrupt_<R, E, A, R1>(
  ma: IO<R, E, A>,
  cleanup: (interruptors: ReadonlySet<FiberId>) => IO<R1, never, any>,
): IO<R & R1, E, A> {
  return uninterruptibleMask(({ restore }) =>
    restore(ma).matchCauseIO((cause) => (cause.interrupted ? cleanup(cause.interruptors) : IO.failCauseNow(cause)), IO.succeedNow),
  );
}

/**
 * Calls the specified function, and runs the effect it returns, if this
 * effect is interrupted (allows for expanding error).
 *
 * @tsplus fluent fncts.control.IO onInterruptExtended
 */
export function onInterruptExtended_<R, E, A, R2, E2>(self: IO<R, E, A>, cleanup: Lazy<IO<R2, E2, any>>): IO<R & R2, E | E2, A> {
  return uninterruptibleMask(({ restore }) =>
    restore(self).matchCauseIO(
      (cause) => (cause.interrupted ? cleanup().matchCauseIO(IO.failCauseNow, () => IO.failCauseNow(cause)) : IO.failCauseNow(cause)),
      IO.succeedNow,
    ),
  );
}

/**
 * Returns an IO whose interruption will be disconnected from the
 * fiber's own interruption, being performed in the background without
 * slowing down the fiber's interruption.
 *
 * This method is useful to create "fast interrupting" effects. For
 * example, if you call this on a bracketed effect, then even if the
 * effect is "stuck" in acquire or release, its interruption will return
 * immediately, while the acquire / release are performed in the
 * background.
 *
 * See timeout and race for other applications.
 *
 * @tsplus getter fncts.control.IO disconnect
 */
export function disconnect<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return uninterruptibleMask(({ restore }) =>
    IO.fiberId.chain((id) =>
      restore(self).forkDaemon.chain((fiber) => restore(fiber.join).onInterrupt(() => fiber.interruptAs(id).forkDaemon)),
    ),
  );
}

/**
 * Used to restore the inherited interruptibility
 */
export class InterruptStatusRestore {
  constructor(readonly flag: InterruptStatus) {}

  restore = <R, E, A>(io: IO<R, E, A>): IO<R, E, A> => io.setInterruptStatus(this.flag);

  force = <R, E, A>(io: IO<R, E, A>): IO<R, E, A> => {
    if (this.flag.isUninteruptible) {
      return io.uninterruptible.disconnect.interruptible;
    }
    return io.setInterruptStatus(this.flag);
  };
}
