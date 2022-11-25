import { Dynamic, Interruptible, Uninterruptible } from "@fncts/io/IO/definition";
import { RuntimeFlag } from "@fncts/io/RuntimeFlag";
import { RuntimeFlags } from "@fncts/io/RuntimeFlags";

export interface InterruptibilityRestorer {
  readonly restore: <R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string) => IO<R, E, A>;
  readonly force: <R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string) => IO<R, E, A>;
}

const RestoreInterruptible: InterruptibilityRestorer = {
  restore: (io, __tsplusTrace) => io.interruptible,
  force: (io, __tsplusTrace) => io.interruptible,
};

const RestoreUninterruptible: InterruptibilityRestorer = {
  restore: (io, __tsplusTrace) => io.uninterruptible,
  force: (io, __tsplusTrace) => io.uninterruptible.disconnect.interruptible,
};

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

// /**
//  * Switches the interrupt status for this effect. If `true` is used, then the
//  * effect becomes interruptible (the default), while if `false` is used, then
//  * the effect becomes uninterruptible. These changes are compositional, so
//  * they only affect regions of the effect.
//  *
//  * @tsplus fluent fncts.io.IO setInterruptStatus
//  */
// export function setInterruptStatus_<R, E, A>(
//   self: IO<R, E, A>,
//   flag: InterruptStatus,
//   __tsplusTrace?: string,
// ): IO<R, E, A> {
//   return new SetInterrupt(self, flag, __tsplusTrace);
// }

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
  return new Interruptible(self, __tsplusTrace);
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
  return new Uninterruptible(self, __tsplusTrace);
}

/**
 * Makes the effect uninterruptible, but passes it a restore function that
 * can be used to restore the inherited interruptibility from whatever region
 * the effect is composed into.
 *
 * @tsplus static fncts.io.IOOps uninterruptibleMask
 */
export function uninterruptibleMask<R, E, A>(f: (restore: InterruptibilityRestorer) => IO<R, E, A>): IO<R, E, A> {
  return new Dynamic(RuntimeFlags.disable(RuntimeFlag.Interruption), (oldFlags) =>
    f(oldFlags.interruption ? RestoreInterruptible : RestoreUninterruptible),
  );
}

/**
 * @tsplus pipeable fncts.io.IO ensuring
 */
export function ensuring<R1>(finalizer: IO<R1, never, any>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R | R1, E, A> => {
    return IO.uninterruptibleMask(({ restore }) =>
      restore(self).matchCauseIO(
        (cause1) =>
          finalizer.matchCauseIO(
            (cause2) => IO.failCauseNow(Cause.then(cause1, cause2)),
            () => IO.failCauseNow(cause1),
          ),
        (a) => finalizer.map(() => a),
      ),
    );
  };
}

/**
 * Makes the effect interruptible, but passes it a restore function that can
 * be used to restore the inherited interruptibility from whatever region the
 * effect is composed into.
 *
 * @tsplus static fncts.io.IOOps interruptibleMask
 */
export function interruptibleMask<R, E, A>(
  k: (restore: InterruptibilityRestorer) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.checkInterruptible(
    (flag) => k(flag.isInterruptible ? RestoreInterruptible : RestoreUninterruptible).interruptible,
  );
}

/**
 * Calls the specified function, and runs the effect it returns, if this
 * effect is interrupted.
 *
 * @tsplus pipeable fncts.io.IO onInterrupt
 */
export function onInterrupt<R1, E1>(cleanup: Lazy<IO<R1, E1, any>>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R | R1, E | E1, A> => {
    return ma.onExit((exit) =>
      exit.match(
        (cause) => (cause.isInterruptedOnly ? cleanup() : IO.unit),
        () => IO.unit,
      ),
    );
  };
}

/**
 * Calls the specified function, and runs the effect it returns, if this
 * effect is interrupted.
 *
 * @tsplus pipeable fncts.io.IO onInterrupt
 */
export function onInterruptWith<R1, E1>(
  cleanup: (interruptors: HashSet<FiberId>) => IO<R1, E1, any>,
  __tsplusTrace?: string,
) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R | R1, E | E1, A> => {
    return ma.onExit((exit) =>
      exit.match(
        (cause) => (cause.isInterruptedOnly ? cleanup(cause.interruptors) : IO.unit),
        () => IO.unit,
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.IO onExit
 */
export function onExit<E, A, R1, E1>(cleanup: (exit: Exit<E, A>) => IO<R1, E1, any>, __tsplusTrace?: string) {
  return <R>(self: IO<R, E, A>): IO<R | R1, E | E1, A> => {
    return IO.uninterruptibleMask(({ restore }) =>
      restore(self).matchCauseIO(
        (failure1) => {
          const result = Exit.failCause(failure1);
          return cleanup(result).matchCauseIO(
            (failure2) => IO.failCauseNow(Cause.then(failure1, failure2)),
            () => IO.fromExitNow(result),
          );
        },
        (success) => {
          const result = Exit.succeed(success);
          return cleanup(result) > IO.fromExitNow(result);
        },
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
    IO.fiberId.flatMap((fiberId) =>
      Do((Δ) => {
        const fiber = Δ(restore(self).forkDaemon);
        return Δ(restore(fiber.join).onInterrupt(fiber.interruptAsFork(fiberId)));
      }),
    ),
  );
}
