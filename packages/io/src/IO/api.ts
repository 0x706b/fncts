import type * as P from "@fncts/base/typeclass";
import type { _E, _R } from "@fncts/base/types";
import type { FiberContext } from "@fncts/io/Fiber/FiberContext";
import type { Canceler } from "@fncts/io/IO/definition";

import { identity, pipe, tuple } from "@fncts/base/data/function";
import {
  Async,
  Chain,
  Defer,
  DeferWith,
  Ensuring,
  Fail,
  FiberRefModifyAll,
  Fork,
  GetDescriptor,
  GetInterrupt,
  IO,
  IOError,
  Logged,
  Match,
  SetRuntimeConfig,
  Succeed,
  SucceedNow,
  Supervise,
  Yield,
} from "@fncts/io/IO/definition";

/**
 * Imports an asynchronous side-effect into a `IO`
 *
 * @tsplus static fncts.io.IOOps async
 */
export function async<R, E, A>(
  register: (resolve: (_: IO<R, E, A>) => void) => void,
  blockingOn: FiberId = FiberId.none,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.asyncMaybe(
    (cb) => {
      register(cb);
      return Nothing();
    },
    blockingOn,
    __tsplusTrace,
  );
}

/**
 * Imports an asynchronous effect into a pure `IO`, possibly returning the value synchronously.
 *
 * If the register function returns a value synchronously, then the callback
 * function must not be called. Otherwise the callback function must be called at most once.
 *
 * @tsplus static fncts.io.IOOps asyncMaybe
 */
export function asyncMaybe<R, E, A>(
  register: (resolve: (_: IO<R, E, A>) => void) => Maybe<IO<R, E, A>>,
  blockingOn: FiberId = FiberId.none,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return asyncInterrupt(
    (cb) => register(cb).match(() => Either.left(IO.unit), Either.right),
    blockingOn,
    __tsplusTrace,
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
 * @tsplus static fncts.io.IOOps asyncInterrupt
 */
export function asyncInterrupt<R, E, A>(
  register: (cb: (resolve: IO<R, E, A>) => void) => Either<Canceler<R>, IO<R, E, A>>,
  blockingOn: FiberId = FiberId.none,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return new Async(register, blockingOn, __tsplusTrace);
}

// /**
//  * Attempts to convert defects into a failure, throwing away all information
//  * about the cause of the failure.
//  *
//  * @tsplus fluent fncts.io.IO absorbWith
//  */
// export function absorbWith_<R, E, A>(ma: IO<R, E, A>, f: (e: E) => unknown, __tsplusTrace?: string) {
//   return ma.sandbox.matchIO((cause) => IO.failNow(cause.squash(f)), IO.succeedNow)
// }

/**
 * @tsplus fluent fncts.io.IO apFirst
 */
export function apFirst_<R, E, A, R1, E1, B>(
  self: IO<R, E, A>,
  fb: IO<R1, E1, B>,
  __tsplusTrace?: string,
): IO<R1 & R, E1 | E, A> {
  return self.flatMap((a) => fb.map(() => a));
}

/**
 * Combine two effectful actions, keeping only the result of the second
 *
 * @tsplus fluent fncts.io.IO apSecond
 * @tsplus operator fncts.io.IO >
 */
export function apSecond_<R, E, A, R1, E1, B>(
  self: IO<R, E, A>,
  fb: IO<R1, E1, B>,
  __tsplusTrace?: string,
): IO<R1 & R, E1 | E, B> {
  return self.flatMap(() => fb);
}

/**
 * @tsplus fluent fncts.io.IO as
 */
export function as_<R, E, A, B>(self: IO<R, E, A>, b: Lazy<B>): IO<R, E, B> {
  return self.map(() => b());
}

/**
 * Maps the success value of this effect to an optional value.
 *
 * @tsplus getter fncts.io.IO asJust
 */
export function asJust<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, Maybe<A>> {
  return ma.map(Maybe.just);
}

/**
 * Maps the error value of this IO to an optional value.
 *
 * @tsplus getter fncts.io.IO asJustError
 */
export function asJustError<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, Maybe<E>, A> {
  return ma.mapError(Maybe.just);
}

/**
 * @tsplus getter fncts.io.IO asUnit
 */
export function asUnit<R, E, A>(self: IO<R, E, A>): IO<R, E, void> {
  return self.as(undefined);
}

/**
 * Returns an IO whose failure and success channels have been mapped by
 * the specified pair of functions, `f` and `g`.
 *
 * @tsplus fluent fncts.io.IO bimap
 */
export function bimap_<R, E, A, E1, B>(
  self: IO<R, E, A>,
  f: (e: E) => E1,
  g: (a: A) => B,
  __tsplusTrace?: string,
): IO<R, E1, B> {
  return self.matchIO(
    (e) => IO.failNow(f(e)),
    (a) => IO.succeedNow(g(a)),
  );
}

/**
 * Returns an IO that effectfully "peeks" at the failure or success of
 * this effect.
 *
 * @tsplus fluent fncts.io.IO bitap
 */
export function bitap_<R, E, A, R1, E1, R2, E2>(
  self: IO<R, E, A>,
  onFailure: (e: E) => IO<R1, E1, any>,
  onSuccess: (a: A) => IO<R2, E2, any>,
  __tsplusTrace?: string,
): IO<R & R1 & R2, E | E1 | E2, A> {
  return self.matchCauseIO(
    (cause) =>
      cause.failureOrCause.match(
        (e) => onFailure(e).flatMap(() => IO.failCauseNow(cause)),
        () => IO.failCauseNow(cause),
      ),
    (a) => onSuccess(a).apSecond(IO.succeedNow(a)),
  );
}

/**
 * Recovers from the specified error
 *
 * @tsplus fluent fncts.io.IO catch
 */
export function catch_<N extends keyof E, K extends E[N] & string, R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  tag: N,
  k: K,
  f: (e: Extract<E, { [n in N]: K }>) => IO<R1, E1, A1>,
  __tsplusTrace?: string,
): IO<R & R1, Exclude<E, { [n in N]: K }> | E1, A | A1> {
  return ma.catchAll((e) => {
    if (tag in e && e[tag] === k) {
      return f(e as any);
    }
    return IO.failNow(e as any);
  });
}

/**
 * Recovers from all errors
 *
 * @tsplus fluent fncts.io.IO catchAll
 */
export function catchAll_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  f: (e: E) => IO<R1, E1, A1>,
  __tsplusTrace?: string,
): IO<R & R1, E1, A | A1> {
  return ma.matchIO(f, IO.succeedNow);
}

/**
 *
 * Recovers from all errors with provided cause.
 *
 * @tsplus fluent fncts.io.IO catchAllCause
 */
export function catchAllCause_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  f: (_: Cause<E>) => IO<R1, E1, A1>,
  __tsplusTrace?: string,
) {
  return ma.matchCauseIO(f, IO.succeedNow);
}

/**
 * Recovers from some or all of the error cases.
 *
 * @tsplus fluent fncts.io.IO catchJust
 */
export function catchJust_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  f: (e: E) => Maybe<IO<R1, E1, A1>>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A | A1> {
  return ma.matchCauseIO(
    (cause) => cause.failureOrCause.match((e) => f(e).getOrElse(IO.failCauseNow(cause)), IO.failCauseNow),
    IO.succeedNow,
  );
}

/**
 * Recovers from some or all of the error cases with provided cause.
 *
 * @tsplus fluent fncts.io.IO catchJustCause
 */
export function catchJustCause_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  f: (_: Cause<E>) => Maybe<IO<R1, E1, A1>>,
): IO<R & R1, E | E1, A | A1> {
  return ma.matchCauseIO((cause) => f(cause).getOrElse(IO.failCauseNow(cause)), IO.succeedNow);
}

/**
 * Recovers from some or all of the defects with provided partial function.
 *
 * *WARNING*: There is no sensible way to recover from defects. This
 * method should be used only at the boundary between IO and an external
 * system, to transmit information on a defect for diagnostic or explanatory
 * purposes.
 *
 * @tsplus fluent fncts.io.IO catchJustDefect
 */
export function catchJustDefect_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  f: (_: unknown) => Maybe<IO<R1, E1, A1>>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A | A1> {
  return ma.unrefineWith(f, IO.failNow).catchAll(identity);
}

/**
 * Recovers from the specified error
 *
 * @tsplus fluent IO catchTag
 */
export function catchTag_<K extends E["_tag"] & string, R, E extends { _tag: string }, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  k: K,
  f: (e: Extract<E, { _tag: K }>) => IO<R1, E1, A1>,
  __tsplusTrace?: string,
): IO<R & R1, Exclude<E, { _tag: K }> | E1, A | A1> {
  return ma.catch("_tag", k, f);
}

/**
 * @tsplus getter fncts.io.IO cause
 */
export function cause<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, never, Cause<E>> {
  return ma.matchCauseIO(IO.succeedNow, () => IO.succeedNow(Cause.empty()));
}

/**
 * @tsplus fluent fncts.io.IO causeAsError
 */
export function causeAsError<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, Cause<E>, A> {
  return ma.matchCauseIO(IO.failNow, IO.succeedNow);
}

/**
 * Returns an IO that models the execution of this effect, followed by
 * the passing of its value to the specified continuation function `f`,
 * followed by the effect that it returns.
 *
 * @tsplus fluent fncts.io.IO flatMap
 */
export function flatMap_<R, E, A, R1, E1, B>(
  ma: IO<R, E, A>,
  f: (a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, B> {
  return new Chain(ma, f, __tsplusTrace);
}

/**
 * @tsplus fluent fncts.io.IO flatMapError
 */
export function flatMapError_<R, R1, E, E1, A>(ma: IO<R, E, A>, f: (e: E) => IO<R1, never, E1>): IO<R & R1, E1, A> {
  return ma.swapWith((effect) => effect.flatMap(f));
}

/**
 * Checks the interrupt status, and produces the IO returned by the
 * specified callback.
 *
 * @tsplus static fncts.io.IOOps checkInterruptible
 */
export function checkInterruptible<R, E, A>(
  f: (i: InterruptStatus) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return new GetInterrupt(f, __tsplusTrace);
}

/**
 * @tsplus fluent fncts.io.IO collect
 */
export function collect_<R, E, A, E1, A1>(
  ma: IO<R, E, A>,
  f: Lazy<E1>,
  pf: (a: A) => Maybe<A1>,
  __tsplusTrace?: string,
): IO<R, E | E1, A1> {
  return ma.collectIO(f, (a) => pf(a).map(IO.succeedNow));
}

/**
 * @tsplus fluent fncts.io.IO collectIO
 */
export function collectIO_<R, E, A, R1, E1, A1, E2>(
  ma: IO<R, E, A>,
  f: Lazy<E2>,
  pf: (a: A) => Maybe<IO<R1, E1, A1>>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1 | E2, A1> {
  return ma.flatMap((a) => pf(a).getOrElse(IO.fail(f)));
}

/**
 * @tsplus static fncts.io.IOOps condIO
 */
export function condIO_<R, R1, E, A>(b: boolean, onTrue: URIO<R, A>, onFalse: URIO<R1, E>): IO<R & R1, E, A> {
  return b ? onTrue : onFalse.flatMap(IO.failNow);
}

/**
 * Returns a lazily constructed effect, whose construction may itself require
 * effects. The effect must not throw any exceptions. When no environment is required (i.e., when R == unknown)
 * it is conceptually equivalent to `flatten(succeedWith(io))`. If you wonder if the effect throws exceptions,
 * do not use this method, use `IO.deferTryCatch`.
 *
 * @tsplus static fncts.io.IOOps defer
 */
export function defer<R, E, A>(io: Lazy<IO<R, E, A>>, __tsplusTrace?: string): IO<R, E, A> {
  return new Defer(io, __tsplusTrace);
}

/**
 * Returns a lazily constructed effect, whose construction may itself require
 * effects. The effect must not throw any exceptions. When no environment is required (i.e., when R == unknown)
 * it is conceptually equivalent to `flatten(effectTotal(io))`. If you wonder if the effect throws exceptions,
 * do not use this method, use `IO.deferTryCatchWith`.
 *
 * @tsplus static fncts.io.IOOps deferWith
 */
export function deferWith<R, E, A>(
  io: (runtimeConfig: RuntimeConfig, id: FiberId) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return new DeferWith(io, __tsplusTrace);
}

/**
 * Returns a lazily constructed effect, whose construction may itself require effects.
 * When no environment is required (i.e., when R == unknown) it is conceptually equivalent to `flatten(try(io))`.
 *
 * @tsplus static fncts.io.IOOps deferTry
 */
export function deferTry<R, E, A>(io: () => IO<R, E, A>, __tsplusTrace?: string): IO<R, unknown, A> {
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
  io: (runtimeConfig: RuntimeConfig, id: FiberId) => IO<R, E, A>,
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
export function deferTryCatch<R, E, A, E1>(io: () => IO<R, E, A>, onThrow: (error: unknown) => E1): IO<R, E | E1, A> {
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
  onThrow: (error: unknown) => E1,
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
 * @tsplus static fncts.io.IOOps descriptor
 */
export const descriptor = descriptorWith(IO.succeedNow);

/**
 * Constructs an IO based on information about the current fiber, such as
 * its identity.
 *
 * @tsplus static fncts.io.IOOps descriptorWith
 */
export function descriptorWith<R, E, A>(f: (d: FiberDescriptor) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return new GetDescriptor(f, __tsplusTrace);
}

/**
 * Folds an `IO` that may fail with `E` or succeed with `A` into one that never fails but succeeds with `Either<E, A>`
 *
 * @tsplus getter fncts.io.IO either
 */
export function either<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): URIO<R, Either<E, A>> {
  return ma.match(Either.left, Either.right);
}

/**
 * @tsplus fluent fncts.io.IO ensuring
 */
export function ensuring_<R, E, A, R1>(
  self: IO<R, E, A>,
  finalizer: IO<R1, never, any>,
  __tsplusTrace?: string,
): IO<R & R1, E, A> {
  return new Ensuring(self, finalizer, __tsplusTrace);
}

/**
 * @tsplus fluent fncts.io.IO errorAsCause
 */
export function errorAsCause<R, E, A>(ma: IO<R, Cause<E>, A>, __tsplusTrace?: string): IO<R, E, A> {
  return ma.matchIO(IO.failCauseNow, IO.succeedNow);
}

/**
 * @tsplus getter fncts.io.IO eventually
 */
export function eventually<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, never, A> {
  return ma.orElse(ma.eventually);
}

/**
 * @tsplus fluent fncts.io.IO extend
 */
export function extend_<R, E, A, B>(wa: IO<R, E, A>, f: (wa: IO<R, E, A>) => B, __tsplusTrace?: string): IO<R, E, B> {
  return wa.matchIO(IO.failNow, (_) => IO.succeed(f(wa)));
}

/**
 * @tsplus static fncts.io.IOOps fail
 */
export function fail<E>(e: Lazy<E>, __tsplusTrace?: string): FIO<E, never> {
  return new Fail(() => Cause.fail(e()), __tsplusTrace);
}

/**
 * @tsplus static fncts.io.IOOps failNow
 */
export function failNow<E>(e: E, __tsplusTrace?: string): FIO<E, never> {
  return new Fail(() => Cause.fail(e), __tsplusTrace);
}

/**
 * Creates a `IO` that has failed with the specified `Cause`
 *
 * @tsplus static fncts.io.IOOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>, __tsplusTrace?: string): FIO<E, never> {
  return new Fail(() => cause, __tsplusTrace);
}

/**
 * Returns an effect that models failure with the specified lazily-evaluated `Cause`.
 *
 * @tsplus static fncts.io.IOOps failCause
 */
export function failCause<E = never, A = never>(cause: Lazy<Cause<E>>, __tsplusTrace?: string): FIO<E, A> {
  return new Fail(cause, __tsplusTrace);
}

/**
 * Returns the `FiberId` of the `Fiber` on which this `IO` is running
 *
 * @tsplus static fncts.io.IOOps fiberId
 */
export const fiberId: IO<unknown, never, FiberId> = IO.descriptorWith((d) => IO.succeedNow(d.id));

/**
 * Filters the collection using the specified effectual predicate.
 *
 * @tsplus static fncts.io.IOOps filter
 */
export function filter_<A, R, E>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, boolean>,
  __tsplusTrace?: string,
): IO<R, E, Conc<A>> {
  return as
    .foldLeft(IO.succeedNow(Conc.builder<A>()) as IO<R, E, ConcBuilder<A>>, (eff, a) =>
      eff.zipWith(f(a), (builder, p) => {
        if (p) {
          builder.append(a);
        }
        return builder;
      }),
    )
    .map((b) => b.result());
}

/**
 * @tsplus static fncts.io.IOOps filterMap
 */
export function filterMap_<A, R, E, B>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, Maybe<B>>,
  __tsplusTrace?: string,
): IO<R, E, Conc<B>> {
  return IO.filterMapWithIndex(as, (_, a) => f(a));
}

/**
 * @tsplus static fncts.io.IOOps filterMapWithIndex
 */
export function filterMapWithIndex_<A, R, E, B>(
  as: Iterable<A>,
  f: (i: number, a: A) => IO<R, E, Maybe<B>>,
  __tsplusTrace?: string,
): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const bs: Array<B> = [];
    return IO.foreachWithIndexDiscard(as, (i, a) =>
      f(i, a).map((b) => {
        if (b.isJust()) {
          bs.push(b.value);
        }
      }),
    ).as(Conc.from(bs));
  });
}

/**
 * Filters the collection using the specified effectual predicate, removing
 * all elements that satisfy the predicate.
 *
 * @tsplus static fncts.io.IOOps filterNot
 */
export function filterNot_<A, R, E>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, boolean>,
  __tsplusTrace?: string,
): IO<R, E, Conc<A>> {
  return IO.filter(as, (a) => f(a).map((b) => !b));
}

/**
 * Applies `or` if the predicate fails.
 *
 * @tsplus fluent fncts.io.IO filterOrElse
 */
export function filterOrElse_<R, E, A, B extends A, R1, E1, A1>(
  fa: IO<R, E, A>,
  refinement: Refinement<A, B>,
  or: (a: Exclude<A, B>) => IO<R1, E1, A1>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, B | A1>;
export function filterOrElse_<R, E, A, R1, E1, A1>(
  fa: IO<R, E, A>,
  predicate: Predicate<A>,
  or: (a: A) => IO<R1, E1, A1>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A | A1>;
export function filterOrElse_<R, E, A, R1, E1, A1>(
  fa: IO<R, E, A>,
  predicate: Predicate<A>,
  or: unknown,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A | A1> {
  return flatMap_(
    fa,
    (a): IO<R1, E1, A | A1> => (predicate(a) ? IO.succeedNow(a) : IO.defer((or as (a: A) => IO<R1, E1, A1>)(a))),
  );
}

/**
 * Fails with `failWith` if the predicate fails.
 *
 * @tsplus fluent fncts.io.IO filterOrFail
 */
export function filterOrFail_<R, E, A, B extends A, E1>(
  fa: IO<R, E, A>,
  refinement: Refinement<A, B>,
  failWith: (a: Exclude<A, B>) => E1,
): IO<R, E | E1, B>;
export function filterOrFail_<R, E, A, E1>(
  fa: IO<R, E, A>,
  predicate: Predicate<A>,
  failWith: (a: A) => E1,
): IO<R, E | E1, A>;
export function filterOrFail_<R, E, A, E1>(
  fa: IO<R, E, A>,
  predicate: Predicate<A>,
  failWith: unknown,
): IO<R, E | E1, A> {
  return filterOrElse_(fa, predicate, (a) => IO.failNow((failWith as (a: A) => E1)(a)));
}

/**
 * Returns an `IO` that yields the value of the first
 * `IO` to succeed.
 *
 * @tsplus static fncts.io.IOOps firstSuccess
 */
export function firstSuccess<R, E, A>(mas: NonEmptyArray<IO<R, E, A>>): IO<R, E, A> {
  return mas.reduce((b, a) => b.orElse(a));
}

/**
 * Halts with specified `unknown` if the predicate fails.
 *
 * @tsplus fluent fncts.io.IO filterOrHalt
 */
export function filterOrHalt_<R, E, A, B extends A>(
  fa: IO<R, E, A>,
  refinement: Refinement<A, B>,
  haltWith: (a: Exclude<A, B>) => unknown,
  __tsplusTrace?: string,
): IO<R, E, A>;
export function filterOrHalt_<R, E, A>(
  fa: IO<R, E, A>,
  predicate: Predicate<A>,
  haltWith: (a: A) => unknown,
  __tsplusTrace?: string,
): IO<R, E, A>;
export function filterOrHalt_<R, E, A>(
  fa: IO<R, E, A>,
  predicate: Predicate<A>,
  haltWith: unknown,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return fa.filterOrElse(predicate, (a) => IO.haltNow((haltWith as (a: A) => unknown)(a)));
}

/**
 * @tsplus getter fncts.io.IO flatten
 */
export function flatten<R, E, R1, E1, A>(self: IO<R, E, IO<R1, E1, A>>): IO<R & R1, E | E1, A> {
  return self.flatMap(identity);
}

/**
 * Folds an `Iterable<A>` using an effectful function f, working sequentially from left to right.
 *
 * @tsplus static fncts.io.IOOps foldLeft
 */
export function foldLeft_<A, B, R, E>(
  as: Iterable<A>,
  b: B,
  f: (b: B, a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, B> {
  return as.foldLeft(IO.succeedNow(b) as IO<R, E, B>, (acc, el) => acc.flatMap((a) => f(a, el)));
}

/**
 * Combines an array of `IO`s using a `Monoid`
 *
 * @constrained
 * @tsplus static fncts.io.IOOps foldMap
 */
export function foldMap_<M>(M: P.Monoid<M>) {
  return <R, E, A>(as: Iterable<IO<R, E, A>>, f: (a: A) => M): IO<R, E, M> =>
    IO.foldLeft(as, M.nat, (m, a) => a.map((a) => M.combine_(m, f(a))));
}

function foldRightLoop<A, B, R, E>(
  iterator: Iterator<A>,
  b: UIO<B>,
  f: (a: A, b: IO<R, E, B>) => IO<R, E, B>,
): IO<R, E, B> {
  const next = iterator.next();
  return next.done ? b : f(next.value, foldRightLoop(iterator, b, f));
}

/**
 * Performs a right-associative fold of an `Iterable<A>`
 *
 * @tsplus static fncts.io.IOOps foldRight
 */
export function foldRight_<A, B, R, E>(
  as: Iterable<A>,
  b: UIO<B>,
  f: (a: A, b: IO<R, E, B>) => IO<R, E, B>,
): IO<R, E, B> {
  return foldRightLoop(as[Symbol.iterator](), b, f);
}

function foreachWithIndexDiscardLoop<A, R, E, B>(
  iterator: Iterator<A>,
  f: (i: number, a: A) => IO<R, E, B>,
  i = 0,
): IO<R, E, void> {
  const next = iterator.next();
  return next.done ? IO.unit : f(i, next.value).flatMap(() => foreachWithIndexDiscardLoop(iterator, f, i + 1));
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns the results in a new `Conc<B>`.
 *
 * For a parallel version of this method, see `foreachC`.
 * If you do not need the results, see `foreachUnit` for a more efficient implementation.
 *
 * @tsplus static fncts.io.IOOps foreach
 */
export function foreach_<A, R, E, B>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const acc: Array<B> = [];
    return IO.foreachWithIndexDiscard(as, (_, a) =>
      f(a).flatMap((b) => {
        acc.push(b);
        return IO.unit;
      }),
    ).as(Conc.from(acc));
  });
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns the results in a new `Conc<B>`.
 *
 * For a parallel version of this method, see `foreachC`.
 * If you do not need the results, see `foreachUnit` for a more efficient implementation.
 *
 * @tsplus static fncts.io.IOOps foreachWithIndex
 */
export function foreachWithIndex_<A, R, E, B>(as: Iterable<A>, f: (i: number, a: A) => IO<R, E, B>): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const acc: Array<B> = [];
    return IO.foreachWithIndexDiscard(as, (i, a) =>
      f(i, a).flatMap((b) => {
        acc.push(b);
        return IO.unit;
      }),
    ).as(Conc.from(acc));
  });
}

/**
 * @tsplus static fncts.io.IOOps foreachWithIndexDiscard
 */
export function foreachWithIndexDiscard_<A, R, E, B>(
  as: Iterable<A>,
  f: (i: number, a: A) => IO<R, E, B>,
): IO<R, E, void> {
  return IO.defer(foreachWithIndexDiscardLoop(as[Symbol.iterator](), f));
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and runs
 * produced IOs sequentially.
 *
 * @tsplus static fncts.io.IOOps foreachDiscard
 */
export function foreachDiscard_<A, R, E, B>(as: Iterable<A>, f: (a: A) => IO<R, E, B>): IO<R, E, void> {
  return IO.defer(foreachWithIndexDiscardLoop(as[Symbol.iterator](), (_, a) => f(a)));
}

/**
 * Repeats this effect forever (until the first failure).
 *
 * @tsplus getter fncts.io.IO forever
 */
export function forever<R, E, A>(ma: IO<R, E, A>): IO<R, E, never> {
  return ma.apSecond(IO.yieldNow).flatMap(() => ma.forever);
}

/**
 * Returns an IO that forks this IO into its own separate fiber,
 * returning the fiber immediately, without waiting for it to begin executing
 * the IO.
 *
 * You can use the `fork` method whenever you want to execute an IO in a
 * new fiber, concurrently and without "blocking" the fiber executing other
 * IOs. Using fibers can be tricky, so instead of using this method
 * directly, consider other higher-level methods, such as `raceWith`,
 * `zipPar`, and so forth.
 *
 * The fiber returned by this method has methods interrupt the fiber and to
 * wait for it to finish executing the IO. See `Fiber` for more
 * information.
 *
 * Whenever you use this method to launch a new fiber, the new fiber is
 * attached to the parent fiber's scope. This means when the parent fiber
 * terminates, the child fiber will be terminated as well, ensuring that no
 * fibers leak. This behavior is called "None supervision", and if this
 * behavior is not desired, you may use the `forkDaemon` or `forkIn`
 * methods.
 *
 * @tsplus getter fncts.io.IO fork
 */
export function fork<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): URIO<R, FiberContext<E, A>> {
  return new Fork(ma, Nothing(), __tsplusTrace);
}

/**
 * Lifts an `Either` into an `IO`
 *
 * @tsplus static fncts.io.IOOps fromEither
 */
export function fromEither<E, A>(either: Lazy<Either<E, A>>, __tsplusTrace?: string): IO<unknown, E, A> {
  return IO.succeed(either).flatMap((ea) => ea.match(IO.failNow, IO.succeedNow));
}

/**
 * Lifts an `Either` into an `IO`
 *
 * @tsplus static fncts.io.IOOps fromEitherNow
 */
export function fromEitherNow<E, A>(either: Either<E, A>, __tsplusTrace?: string): IO<unknown, E, A> {
  return either.match(IO.failNow, IO.succeedNow);
}

/**
 * Lifts an `Eval` into an `IO`
 *
 * @tsplus static fncts.io.IOOps fromEval
 */
export function fromEval<A>(computation: Eval<A>, __tsplusTrace?: string): IO<unknown, never, A> {
  return IO.succeed(computation.run);
}

/**
 * Creates a `IO` from an exit value
 *
 * @tsplus static fncts.io.IOOps fromExit
 */
export function fromExit<E, A>(exit: Lazy<Exit<E, A>>, __tsplusTrace?: string): FIO<E, A> {
  return IO.defer(exit().match(IO.failCauseNow, IO.succeedNow));
}

/**
 * Creates a `IO` from an exit value
 *
 * @tsplus static fncts.io.IOOps fromExitNow
 */
export function fromExitNow<E, A>(exit: Exit<E, A>, __tsplusTrace?: string): FIO<E, A> {
  return exit.match(IO.failCauseNow, IO.succeedNow);
}

/**
 * Lifts a `Maybe` into an `IO` but preserves the error as a `Maybe` in the error channel, making it easier to compose
 * in some scenarios.
 *
 * @tsplus static fncts.io.IOOps fromMaybe
 */
export function fromMaybe<A>(maybe: Lazy<Maybe<A>>, __tsplusTrace?: string): FIO<Maybe<never>, A> {
  return IO.succeed(maybe).flatMap((m) => m.match(() => IO.failNow(Nothing()), IO.succeedNow));
}

/**
 * @tsplus static fncts.io.IOOps fromMaybeNow
 */
export function fromMaybeNow<A = never>(maybe: Maybe<A>, __tsplusTrace?: string): IO<unknown, Maybe<never>, A> {
  return maybe.match(() => IO.failNow(Nothing()), IO.succeedNow);
}

/**
 * Create an IO that when executed will construct `promise` and wait for its result,
 * errors will be handled using `onReject`
 *
 * @tsplus static fncts.io.IOOps fromPromiseCatch
 */
export function fromPromiseCatch<E, A>(
  promise: Lazy<Promise<A>>,
  onReject: (reason: unknown) => E,
  __tsplusTrace?: string,
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
 * @tsplus static fncts.io.IOOps fromPromise
 */
export function fromPromise<A>(promise: Lazy<Promise<A>>, __tsplusTrace?: string): FIO<unknown, A> {
  return IO.fromPromiseCatch(promise, identity);
}

/**
 * Like fromPromise but produces a defect in case of errors
 *
 * @tsplus static fncts.io.IOOps fromPromiseHalt
 */
export function fromPromiseHalt<A>(promise: Lazy<Promise<A>>, __tsplusTrace?: string): FIO<never, A> {
  return async((k) => {
    promise()
      .then((a) => k(IO.succeedNow(a)))
      .catch((e) => k(IO.haltNow(e)));
  });
}

/**
 * Unwraps the optional success of an `IO`, but can fail with a `Nothing` value.
 *
 * @tsplus getter fncts.io.IO get
 */
export function get<R, E, A>(ma: IO<R, E, Maybe<A>>): IO<R, Maybe<E>, A> {
  return ma.matchCauseIO(
    (cause) => IO.failCauseNow(cause.map(Maybe.just)),
    (ma) => ma.match(() => IO.failNow(Nothing()), IO.succeedNow),
  );
}

/**
 * Extracts the optional value, or returns the given 'orElse'.
 *
 * @tsplus fluent fncts.io.IO getOrElse
 */
export function getOrElse_<R, E, A, B>(ma: IO<R, E, Maybe<A>>, orElse: Lazy<B>): IO<R, E, A | B> {
  return ma.map((ma) => ma.getOrElse(orElse));
}

/**
 * Extracts the optional value, or executes the effect 'orElse'.
 *
 * @tsplus fluent fncts.io.IO getOrElseIO
 */
export function getOrElseIO_<R, E, A, R1, E1, B>(
  ma: IO<R, E, Maybe<A>>,
  orElse: Lazy<IO<R1, E1, B>>,
): IO<R & R1, E | E1, A | B> {
  return (ma as IO<R, E, Maybe<A | B>>).flatMap((mab) => mab.map(IO.succeedNow).getOrElse(orElse));
}

/**
 * Lifts a Maybe into an IO. If the option is `Nothing`, fail with `onNothing`.
 *
 * @tsplus static fncts.io.IOOps getOrFailWith
 */
export function getOrFailWith_<E, A>(maybe: Maybe<A>, onNothing: Lazy<E>): FIO<E, A> {
  return IO.defer(maybe.match(() => IO.fail(onNothing), IO.succeedNow));
}

/**
 * Lifts a Maybe into a IO, if the Maybe is `Nothing` it fails with Unit.
 *
 * @tsplus static fncts.io.IOOps getOrFailUnit
 */
export function getOrFailUnit<A>(option: Maybe<A>): FIO<void, A> {
  return IO.getOrFailWith(option, undefined);
}

/**
 * Creates an `IO` that halts with the specified lazily-evaluated defect.
 * This method can be used for terminating a fiber because a defect has been
 * detected in the code.
 *
 * @tsplus static fncts.io.IOOps halt
 */
export function halt(e: Lazy<unknown>, __tsplusTrace?: string): UIO<never> {
  return IO.failCause(() => Cause.halt(e(), Trace.none), __tsplusTrace);
}

/**
 * Creates an `IO` that halts with the specified defect
 * This method can be used for terminating a fiber because a defect has been
 * detected in the code.
 *
 * @tsplus static fncts.io.IOOps haltNow
 */
export function haltNow(e: unknown, __tsplusTrace?: string): UIO<never> {
  return IO.failCauseNow(Cause.halt(e, Trace.none), __tsplusTrace);
}

/**
 * @tsplus fluent fncts.io.IO ifIO
 */
export function ifIO_<R, E, R1, E1, B, R2, E2, C>(
  self: IO<R, E, boolean>,
  onFalse: Lazy<IO<R1, E1, B>>,
  onTrue: Lazy<IO<R2, E2, C>>,
): IO<R & R1 & R2, E | E1 | E2, B | C> {
  return self.flatMap((b) => (b ? onTrue() : onFalse()));
}

/**
 * @tsplus static fncts.io.IOOps if
 */
export function if_<R, E, A, R1, E1, A1>(
  b: boolean,
  onTrue: Lazy<IO<R, E, A>>,
  onFalse: Lazy<IO<R1, E1, A1>>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A | A1> {
  return IO.succeedNow(b).ifIO(onTrue, onFalse);
}

/**
 * @tsplus getter fncts.io.IO ignore
 */
export function ignore<R, E, A>(fa: IO<R, E, A>): URIO<R, void> {
  return fa.match(
    () => undefined,
    () => undefined,
  );
}

/**
 * Folds a `IO` to a boolean describing whether or not it is a failure
 *
 * @tsplus getter fncts.io.IO isFailure
 */
export function isFailure<R, E, A>(ma: IO<R, E, A>): IO<R, never, boolean> {
  return ma.match(
    () => true,
    () => false,
  );
}

/**
 * Folds a `IO` to a boolean describing whether or not it is a success
 *
 * @tsplus getter fncts.io.IO isSuccess
 */
export function isSuccess<R, E, A>(ma: IO<R, E, A>): IO<R, never, boolean> {
  return ma.match(
    () => false,
    () => true,
  );
}
/**
 * Iterates with the specified effectual function. The moral equivalent of:
 *
 * ```typescript
 * let s = initial;
 *
 * while (cont(s)) {
 *   s = body(s);
 * }
 *
 * return s;
 * ```
 *
 * @tsplus static fncts.io.IOOps iterate
 */
export function iterate_<R, E, A>(
  initial: A,
  cont: (a: A) => boolean,
  body: (a: A) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return cont(initial) ? body(initial).flatMap((a) => IO.iterate(a, cont, body)) : IO.succeedNow(initial);
}

/**
 *  Returns an IO with the value on the left part.
 *
 * @tsplus static fncts.io.IOOps left
 */
export function left<A>(a: Lazy<A>): UIO<Either<A, never>> {
  return IO.succeed(a).flatMap((a) => IO.succeedNow(Either.left(a)));
}

/**
 * @tsplus static fncts.io.IOOps log
 */
export function log(message: Lazy<string>, __tsplusTrace?: string): UIO<void> {
  return new Logged(message, Cause.empty(), Nothing(), __tsplusTrace);
}

/**
 * Loops with the specified effectual function, collecting the results into a
 * list. The moral equivalent of:
 *
 * ```typescript
 * let s  = initial
 * let as = [] as readonly A[]
 *
 * while (cont(s)) {
 *   as = [body(s), ...as]
 *   s  = inc(s)
 * }
 *
 * A.reverse(as)
 * ```
 *
 * @tsplus static fncts.io.IOOps loop
 */
export function loop_<A, R, E, B>(
  initial: A,
  cont: (a: A) => boolean,
  inc: (b: A) => A,
  body: (b: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, Conc<B>> {
  if (cont(initial)) {
    return body(initial).flatMap((a) => IO.loop(inc(initial), cont, inc, body).map((as) => as.prepend(a)));
  } else {
    return IO.succeedNow(Conc.empty());
  }
}

/**
 * Loops with the specified effectual function purely for its effects. The
 * moral equivalent of:
 *
 * ```
 * var s = initial
 *
 * while (cont(s)) {
 *   body(s)
 *   s = inc(s)
 * }
 * ```
 *
 * @tsplus static fncts.io.IOOps loopUnit
 */
export function loopUnit_<A, R, E>(
  initial: A,
  cont: (a: A) => boolean,
  inc: (a: A) => A,
  body: (a: A) => IO<R, E, any>,
  __tsplusTrace?: string,
): IO<R, E, void> {
  if (cont(initial)) {
    return body(initial).flatMap(() => IO.loop(inc(initial), cont, inc, body)).asUnit;
  } else {
    return IO.unit;
  }
}

/**
 * Returns an `IO` whose success is mapped by the specified function `f`.
 *
 * @tsplus fluent fncts.io.IO map
 */
export function map_<R, E, A, B>(fa: IO<R, E, A>, f: (a: A) => B, __tsplusTrace?: string): IO<R, E, B> {
  return fa.flatMap((a) => IO.succeedNow(f(a)));
}

/**
 * Map covariantly over the first argument.
 *
 * Returns an IO with its error channel mapped using the specified
 * function. This can be used to lift a "smaller" error into a "larger"
 * error.
 *
 * @tsplus fluent fncts.io.IO mapError
 */
export function mapError_<R, E, A, E1>(fea: IO<R, E, A>, f: (e: E) => E1, __tsplusTrace?: string): IO<R, E1, A> {
  return fea.matchCauseIO((cause) => IO.failCauseNow(cause.map(f)), IO.succeedNow);
}

/**
 * @tsplus static fncts.io.IOOps mapTryCatch
 */
export function mapTryCatch_<R, E, A, E1, B>(
  io: IO<R, E, A>,
  f: (a: A) => B,
  onThrow: (u: unknown) => E1,
  __tsplusTrace?: string,
): IO<R, E | E1, B> {
  return io.flatMap((a) => IO.tryCatch(() => f(a), onThrow));
}

/**
 * Returns an IO with its full cause of failure mapped using
 * the specified function. This can be used to transform errors
 * while preserving the original structure of Cause.
 *
 * @tsplus fluent fncts.io.IO mapErrorCause
 */
export function mapErrorCause_<R, E, A, E1>(
  ma: IO<R, E, A>,
  f: (cause: Cause<E>) => Cause<E1>,
  __tsplusTrace?: string,
): IO<R, E1, A> {
  return ma.matchCauseIO((cause) => IO.failCauseNow(f(cause)), IO.succeedNow);
}

/**
 * A more powerful version of `match_` that allows recovering from any kind of failure except interruptions.
 *
 * @tsplus fluent fncts.io.IO matchCause
 */
export function matchCause_<R, E, A, A1, A2>(
  self: IO<R, E, A>,
  onFailure: (cause: Cause<E>) => A1,
  onSuccess: (a: A) => A2,
  __tsplusTrace?: string,
): IO<R, never, A1 | A2> {
  return self.matchCauseIO(
    (cause) => IO.succeedNow(onFailure(cause)),
    (a) => IO.succeedNow(onSuccess(a)),
  );
}

/**
 * A more powerful version of `matchIO` that allows recovering from any kind of failure except interruptions.
 *
 * @tsplus fluent fncts.io.IO matchCauseIO
 */
export function matchCauseIO_<R, E, A, R1, E1, A1, R2, E2, A2>(
  self: IO<R, E, A>,
  onFailure: (cause: Cause<E>) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string,
): IO<R & R1 & R2, E1 | E2, A1 | A2> {
  return new Match(self, onFailure, onSuccess, __tsplusTrace);
}

/**
 * @tsplus fluent fncts.io.IO matchIO
 */
export function matchIO_<R, R1, R2, E, E1, E2, A, A1, A2>(
  self: IO<R, E, A>,
  onFailure: (e: E) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string,
): IO<R & R1 & R2, E1 | E2, A1 | A2> {
  return self.matchCauseIO((cause) => cause.failureOrCause.match(onFailure, IO.failCauseNow), onSuccess);
}

/**
 * Folds over the failure value or the success value to yield an IO that
 * does not fail, but succeeds with the value returned by the left or right
 * function passed to `match_`.
 *
 * @tsplus fluent fncts.io.IO match
 */
export function match_<R, E, A, B, C>(
  self: IO<R, E, A>,
  onFailure: (e: E) => B,
  onSuccess: (a: A) => C,
  __tsplusTrace?: string,
): IO<R, never, B | C> {
  return self.matchIO(
    (e) => IO.succeedNow(onFailure(e)),
    (a) => IO.succeedNow(onSuccess(a)),
  );
}

/**
 * A version of `matchIO` that gives you the (optional) trace of the error.
 *
 * @tsplus fluent fncts.io.IO matchTraceIO
 */
export function matchTraceIO_<R, E, A, R1, E1, A1, R2, E2, A2>(
  ma: IO<R, E, A>,
  onFailure: (e: E, trace: Trace) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string,
): IO<R & R1 & R2, E1 | E2, A1 | A2> {
  return ma.matchCauseIO(
    (cause) => cause.failureTraceOrCause.match(([e, trace]) => onFailure(e, trace), IO.failCauseNow),
    onSuccess,
  );
}

/**
 * @tsplus getter fncts.io.IO maybe
 */
export function maybe<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): URIO<R, Maybe<A>> {
  return io.match(() => Nothing(), Maybe.just);
}

/**
 * @tsplus getter fncts.io.IO merge
 */
export function merge<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, never, A | E> {
  return io.matchIO(IO.succeedNow, IO.succeedNow);
}

/**
 * Merges an `Iterable<IO>` to a single IO, working sequentially.
 *
 * @tsplus static fncts.io.IOOps mergeAll
 */
export function mergeAll_<R, E, A, B>(
  fas: Iterable<IO<R, E, A>>,
  b: B,
  f: (b: B, a: A) => B,
  __tsplusTrace?: string,
): IO<R, E, B> {
  return fas.foldLeft(IO.succeed(b) as IO<R, E, B>, (b, a) => b.zipWith(a, f));
}

/**
 * Returns a `IO` that will never produce anything. The moral equivalent of
 * `while(true) {}`, only without the wasted CPU cycles.
 *
 * @tsplus static fncts.io.IOOps never
 */
export const never: UIO<never> = defer(() =>
  asyncInterrupt<unknown, never, never>(() => {
    const interval = setInterval(() => {
      //
    }, 60000);
    return Either.left(
      IO.succeed(() => {
        clearInterval(interval);
      }),
    );
  }),
);

/**
 * Converts an option on errors into an option on values.
 *
 * @tsplus getter fncts.io.IO optional
 */
export function optional<R, E, A>(ma: IO<R, Maybe<E>, A>): IO<R, E, Maybe<A>> {
  return ma.matchIO(
    (me) => me.match(() => IO.succeedNow(Nothing()), IO.failNow),
    (a) => IO.succeedNow(Just(a)),
  );
}

/**
 * Returns the logical disjunction of the `Boolean` value returned by this
 * effect and the `Boolean` value returned by the specified effect. This
 * operator has "short circuiting" behavior so if the value returned by this
 * effect is true the specified effect will not be evaluated.
 *
 * @tsplus fluent fncts.io.IO or
 */
export function or_<R, E, R1, E1>(
  ma: IO<R, E, boolean>,
  mb: IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, boolean> {
  return ma.flatMap((b) => (b ? IO.succeedNow(true) : mb));
}

/**
 * @tsplus fluent fncts.io.IO orElse
 */
export function orElse_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  that: Lazy<IO<R1, E1, A1>>,
  __tsplusTrace?: string,
): IO<R & R1, E1, A | A1> {
  return tryOrElse_(ma, that, IO.succeedNow);
}

/**
 * @tsplus fluent fncts.io.IO orElseEither
 */
export function orElseEither_<R, E, A, R1, E1, A1>(
  self: IO<R, E, A>,
  that: Lazy<IO<R1, E1, A1>>,
  __tsplusTrace?: string,
): IO<R & R1, E1, Either<A, A1>> {
  return self.tryOrElse(that().map(Either.right), (a) => IO.succeedNow(Either.left(a)));
}

/**
 * @tsplus fluent fncts.io.IO orElseFail
 */
export function orElseFail_<R, E, A, E1>(ma: IO<R, E, A>, e: Lazy<E1>): IO<R, E1, A> {
  return ma.orElse(IO.fail(e));
}

/**
 * @tsplus fluent fncts.io.IO orElseMaybe
 */
export function orElseMaybe_<R, E, A, R1, E1, A1>(
  ma: IO<R, Maybe<E>, A>,
  that: Lazy<IO<R1, Maybe<E1>, A1>>,
  __tsplusTrace?: string,
): IO<R & R1, Maybe<E | E1>, A | A1> {
  return ma.catchAll((me) => me.match(that, (e) => IO.fail(Just(e))));
}

/**
 * @tsplus fluent fncts.io.IO orElseSucceed
 */
export function orElseSucceed_<R, E, A, A1>(ma: IO<R, E, A>, a: Lazy<A1>, __tsplusTrace?: string): IO<R, E, A | A1> {
  return ma.orElse(IO.succeed(a));
}

/**
 * @tsplus getter fncts.io.IO orHalt
 */
export function orHalt<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, never, A> {
  return ma.orHaltWith(identity);
}

/**
 * @tsplus getter fncts.io.IO orHaltKeep
 */
export function orHaltKeep<R, E, A>(ma: IO<R, E, A>): IO<R, never, A> {
  return ma.matchCauseIO((cause) => IO.failCauseNow(cause.flatMap(Cause.halt)), IO.succeedNow);
}

/**
 * @tsplus fluent fncts.io.IO orHaltWith
 */
export function orHaltWith_<R, E, A>(ma: IO<R, E, A>, f: (e: E) => unknown, __tsplusTrace?: string): IO<R, never, A> {
  return matchIO_(ma, (e) => IO.haltNow(f(e)), IO.succeedNow);
}

/**
 * Exposes all parallel errors in a single call
 *
 * @tsplus fluent fncts.io.IO parallelErrors
 */
export function parallelErrors<R, E, A>(io: IO<R, E, A>): IO<R, List<E>, A> {
  return io.matchCauseIO((cause) => {
    const f = cause.failures;
    if (f.length === 0) {
      return IO.failCauseNow(cause as Cause<never>);
    } else {
      return IO.failNow(f);
    }
  }, IO.succeedNow);
}

/**
 * Feeds elements of type `A` to a function `f` that returns an IO.
 * Collects all successes and failures in a separated fashion.
 *
 * @tsplus static fncts.io.IOOps partition
 */
export function partition_<R, E, A, B>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, never, readonly [Conc<E>, Conc<B>]> {
  return IO.foreach(as, (a) => f(a).either).map((c) => c.separate);
}

/**
 * Keeps some of the errors, and terminates the fiber with the rest
 *
 * @tsplus fluent fncts.io.IO refineOrHalt
 */
export function refineOrHalt_<R, E, A, E1>(
  fa: IO<R, E, A>,
  pf: (e: E) => Maybe<E1>,
  __tsplusTrace?: string,
): IO<R, E1, A> {
  return fa.refineOrHaltWith(pf, identity);
}

/**
 * Keeps some of the errors, and terminates the fiber with the rest, using
 * the specified function to convert the `E` into a `Throwable`.
 *
 * @tsplus fluent fncts.io.IO refineOrHaltWith
 */
export function refineOrHaltWith_<R, E, A, E1>(
  fa: IO<R, E, A>,
  pf: (e: E) => Maybe<E1>,
  f: (e: E) => unknown,
): IO<R, E1, A> {
  return fa.catchAll((e) => pf(e).match(() => IO.haltNow(f(e)), IO.failNow));
}

/**
 * Fail with the returned value if the partial function `pf` matches, otherwise
 * continue with the held value.
 *
 * @tsplus fluent fncts.io.IO reject
 */
export function reject_<R, E, A, E1>(
  fa: IO<R, E, A>,
  pf: (a: A) => Maybe<E1>,
  __tsplusTrace?: string,
): IO<R, E | E1, A> {
  return fa.rejectIO((a) => pf(a).map(IO.failNow));
}

/**
 * Continue with the returned computation if the partial function `pf` matches,
 * translating the successful match into a failure, otherwise continue with
 * the held value.
 *
 * @tsplus fluent fncts.io.IO rejectIO
 */
export function rejectIO_<R, E, A, R1, E1>(
  fa: IO<R, E, A>,
  pf: (a: A) => Maybe<IO<R1, E1, E1>>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A> {
  return fa.flatMap((a) =>
    pf(a).match(
      () => IO.succeedNow(a),
      (io) => io.flatMap(IO.failNow),
    ),
  );
}

/**
 * Repeats this effect the specified number of times.
 *
 * @tsplus fluent fncts.io.IO repeatN
 */
export function repeatN_<R, E, A>(ma: IO<R, E, A>, n: number, __tsplusTrace?: string): IO<R, E, A> {
  return ma.flatMap((a) => (n <= 0 ? IO.succeed(a) : ma.repeatN(n - 1)));
}

/**
 * Repeats this effect until its result satisfies the specified predicate.
 *
 * @tsplus fluent fncts.io.IO repeatUntil
 */
export function repeatUntil_<R, E, A>(ma: IO<R, E, A>, f: (a: A) => boolean, __tsplusTrace?: string): IO<R, E, A> {
  return ma.repeatUntilIO((a) => IO.succeedNow(f(a)));
}

/**
 * Repeats this effect until its error satisfies the specified effectful predicate.
 *
 * @tsplus fluent fncts.io.IO repeatUntilIO
 */
export function repeatUntilIO_<R, E, A, R1, E1>(
  ma: IO<R, E, A>,
  f: (a: A) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A> {
  return ma.flatMap((a) => f(a).flatMap((b) => (b ? IO.succeed(a) : ma.repeatUntilIO(f))));
}

/**
 * Repeats this effect while its error satisfies the specified predicate.
 *
 * @tsplus fluent fncts.io.IO repeatWhile
 */
export function repeatWhile_<R, E, A>(ma: IO<R, E, A>, f: (a: A) => boolean): IO<R, E, A> {
  return ma.repeatWhileIO((a) => IO.succeedNow(f(a)));
}

/**
 * Repeats this effect while its error satisfies the specified effectful predicate.
 *
 * @tsplus fluent fncts.io.IO repeatWhileIO
 */
export function repeatWhileIO_<R, E, A, R1, E1>(
  ma: IO<R, E, A>,
  f: (a: A) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A> {
  return ma.flatMap((a) => f(a).flatMap((b) => (b ? ma.repeatWhileIO(f) : IO.succeed(a))));
}

/**
 * @tsplus fluent fncts.io.IO replicate
 */
export function replicate_<R, E, A>(self: IO<R, E, A>, n: number, __tsplusTrace?: string): ImmutableArray<IO<R, E, A>> {
  return ImmutableArray.range(0, n).map(() => self);
}

/**
 * @tsplus fluent fncts.io.IO require
 */
export function require_<R, E, A>(ma: IO<R, E, Maybe<A>>, error: Lazy<E>, __tsplusTrace?: string): IO<R, E, A> {
  return ma.flatMap((ma) => ma.match(() => IO.fail(error), IO.succeedNow));
}

/**
 * Returns an IO that semantically runs the IO on a fiber,
 * producing an `Exit` for the completion value of the fiber.
 *
 * @tsplus getter fncts.io.IO result
 */
export function result<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, never, Exit<E, A>> {
  return ma.matchCauseIO(
    (cause) => IO.succeedNow(Exit.failCause(cause)),
    (a) => IO.succeedNow(Exit.succeed(a)),
  );
}

/**
 * Recover from the unchecked failure of the `IO`. (opposite of `orHalt`)
 *
 * @trace call
 */
export function resurrect<R, E, A>(io: IO<R, E, A>): IO<R, unknown, A> {
  return io.unrefineWith(Maybe.just, identity);
}

/**
 * Retries this effect until its error satisfies the specified predicate.
 *
 * @tsplus fluent fncts.io.IO retryUntil
 */
export function retryUntil_<R, E, A>(fa: IO<R, E, A>, f: (e: E) => boolean, __tsplusTrace?: string): IO<R, E, A> {
  return fa.retryUntilIO((e) => IO.succeedNow(f(e)));
}

/**
 * Retries this effect until its error satisfies the specified effectful predicate.
 *
 * @tsplus fluent fncts.io.IO retryUntilIO
 */
export function retryUntilIO_<R, E, A, R1, E1>(
  fa: IO<R, E, A>,
  f: (e: E) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A> {
  return fa.catchAll((e) => f(e).flatMap((b) => (b ? IO.failNow(e) : fa.retryUntilIO(f))));
}

/**
 * Retries this effect while its error satisfies the specified predicate.
 *
 * @tsplus fluent fncts.io.IO retryWhile
 */
export function retryWhile_<R, E, A>(fa: IO<R, E, A>, f: (e: E) => boolean, __tsplusTrace?: string): IO<R, E, A> {
  return fa.retryWhileIO((e) => IO.succeedNow(f(e)));
}

/**
 * Retries this effect while its error satisfies the specified effectful predicate.
 *
 * @tsplus fluent fncts.io.IO retryWhileIO
 */
export function retryWhileIO_<R, E, A, R1, E1>(
  fa: IO<R, E, A>,
  f: (e: E) => IO<R1, E1, boolean>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A> {
  return fa.catchAll((e) => f(e).flatMap((b) => (b ? fa.retryWhileIO(f) : IO.fail(e))));
}

/**
 * Retrieves the runtimeConfig that this effect is running on.
 *
 * @tsplus static fncts.io.IOOps runtimeConfig
 */
export const runtimeConfig: UIO<RuntimeConfig> = IO.deferWith((runtimeConfig) => IO.succeedNow(runtimeConfig));

/**
 * Exposes the full cause of failure of this effect.
 *
 * @tsplus getter fncts.io.IO sandbox
 */
export function sandbox<R, E, A>(fa: IO<R, E, A>, __tsplusTrace?: string): IO<R, Cause<E>, A> {
  return fa.matchCauseIO(IO.failNow, IO.succeedNow);
}

/**
 * @tsplus fluent fncts.io.IO sandboxWith
 */
export function sandboxWith_<R, E, A, E1>(
  ma: IO<R, E, A>,
  f: (_: IO<R, Cause<E>, A>) => IO<R, Cause<E1>, A>,
  __tsplusTrace?: string,
): IO<R, E1, A> {
  return f(ma.sandbox).unsandbox;
}

/**
 * Sets the runtime configuration to the specified value.
 * @tsplus static fncts.io.IOOps setRuntimeConfig
 */
export function setRuntimeConfig(runtimeConfig: Lazy<RuntimeConfig>, __tsplusTrace?: string): UIO<void> {
  return IO.defer(new SetRuntimeConfig(runtimeConfig(), __tsplusTrace));
}

/**
 * @tsplus static fncts.io.IOOps sequenceIterable
 */
export function sequenceIterable<R, E, A>(as: Iterable<IO<R, E, A>>): IO<R, E, Conc<A>> {
  return IO.foreach(as, identity);
}

/**
 * @tsplus static fncts.io.IOOps sequenceIterableDiscard
 */
export function sequenceIterableDiscard<R, E, A>(as: Iterable<IO<R, E, A>>, __tsplusTrace?: string): IO<R, E, void> {
  return IO.foreachDiscard(as, identity);
}

/**
 * Creates a `IO` that has succeeded with a pure value
 *
 * @tsplus static fncts.io.IOOps succeedNow
 */
export function succeedNow<A>(value: A, __tsplusTrace?: string): IO<unknown, never, A> {
  return new SucceedNow(value, __tsplusTrace);
}

/**
 * Imports a total synchronous effect into a pure `IO` value.
 * The effect must not throw any exceptions. If you wonder if the effect
 * throws exceptions, then do not use this method, use `IO.try`
 *
 * @tsplus static fncts.io.IOOps succeed
 * @tsplus static fncts.io.IOOps __call
 */
export function succeed<A>(effect: Lazy<A>, __tsplusTrace?: string): UIO<A> {
  return new Succeed(effect, __tsplusTrace);
}

/**
 *
 * Returns an IO with the behavior of this one, but where all child
 * fibers forked in the effect are reported to the specified supervisor.
 *
 * @tsplus fluent fncts.io.IO supervised
 */
export function supervised_<R, E, A>(
  fa: IO<R, E, A>,
  supervisor: Supervisor<any>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return new Supervise(fa, supervisor);
}

/**
 * @tsplus fluent fncts.io.IO summarized
 */
export function summarized_<R, E, A, R1, E1, B, C>(
  ma: IO<R, E, A>,
  summary: IO<R1, E1, B>,
  f: (start: B, end: B) => C,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, readonly [C, A]> {
  return gen(function* (_) {
    const start = yield* _(summary);
    const value = yield* _(ma);
    const end   = yield* _(summary);
    return tuple(f(start, end), value);
  });
}

/**
 * Swaps the positions of a Bifunctor's arguments
 *
 * @tsplus getter fncts.io.IO swap
 */
export function swap<R, E, A>(pab: IO<R, E, A>): IO<R, A, E> {
  return pab.matchIO(IO.succeedNow, IO.failNow);
}

/**
 * Swaps the error/value parameters, applies the function `f` and flips the parameters back
 *
 * @tsplus fluent fncts.io.IO swapWith
 */
export function swapWith_<R, E, A, R1, E1, A1>(fa: IO<R, E, A>, f: (ma: IO<R, A, E>) => IO<R1, A1, E1>) {
  return f(fa.swap).swap;
}

/**
 * A more powerful variation of `timed` that allows specifying the clock.
 *
 * @tsplus fluent fncts.io.IO timedWith
 */
export function timedWith_<R, E, A, R1, E1>(ma: IO<R, E, A>, msTime: IO<R1, E1, number>, __tsplusTrace?: string) {
  return ma.summarized(msTime, (start, end) => end - start);
}

/**
 * Creates a `IO` that has succeeded with a pure value
 *
 * @tsplus static fncts.io.IOOps tryCatch
 */
export function tryCatch<E, A>(effect: Lazy<A>, onThrow: (error: unknown) => E, __tsplusTrace?: string): FIO<E, A> {
  return IO.succeed(() => {
    try {
      return effect();
    } catch (u) {
      throw new IOError(Exit.fail(onThrow(u)));
    }
  });
}

/**
 * Returns an `IO` that submerges an `Either` into the `IO`.
 *
 * @tsplus getter fncts.io.IO absolve
 */
export function absolve<R, E, E1, A>(ma: IO<R, E, Either<E1, A>>, __tsplusTrace?: string): IO<R, E | E1, A> {
  return ma.flatMap((ea) => ea.match(IO.failNow, IO.succeedNow));
}

/**
 * Composes computations in sequence, using the return value of one computation as input for the next
 * and keeping only the result of the first
 *
 * Returns an IO that effectfully "peeks" at the success of this effect.
 *
 * @tsplus fluent fncts.io.IO tap
 */
export function tap_<R, E, A, R1, E1, B>(
  self: IO<R, E, A>,
  f: (a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string,
): IO<R1 & R, E1 | E, A> {
  return self.flatMap((a) => f(a).map(() => a));
}

/**
 * Returns an IO that effectually "peeks" at the cause of the failure of
 * this IO.
 *
 * @tsplus fluent fncts.io.IO tapCause
 */
export function tapCause_<R2, A2, R, E, E2>(
  ma: IO<R2, E2, A2>,
  f: (e: Cause<E2>) => IO<R, E, any>,
  __tsplusTrace?: string,
): IO<R2 & R, E | E2, A2> {
  return ma.matchCauseIO((c) => f(c).flatMap(() => IO.failCauseNow(c)), IO.succeedNow);
}

/**
 * Returns an IO that effectfully "peeks" at the failure of this effect.
 *
 * @tsplus fluent fncts.io.IO tapError
 */
export function tapError_<R, E, A, R1, E1>(self: IO<R, E, A>, f: (e: E) => IO<R1, E1, any>, __tsplusTrace?: string) {
  return self.matchCauseIO(
    (cause) =>
      cause.failureOrCause.match(
        (e) => f(e).flatMap(() => IO.failCauseNow(cause)),
        (_) => IO.failCauseNow(cause),
      ),
    IO.succeedNow,
  );
}

/**
 * Returns an effect that effectually "peeks" at the cause of the failure of
 * this effect.
 *
 * @tsplus fluent fncts.io.IO tapErrorCause
 */
export function tapErrorCause_<R, E, A, R1, E1>(
  self: IO<R, E, A>,
  f: (e: Cause<E>) => IO<R1, E1, any>,
  __tsplusTrace?: string,
): IO<R & R1, E | E1, A> {
  return self.matchCauseIO((cause) => f(cause).apSecond(IO.failCauseNow(cause)), IO.succeedNow);
}

/**
 * @tsplus fluent fncts.io.IO tryOrElse
 */
export function tryOrElse_<R, E, A, R1, E1, A1, R2, E2, A2>(
  ma: IO<R, E, A>,
  that: Lazy<IO<R1, E1, A1>>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string,
): IO<R & R1 & R2, E1 | E2, A1 | A2> {
  return ma.matchCauseIO((cause) => cause.keepDefects.match(that, IO.failCauseNow), onSuccess);
}

/**
 * @tsplus static fncts.io.IOOps unit
 */
export const unit: UIO<void> = IO.succeedNow(undefined);

/**
 * Converts an option on errors into an option on values.
 *
 * @tsplus getter fncts.io.IO unjust
 */
export function unjust<R, E, A>(self: IO<R, Maybe<E>, A>): IO<R, E, Maybe<A>> {
  return self.matchIO(
    (e) => e.match(() => IO.succeedNow(Nothing()), IO.failNow),
    (a) => IO.succeedNow(Just(a)),
  );
}

/**
 * Takes some fiber failures and converts them into errors, using the
 * specified function to convert the `E` into an `E1 | E2`.
 *
 * @tsplus fluent fncts.io.IO unrefineWith
 */
export function unrefineWith_<R, E, A, E1, E2>(
  fa: IO<R, E, A>,
  pf: (u: unknown) => Maybe<E1>,
  f: (e: E) => E2,
  __tsplusTrace?: string,
): IO<R, E1 | E2, A> {
  return fa.catchAllCause((cause) =>
    cause.find((c) => (c.isHalt() ? pf(c.value) : Nothing())).match(() => IO.failCauseNow(cause.map(f)), IO.failNow),
  );
}

/**
 * The inverse operation `sandbox`
 *
 * @tsplus getter fncts.io.IO unsandbox
 */
export function unsandbox<R, E, A>(ma: IO<R, Cause<E>, A>): IO<R, E, A> {
  return ma.mapErrorCause((cause) => cause.flatten);
}

/**
 * Updates the `FiberRef` values for the fiber running this effect using the
 * specified function
 *
 * @tsplus static fncts.io.IOOps updateFiberRefs
 */
export function updateFiberRefs(
  f: (fiberId: FiberId.Runtime, fiberRefs: FiberRefs) => FiberRefs,
  __tsplusTrace?: string,
): UIO<void> {
  return new FiberRefModifyAll((fiberId, fiberRefs) => [undefined, f(fiberId, fiberRefs)], __tsplusTrace);
}

/**
 * @tsplus fluent fncts.io.IO __call
 */
export const via: typeof pipe = pipe;

/**
 * @tsplus fluent fncts.io.IO when
 */
export function when_<R, E, A>(ma: IO<R, E, A>, b: Lazy<boolean>, __tsplusTrace?: string): IO<R, E, void> {
  return ma.whenIO(IO.succeed(b));
}

/**
 * The moral equivalent of `if (p) exp` when `p` has side-effects
 *
 * @tsplus fluent fncts.io.IO whenIO
 */
export function whenIO_<R, E, A, R1, E1>(ma: IO<R, E, A>, mb: IO<R1, E1, boolean>): IO<R1 & R, E | E1, void> {
  return mb.flatMap((b) => (b ? ma.asUnit : IO.unit));
}

/**
 * Returns an effect that yields to the runtime system, starting on a fresh
 * stack. Manual use of this method can improve fairness, at the cost of
 * overhead.
 *
 * @tsplus static fncts.io.IOOps yieldNow
 */
export const yieldNow: UIO<void> = new Yield();

/**
 * @tsplus fluent fncts.io.IO zip
 */
export function zip_<R, E, A, R1, E1, B>(self: IO<R, E, A>, that: IO<R1, E1, B>): IO<R & R1, E | E1, readonly [A, B]> {
  return self.zipWith(that, tuple);
}

/**
 * @tsplus fluent fncts.io.IO zipWith
 */
export function zipWith_<R, E, A, R1, E1, B, C>(
  self: IO<R, E, A>,
  that: IO<R1, E1, B>,
  f: (a: A, b: B) => C,
): IO<R & R1, E | E1, C> {
  return self.flatMap((a) => that.map((b) => f(a, b)));
}

export class GenIO<R, E, A> {
  readonly _R!: (_R: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => A;

  constructor(readonly effect: IO<R, E, A>, readonly _trace?: string) {}

  *[Symbol.iterator](): Generator<GenIO<R, E, A>, A, any> {
    return yield this;
  }
}

/**
 * @internal
 */
export const __adapter = (_: any) => {
  // if (Either.isEither(_)) {
  //   return IO.fromEither(_);
  // }
  // if (Maybe.isMaybe(_)) {
  //   return __
  //     ? _._tag === "Nothing"
  //       ? IO.failNow(__())
  //       : IO.succeed(_.value)
  //     : getOrFail(_);
  // }
  // if (isTag(_)) {
  //   return service(_);
  // }
  // if (S.isSync(_)) {
  //   return fromSync(_);
  // }
  return _;
};

const adapter = (_: any, __tsplusTrace?: string) => {
  return new GenIO(__adapter(_), __tsplusTrace);
};

/**
 * @tsplus static fncts.io.IOOps gen
 * @gen
 */
export function gen<T extends GenIO<any, any, any>, A>(
  f: (i: { <R, E, A>(_: IO<R, E, A>, __tsplusTrace?: string): GenIO<R, E, A> }) => Generator<T, A, any>,
): IO<_R<T>, _E<T>, A> {
  return IO.defer(() => {
    const iterator = f(adapter as any);
    const state    = iterator.next();

    const run = (state: IteratorYieldResult<T> | IteratorReturnResult<A>): IO<any, any, A> => {
      if (state.done) {
        return IO.succeed(state.value);
      }
      const f = (val: any) => {
        const next = iterator.next(val);
        return run(next);
      };
      return state.value.effect.flatMap(f);
    };

    return run(state);
  });
}
