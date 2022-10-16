/**
 * Returns an effect that is interrupted as if by the specified fiber.
 *
 * @tsplus static fncts.io.IOOps interruptAs
 */
export function interruptAs(fiberId: FiberId, __tsplusTrace?: string): FIO<never, never> {
  return IO.failCauseNow(Cause.interrupt(fiberId));
}

/**
 * Returns an effect that is interrupted as if by the fiber calling this
 * method.
 *
 * @tsplus static fncts.io.IOOps interrupt
 */
export const interrupt: IO<never, never, never> = IO.fiberId.flatMap(IO.interruptAs);

/**
 * Switches the interrupt status for this effect. If `true` is used, then the
 * effect becomes interruptible (the default), while if `false` is used, then
 * the effect becomes uninterruptible. These changes are compositional, so
 * they only affect regions of the effect.
 *
 * @tsplus pipeable fncts.io.IO setInterruptStatus
 */
export function setInterruptStatus(flag: InterruptStatus, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R, E, A> => {
    return IO.withFiberContext((fiber) => {
      const b = flag.toBoolean;
      if (fiber.unsafeIsInterruptible !== b) {
        fiber.interruptStatus.push(b);
        fiber.unsafeRestoreInterruptStatus();
      }
      return self;
    });
  };
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
 * @tsplus getter fncts.io.IO interruptible
 * @tsplus static fncts.io.IOOps interruptible
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
 * @tsplus getter fncts.io.IO uninterruptible
 * @tsplus static fncts.io.IOOps uninterruptible
 */
export function uninterruptible<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return self.setInterruptStatus(InterruptStatus.uninterruptible);
}

/**
 * Makes the effect uninterruptible, but passes it a restore function that
 * can be used to restore the inherited interruptibility from whatever region
 * the effect is composed into.
 *
 * @tsplus static fncts.io.IOOps uninterruptibleMask
 */
export function uninterruptibleMask<R, E, A>(
  f: (restore: InterruptStatusRestore) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.checkInterruptible((flag) => f(new InterruptStatusRestore(flag)).uninterruptible);
}

/**
 * Makes the effect interruptible, but passes it a restore function that can
 * be used to restore the inherited interruptibility from whatever region the
 * effect is composed into.
 *
 * @tsplus static fncts.io.IOOps interruptibleMask
 */
export function interruptibleMask<R, E, A>(
  k: (restore: InterruptStatusRestore) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.checkInterruptible((flag) => k(new InterruptStatusRestore(flag)).interruptible);
}

/**
 * Calls the specified function, and runs the effect it returns, if this
 * effect is interrupted.
 *
 * @tsplus pipeable fncts.io.IO onInterrupt
 */
export function onInterrupt_<R1>(
  cleanup: (interruptors: HashSet<FiberId>) => IO<R1, never, any>,
  __tsplusTrace?: string,
) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R | R1, E, A> => {
    return uninterruptibleMask(({ restore }) =>
      restore(ma).matchCauseIO(
        (cause) =>
          cause.interrupted ? cleanup(cause.interruptors).zipRight(IO.failCauseNow(cause)) : IO.failCauseNow(cause),
        IO.succeedNow,
      ),
    );
  };
}

/**
 * Calls the specified function, and runs the effect it returns, if this
 * effect is interrupted (allows for expanding error).
 *
 * @tsplus pipeable fncts.io.IO onInterruptExtended
 */
export function onInterruptExtended_<R2, E2>(cleanup: Lazy<IO<R2, E2, any>>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R | R2, E | E2, A> => {
    return uninterruptibleMask(({ restore }) =>
      restore(self).matchCauseIO(
        (cause) =>
          cause.interrupted
            ? cleanup().matchCauseIO(IO.failCauseNow, () => IO.failCauseNow(cause))
            : IO.failCauseNow(cause),
        IO.succeedNow,
      ),
    );
  };
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
 * @tsplus getter fncts.io.IO disconnect
 */
export function disconnect<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return uninterruptibleMask(({ restore }) =>
    IO.fiberId.flatMap((id) =>
      restore(self).forkDaemon.flatMap((fiber) =>
        restore(fiber.join).onInterrupt(() => fiber.interruptAs(id).forkDaemon),
      ),
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
