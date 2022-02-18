import type { FiberDescriptor } from "../../data/FiberDescriptor";
import type { Lazy } from "../../data/function";
import type { InterruptStatus } from "../../data/InterruptStatus";
import type { Maybe } from "../../data/Maybe";
import type { RuntimeConfig } from "../../data/RuntimeConfig";
import type { Eval } from "../Eval";
import type { Supervisor } from "../Supervisor";
import type { Canceler, FIO, UIO } from "./definition";

import { Cause } from "../../data/Cause";
import { Either } from "../../data/Either";
import { Exit } from "../../data/Exit";
import { FiberId } from "../../data/FiberId";
import { identity } from "../../data/function";
import { Nothing } from "../../data/Maybe";
import { Trace } from "../../data/Trace";
import {
  Async,
  Defer,
  DeferWith,
  Fail,
  GetDescriptor,
  GetInterrupt,
  IO,
  IOError,
  Succeed,
  SucceedNow,
  Supervise,
} from "./definition";

/**
 * Imports an asynchronous side-effect into a `IO`
 *
 * @tsplus static fncts.control.IOOps async
 */
export function async<R, E, A>(
  register: (resolve: (_: IO<R, E, A>) => void) => void,
  blockingOn: FiberId = FiberId.none,
  __tsplusTrace?: string
): IO<R, E, A> {
  return IO.asyncMaybe(
    (cb) => {
      register(cb);
      return Nothing();
    },
    blockingOn,
    __tsplusTrace
  );
}

/**
 * Imports an asynchronous effect into a pure `IO`, possibly returning the value synchronously.
 *
 * If the register function returns a value synchronously, then the callback
 * function must not be called. Otherwise the callback function must be called at most once.
 *
 * @tsplus static fncts.control.IOOps asyncMaybe
 */
export function asyncMaybe<R, E, A>(
  register: (resolve: (_: IO<R, E, A>) => void) => Maybe<IO<R, E, A>>,
  blockingOn: FiberId = FiberId.none,
  __tsplusTrace?: string
): IO<R, E, A> {
  return asyncInterrupt(
    (cb) => register(cb).match(() => Either.left(IO.unit), Either.right),
    blockingOn,
    __tsplusTrace
  );
}

/**
 * Imports an asynchronous side-effect into an IO. The side-effect
 * has the option of returning the value synchronously, which is useful in
 * cases where it cannot be determined if the effect is synchronous or
 * asynchronous until the side-effect is actually executed. The effect also
 * has the option of returning a canceler, which will be used by the runtime
 * to cancel the asynchronous effect if the fiber executing the effect is
 * interrupted.
 *
 * If the register function returns a value synchronously, then the callback
 * function must not be called. Otherwise the callback function must be called
 * at most once.
 *
 * The list of fibers, that may complete the async callback, is used to
 * provide better diagnostics.
 *
 * @tsplus static fncts.control.IOOps asyncInterrupt
 */
export function asyncInterrupt<R, E, A>(
  register: (
    cb: (resolve: IO<R, E, A>) => void
  ) => Either<Canceler<R>, IO<R, E, A>>,
  blockingOn: FiberId = FiberId.none,
  __tsplusTrace?: string
): IO<R, E, A> {
  return new Async(register, blockingOn, __tsplusTrace);
}

/**
 * Checks the interrupt status, and produces the IO returned by the
 * specified callback.
 *
 * @tsplus static fncts.control.IOOps checkInterruptible
 */
export function checkInterruptible<R, E, A>(
  f: (i: InterruptStatus) => IO<R, E, A>,
  __tsplusTrace?: string
): IO<R, E, A> {
  return new GetInterrupt(f, __tsplusTrace);
}

/**
 * Returns a lazily constructed effect, whose construction may itself require
 * effects. The effect must not throw any exceptions. When no environment is required (i.e., when R == unknown)
 * it is conceptually equivalent to `flatten(succeedWith(io))`. If you wonder if the effect throws exceptions,
 * do not use this method, use `IO.deferTryCatch`.
 *
 * @tsplus static fncts.control.IOOps defer
 */
export function defer<R, E, A>(
  io: Lazy<IO<R, E, A>>,
  __tsplusTrace?: string
): IO<R, E, A> {
  return new Defer(io, __tsplusTrace);
}

/**
 * Returns a lazily constructed effect, whose construction may itself require
 * effects. The effect must not throw any exceptions. When no environment is required (i.e., when R == unknown)
 * it is conceptually equivalent to `flatten(effectTotal(io))`. If you wonder if the effect throws exceptions,
 * do not use this method, use `IO.deferTryCatchWith`.
 *
 * @tsplus static fncts.control.IOOps deferWith
 */
export function deferWith<R, E, A>(
  io: (runtimeConfig: RuntimeConfig, id: FiberId) => IO<R, E, A>,
  __tsplusTrace?: string
): IO<R, E, A> {
  return new DeferWith(io, __tsplusTrace);
}

/**
 * Returns a lazily constructed effect, whose construction may itself require effects.
 * When no environment is required (i.e., when R == unknown) it is conceptually equivalent to `flatten(try(io))`.
 *
 * @tsplus static fncts.control.IOOps deferTry
 */
export function deferTry<R, E, A>(
  io: () => IO<R, E, A>,
  __tsplusTrace?: string
): IO<R, unknown, A> {
  return IO.defer(() => {
    try {
      return io();
    } catch (u) {
      throw new IOError(Exit.fail(u));
    }
  }, __tsplusTrace);
}

/**
 * Returns a lazily constructed effect, whose construction may itself require effects.
 * When no environment is required (i.e., when R == unknown) it is conceptually equivalent to `flatten(effect(io))`.
 *
 * @tsplus static IOOps deferTryWith
 */
export function deferTryWith<R, E, A>(
  io: (runtimeConfig: RuntimeConfig, id: FiberId) => IO<R, E, A>
): IO<R, unknown, A> {
  return IO.deferWith((runtimeConfig, id) => {
    try {
      return io(runtimeConfig, id);
    } catch (u) {
      throw new IOError(Exit.fail(u));
    }
  });
}

/**
 * Returns a lazily constructed effect, whose construction may itself require effects,
 * translating any thrown exceptions into typed failed effects and mapping the error.
 *
 * When no environment is required (i.e., when R == unknown) it is conceptually equivalent to `flatten(effect(io))`.
 *
 * @tsplus static IOOps deferTryCatch
 */
export function deferTryCatch<R, E, A, E1>(
  io: () => IO<R, E, A>,
  onThrow: (error: unknown) => E1
): IO<R, E | E1, A> {
  return IO.defer(() => {
    try {
      return io();
    } catch (u) {
      throw new IOError(Exit.fail(onThrow(u)));
    }
  });
}

/**
 * Returns a lazily constructed effect, whose construction may itself require effects,
 * translating any thrown exceptions into typed failed effects and mapping the error.
 *
 * When no environment is required (i.e., when R == unknown) it is conceptually equivalent to `flatten(effect(io))`.
 *
 * @tsplus static IOOps deferTryCatchWith
 */
export function deferTryCatchWith<R, E, A, E1>(
  io: (runtimeConfig: RuntimeConfig, id: FiberId) => IO<R, E, A>,
  onThrow: (error: unknown) => E1
): IO<R, E | E1, A> {
  return IO.deferWith((runtimeConfig, id) => {
    try {
      return io(runtimeConfig, id);
    } catch (u) {
      throw new IOError(Exit.fail(onThrow(u)));
    }
  });
}

/**
 * Constructs an IO based on information about the current fiber, such as
 * its identity.
 *
 * @tsplus static fncts.control.IOOps descriptorWith
 */
export function descriptorWith<R, E, A>(
  f: (d: FiberDescriptor) => IO<R, E, A>,
  __tsplusTrace?: string
): IO<R, E, A> {
  return new GetDescriptor(f, __tsplusTrace);
}

/**
 * @tsplus static fncts.control.IOOps fail
 */
export function fail<E>(e: Lazy<E>, __tsplusTrace?: string): FIO<E, never> {
  return new Fail(() => Cause.fail(e()), __tsplusTrace);
}

/**
 * @tsplus static fncts.control.IOOps failNow
 */
export function failNow<E>(e: E, __tsplusTrace?: string): FIO<E, never> {
  return new Fail(() => Cause.fail(e), __tsplusTrace);
}

/**
 * Creates a `IO` that has failed with the specified `Cause`
 *
 * @tsplus static fncts.control.IOOps failCauseNow
 */
export function failCauseNow<E>(
  cause: Cause<E>,
  __tsplusTrace?: string
): FIO<E, never> {
  return new Fail(() => cause, __tsplusTrace);
}

/**
 * Returns an effect that models failure with the specified lazily-evaluated `Cause`.
 *
 * @tsplus static fncts.control.IOOps failCause
 */
export function failCause<E = never, A = never>(
  cause: Lazy<Cause<E>>,
  __tsplusTrace?: string
): FIO<E, A> {
  return new Fail(cause, __tsplusTrace);
}

/**
 * Returns the `FiberId` of the `Fiber` on which this `IO` is running
 *
 * @tsplus static fncts.control.IOOps fiberId
 */
export const fiberId: IO<unknown, never, FiberId> = IO.descriptorWith((d) =>
  IO.succeedNow(d.id)
);

/**
 * Lifts an `Either` into an `IO`
 *
 * @tsplus static fncts.control.IOOps fromEither
 */
export function fromEither<E, A>(
  either: Lazy<Either<E, A>>,
  __tsplusTrace?: string
): IO<unknown, E, A> {
  return IO.succeed(either).chain((ea) => ea.match(IO.failNow, IO.succeedNow));
}

/**
 * Lifts an `Either` into an `IO`
 *
 * @tsplus static fncts.control.IOOps fromEitherNow
 */
export function fromEitherNow<E, A>(
  either: Either<E, A>,
  __tsplusTrace?: string
): IO<unknown, E, A> {
  return either.match(IO.failNow, IO.succeedNow);
}

/**
 * Lifts an `Eval` into an `IO`
 *
 * @tsplus static fncts.control.IOOps fromEval
 */
export function fromEval<A>(
  computation: Eval<A>,
  __tsplusTrace?: string
): IO<unknown, never, A> {
  return IO.succeed(computation.run);
}

/**
 * Creates a `IO` from an exit value
 *
 * @tsplus static fncts.control.IOOps fromExit
 */
export function fromExit<E, A>(
  exit: Lazy<Exit<E, A>>,
  __tsplusTrace?: string
): FIO<E, A> {
  return IO.defer(exit().match(IO.failCauseNow, IO.succeedNow));
}

/**
 * Creates a `IO` from an exit value
 *
 * @tsplus static fncts.control.IOOps fromExitNow
 */
export function fromExitNow<E, A>(
  exit: Exit<E, A>,
  __tsplusTrace?: string
): FIO<E, A> {
  return exit.match(IO.failCauseNow, IO.succeedNow);
}

/**
 * Lifts a `Maybe` into an `IO` but preserves the error as a `Maybe` in the error channel, making it easier to compose
 * in some scenarios.
 *
 * @tsplus static fncts.control.IOOps fromMaybe
 */
export function fromMaybe<A>(
  maybe: Lazy<Maybe<A>>,
  __tsplusTrace?: string
): FIO<Maybe<never>, A> {
  return IO.succeed(maybe).chain((m) =>
    m.match(() => IO.failNow(Nothing()), IO.succeedNow)
  );
}

/**
 * @tsplus static fncts.control.IOOps fromMaybeNow
 */
export function fromMaybeNow<A = never>(
  maybe: Maybe<A>,
  __tsplusTrace?: string
): IO<unknown, Maybe<never>, A> {
  return maybe.match(() => IO.failNow(Nothing()), IO.succeedNow);
}

/**
 * Create an IO that when executed will construct `promise` and wait for its result,
 * errors will be handled using `onReject`
 *
 * @tsplus static fncts.control.IOOps fromPromiseCatch
 */
export function fromPromiseCatch<E, A>(
  promise: Lazy<Promise<A>>,
  onReject: (reason: unknown) => E,
  __tsplusTrace?: string
): FIO<E, A> {
  return IO.async((k) => {
    promise()
      .then((a) => k(IO.succeedNow(a)))
      .catch((e) => k(IO.failNow(onReject(e))));
  });
}

/**
 * Create an IO that when executed will construct `promise` and wait for its result,
 * errors will produce failure as `unknown`
 *
 * @tsplus static fncts.control.IOOps fromPromise
 */
export function fromPromise<A>(
  promise: Lazy<Promise<A>>,
  __tsplusTrace?: string
): FIO<unknown, A> {
  return IO.fromPromiseCatch(promise, identity);
}

/**
 * Like fromPromise but produces a defect in case of errors
 *
 * @tsplus static fncts.control.IOOps fromPromiseHalt
 */
export function fromPromiseHalt<A>(
  promise: Lazy<Promise<A>>,
  __tsplusTrace?: string
): FIO<never, A> {
  return async((k) => {
    promise()
      .then((a) => k(IO.succeedNow(a)))
      .catch((e) => k(IO.haltNow(e)));
  });
}

/**
 * Creates an `IO` that halts with the specified lazily-evaluated defect.
 * This method can be used for terminating a fiber because a defect has been
 * detected in the code.
 *
 * @tsplus static fncts.control.IOOps halt
 */
export function halt(e: Lazy<unknown>, __tsplusTrace?: string): UIO<never> {
  return IO.failCause(() => Cause.halt(e(), Trace.none), __tsplusTrace);
}

/**
 * Creates an `IO` that halts with the specified defect
 * This method can be used for terminating a fiber because a defect has been
 * detected in the code.
 *
 * @tsplus static fncts.control.IOOps haltNow
 */
export function haltNow(e: unknown, __tsplusTrace?: string): UIO<never> {
  return IO.failCauseNow(Cause.halt(e, Trace.none), __tsplusTrace);
}

/**
 * Creates a `IO` that has succeeded with a pure value
 *
 * @tsplus static fncts.control.IOOps succeedNow
 */
export function succeedNow<A>(
  value: A,
  __tsplusTrace?: string
): IO<unknown, never, A> {
  return new SucceedNow(value, __tsplusTrace);
}

/**
 * Imports a total synchronous effect into a pure `IO` value.
 * The effect must not throw any exceptions. If you wonder if the effect
 * throws exceptions, then do not use this method, use `IO.try`
 *
 * @tsplus static fncts.control.IOOps succeed
 * @tsplus static fncts.control.IOOps __call
 */
export function succeed<A>(effect: Lazy<A>, __tsplusTrace?: string): UIO<A> {
  return new Succeed(effect, __tsplusTrace);
}

/**
 *
 * Returns an IO with the behavior of this one, but where all child
 * fibers forked in the effect are reported to the specified supervisor.
 *
 * @tsplus fluent fncts.control.IO supervised
 */
export function supervised_<R, E, A>(
  fa: IO<R, E, A>,
  supervisor: Supervisor<any>,
  __tsplusTrace?: string
): IO<R, E, A> {
  return new Supervise(fa, supervisor);
}

/**
 * Creates a `IO` that has succeeded with a pure value
 *
 * @tsplus static fncts.control.IOOps tryCatch
 */
export function tryCatch<E, A>(
  effect: Lazy<A>,
  onThrow: (error: unknown) => E,
  __tsplusTrace?: string
): FIO<E, A> {
  return IO.succeed(() => {
    try {
      return effect();
    } catch (u) {
      throw new IOError(Exit.fail(onThrow(u)));
    }
  });
}

/**
 * @tsplus static fncts.control.IOOps unit
 */
export const unit: UIO<void> = IO.succeedNow(undefined);

// codegen:start { preset: pipeable }
/**
 *
 * Returns an IO with the behavior of this one, but where all child
 * fibers forked in the effect are reported to the specified supervisor.
 * @tsplus dataFirst supervised_
 */
export function supervised(
  supervisor: Supervisor<any>,
  __tsplusTrace?: string
) {
  return <R, E, A>(fa: IO<R, E, A>): IO<R, E, A> =>
    supervised_(fa, supervisor, __tsplusTrace);
}
// codegen:end
