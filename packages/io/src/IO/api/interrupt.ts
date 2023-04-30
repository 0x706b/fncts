import { IOPrimitive,IOTag } from "@fncts/io/IO/definition";
import { RuntimeFlag } from "@fncts/io/RuntimeFlag";
import { RuntimeFlags } from "@fncts/io/RuntimeFlags";

export type InterruptibilityRestorer = <R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string) => IO<R, E, A>;

const RestoreInterruptible: InterruptibilityRestorer = (io, __tsplusTrace) => io.interruptible;

const RestoreUninterruptible: InterruptibilityRestorer = (io, __tsplusTrace) => io.uninterruptible;

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
  const io = new IOPrimitive(IOTag.UpdateRuntimeFlagsWithin) as any;
  io.i0    = RuntimeFlags.enable(RuntimeFlag.Interruption);
  io.i1    = () => self;
  io.trace = __tsplusTrace;
  return io;
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
  const io = new IOPrimitive(IOTag.UpdateRuntimeFlagsWithin) as any;
  io.i0    = RuntimeFlags.disable(RuntimeFlag.Interruption);
  io.i1    = () => self;
  io.trace = __tsplusTrace;
  return io;
}

/**
 * Makes the effect uninterruptible, but passes it a restore function that
 * can be used to restore the inherited interruptibility from whatever region
 * the effect is composed into.
 *
 * @tsplus static fncts.io.IOOps uninterruptibleMask
 */
export function uninterruptibleMask<R, E, A>(
  f: (restore: InterruptibilityRestorer) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  const io = new IOPrimitive(IOTag.UpdateRuntimeFlagsWithin) as any;
  io.i0    = RuntimeFlags.disable(RuntimeFlag.Interruption);
  io.i1    = (oldFlags: RuntimeFlags) => f(oldFlags.interruption ? RestoreInterruptible : RestoreUninterruptible);
  io.trace = __tsplusTrace;
  return io;
}

/**
 * @tsplus pipeable fncts.io.IO ensuring
 */
export function ensuring<R1>(finalizer: IO<R1, never, any>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R | R1, E, A> => {
    return IO.uninterruptibleMask((restore) =>
      restore(self).matchCauseIO(
        (cause1) =>
          finalizer.matchCauseIO(
            (cause2) => IO.failCauseNow(Cause.sequential(cause1, cause2)),
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
    return IO.uninterruptibleMask((restore) =>
      restore(self).matchCauseIO(
        (failure1) => {
          const result = Exit.failCause(failure1);
          return cleanup(result).matchCauseIO(
            (failure2) => IO.failCauseNow(Cause.sequential(failure1, failure2)),
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
