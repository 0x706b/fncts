import type { Running } from "../FiberStatus.js";
import type * as P from "@fncts/base/typeclass";
import type { _E, _R } from "@fncts/base/types";
import type { FiberRuntime } from "@fncts/io/Fiber/FiberRuntime";
import type { RuntimeFlags } from "@fncts/io/RuntimeFlags";

import { IOError } from "@fncts/base/data/exceptions";
import { identity, pipe, tuple } from "@fncts/base/data/function";
import {
  Async,
  GenerateStackTrace,
  OnSuccess,
  OnSuccessAndFailure,
  Sync,
  UpdateRuntimeFlags,
  YieldNow,
} from "@fncts/io/IO/definition";
import { Stateful } from "@fncts/io/IO/definition";
import { Fail, IO, SucceedNow } from "@fncts/io/IO/definition";

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
  return new Async(register, () => blockingOn, __tsplusTrace);
}

/**
 * Attempts to convert defects into a failure, throwing away all information
 * about the cause of the failure.
 *
 * @tsplus pipeable fncts.io.IO absorbWith
 */
export function absorbWith<R, E, A>(f: (e: E) => unknown, __tsplusTrace?: string) {
  return (ma: IO<R, E, A>): IO<R, unknown, A> =>
    ma.sandbox.matchIO((cause) => IO.failNow(cause.squashWith(f)), IO.succeedNow);
}

/**
 * @tsplus pipeable fncts.io.IO zipLeft
 * @tsplus pipeable-operator fncts.io.IO <
 */
export function zipLeft<R1, E1, B>(fb: IO<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R1 | R, E1 | E, A> => {
    return self.flatMap((a) => fb.map(() => a));
  };
}

/**
 * Combine two effectful actions, keeping only the result of the second
 *
 * @tsplus pipeable fncts.io.IO zipRight
 * @tsplus pipeable-operator fncts.io.IO >
 */
export function zipRight<R1, E1, B>(fb: IO<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R1 | R, E1 | E, B> => {
    return self.flatMap(() => fb);
  };
}

/**
 * @tsplus pipeable fncts.io.IO as
 */
export function as<B>(b: Lazy<B>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R, E, B> => {
    return self.map(() => b());
  };
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
export function asUnit<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, void> {
  return self.as(undefined);
}

/**
 * Returns an IO whose failure and success channels have been mapped by
 * the specified pair of functions, `f` and `g`.
 *
 * @tsplus pipeable fncts.io.IO bimap
 */
export function bimap<E, A, E1, B>(f: (e: E) => E1, g: (a: A) => B, __tsplusTrace?: string) {
  return <R>(self: IO<R, E, A>): IO<R, E1, B> => {
    return self.matchIO(
      (e) => IO.failNow(f(e)),
      (a) => IO.succeedNow(g(a)),
    );
  };
}

/**
 * Returns an IO that effectfully "peeks" at the failure or success of
 * this effect.
 *
 * @tsplus pipeable fncts.io.IO bitap
 */
export function bitap<E, A, R1, E1, R2, E2>(
  onFailure: (e: E) => IO<R1, E1, any>,
  onSuccess: (a: A) => IO<R2, E2, any>,
  __tsplusTrace?: string,
) {
  return <R>(self: IO<R, E, A>): IO<R | R1 | R2, E | E1 | E2, A> => {
    return self.matchCauseIO(
      (cause) =>
        cause.failureOrCause.match(
          (e) => onFailure(e).flatMap(() => IO.failCauseNow(cause)),
          () => IO.failCauseNow(cause),
        ),
      (a) => onSuccess(a).zipRight(IO.succeedNow(a)),
    );
  };
}

/**
 * Recovers from the specified error
 *
 * @tsplus pipeable fncts.io.IO catch
 */
export function catchTagWith<N extends keyof E, K extends E[N] & string, E, R1, E1, A1>(
  tag: N,
  k: K,
  f: (
    e: Extract<
      E,
      {
        [n in N]: K;
      }
    >,
  ) => IO<R1, E1, A1>,
  __tsplusTrace?: string,
) {
  return <R, A>(
    ma: IO<R, E, A>,
  ): IO<
    R | R1,
    | Exclude<
        E,
        {
          [n in N]: K;
        }
      >
    | E1,
    A | A1
  > => {
    return ma.catchAll((e) => {
      if (isObject(e) && tag in e && e[tag] === k) {
        return f(e as any);
      }
      return IO.failNow(e as any);
    });
  };
}

/**
 * Recovers from all errors
 *
 * @tsplus pipeable fncts.io.IO catchAll
 */
export function catchAll<E, R1, E1, A1>(f: (e: E) => IO<R1, E1, A1>, __tsplusTrace?: string) {
  return <R, A>(ma: IO<R, E, A>): IO<R | R1, E1, A | A1> => {
    return ma.matchIO(f, IO.succeedNow);
  };
}

/**
 *
 * Recovers from all errors with provided cause.
 *
 * @tsplus pipeable fncts.io.IO catchAllCause
 */
export function catchAllCause<R, E, A, R1, E1, A1>(f: (_: Cause<E>) => IO<R1, E1, A1>, __tsplusTrace?: string) {
  return (ma: IO<R, E, A>): IO<R | R1, E1, A | A1> => ma.matchCauseIO(f, IO.succeedNow);
}

/**
 * Recovers from some or all of the error cases.
 *
 * @tsplus pipeable fncts.io.IO catchJust
 */
export function catchJust<E, R1, E1, A1>(f: (e: E) => Maybe<IO<R1, E1, A1>>, __tsplusTrace?: string) {
  return <R, A>(ma: IO<R, E, A>): IO<R | R1, E | E1, A | A1> => {
    return ma.matchCauseIO(
      (cause) => cause.failureOrCause.match((e) => f(e).getOrElse(IO.failCauseNow(cause)), IO.failCauseNow),
      IO.succeedNow,
    );
  };
}

/**
 * Recovers from some or all of the error cases with provided cause.
 *
 * @tsplus pipeable fncts.io.IO catchJustCause
 */
export function catchJustCause<E, R1, E1, A1>(f: (_: Cause<E>) => Maybe<IO<R1, E1, A1>>, __tsplusTrace?: string) {
  return <R, A>(ma: IO<R, E, A>): IO<R | R1, E | E1, A | A1> => {
    return ma.matchCauseIO((cause) => f(cause).getOrElse(IO.failCauseNow(cause)), IO.succeedNow);
  };
}

/**
 * Recovers from some or all of the defects with provided partial function.
 *
 * *WARNING*: There is no sensible way to recover from defects. This
 * method should be used only at the boundary between IO and an external
 * system, to transmit information on a defect for diagnostic or explanatory
 * purposes.
 *
 * @tsplus pipeable fncts.io.IO catchJustDefect
 */
export function catchJustDefect<R1, E1, A1>(f: (_: unknown) => Maybe<IO<R1, E1, A1>>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R | R1, E | E1, A | A1> => {
    return ma.unrefineWith(f, IO.failNow).catchAll((a) => a as IO<R | R1, E | E1, A | A1>);
  };
}

/**
 * Recovers from the specified error
 *
 * @tsplus pipeable IO catchTag
 */
export function catchTag<
  K extends E["_tag"] & string,
  E extends {
    _tag: string;
  },
  R1,
  E1,
  A1,
>(
  k: K,
  f: (
    e: Extract<
      E,
      {
        _tag: K;
      }
    >,
  ) => IO<R1, E1, A1>,
  __tsplusTrace?: string,
) {
  return <R, A>(
    ma: IO<R, E, A>,
  ): IO<
    R | R1,
    | Exclude<
        E,
        {
          _tag: K;
        }
      >
    | E1,
    A | A1
  > => {
    return ma.catch("_tag", k, f);
  };
}

/**
 * @tsplus getter fncts.io.IO cause
 */
export function cause<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, never, Cause<E>> {
  return ma.matchCauseIO(IO.succeedNow, () => IO.succeedNow(Cause.empty()));
}

/**
 * @tsplus pipeable fncts.io.IO causeAsError
 */
export function causeAsError(__tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R, Cause<E>, A> => {
    return ma.matchCauseIO(IO.failNow, IO.succeedNow);
  };
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
  return IO.withFiberRuntime((_, status) => f(InterruptStatus.fromBoolean(status.runtimeFlags.interruption)));
}

/**
 * Returns an IO that models the execution of this effect, followed by
 * the passing of its value to the specified continuation function `f`,
 * followed by the effect that it returns.
 *
 * @tsplus pipeable fncts.io.IO flatMap
 */
export function flatMap<A, R1, E1, B>(f: (a: A) => IO<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E>(ma: IO<R, E, A>): IO<R | R1, E | E1, B> => {
    return new OnSuccess(ma, f, __tsplusTrace);
  };
}

/**
 * @tsplus pipeable fncts.io.IO flatMapError
 */
export function flatMapError<R1, E, E1>(f: (e: E) => IO<R1, never, E1>, __tsplusTrace?: string) {
  return <R, A>(ma: IO<R, E, A>): IO<R | R1, E1, A> => {
    return ma.swapWith((effect) => effect.flatMap(f));
  };
}

/**
 * @tsplus pipeable fncts.io.IO collect
 */
export function collect<A, E1, A1>(f: Lazy<E1>, pf: (a: A) => Maybe<A1>, __tsplusTrace?: string) {
  return <R, E>(ma: IO<R, E, A>): IO<R, E | E1, A1> => {
    return ma.collectIO(f, (a) => pf(a).map(IO.succeedNow));
  };
}

/**
 * @tsplus pipeable fncts.io.IO collectIO
 */
export function collectIO<A, R1, E1, A1, E2>(f: Lazy<E2>, pf: (a: A) => Maybe<IO<R1, E1, A1>>, __tsplusTrace?: string) {
  return <R, E>(ma: IO<R, E, A>): IO<R | R1, E | E1 | E2, A1> => {
    return ma.flatMap((a) => pf(a).getOrElse(IO.fail(f)));
  };
}

/**
 * @tsplus static fncts.io.IOOps condIO
 */
export function condIO<R, R1, E, A>(
  b: boolean,
  onTrue: URIO<R, A>,
  onFalse: URIO<R1, E>,
  __tsplusTrace?: string,
): IO<R | R1, E, A> {
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
  return IO.succeed(io).flatMap(identity);
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
      throw new IOError(Cause.fail(u));
    }
  }, __tsplusTrace);
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
  onThrow: (error: unknown) => E1,
  __tsplusTrace?: string,
): IO<R, E | E1, A> {
  return IO.defer(() => {
    try {
      return io();
    } catch (u) {
      throw new IOError(Cause.fail(onThrow(u)));
    }
  });
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
 * @tsplus pipeable fncts.io.IO errorAsCause
 */
export function errorAsCause(__tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, Cause<E>, A>): IO<R, E, A> => {
    return ma.matchIO(IO.failCauseNow, IO.succeedNow);
  };
}

/**
 * @tsplus getter fncts.io.IO eventually
 */
export function eventually<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, never, A> {
  return ma.orElse(ma.eventually);
}

/**
 * @tsplus pipeable fncts.io.IO extend
 */
export function extend<R, E, A, B>(f: (wa: IO<R, E, A>) => B, __tsplusTrace?: string) {
  return (wa: IO<R, E, A>): IO<R, E, B> => {
    return wa.matchIO(IO.failNow, (_) => IO.succeed(f(wa)));
  };
}

/**
 * @tsplus static fncts.io.IOOps fail
 */
export function fail<E>(e: Lazy<E>, __tsplusTrace?: string): FIO<E, never> {
  return IO.failCause(Cause.fail(e()));
}

/**
 * @tsplus static fncts.io.IOOps failNow
 */
export function failNow<E>(e: E, __tsplusTrace?: string): FIO<E, never> {
  return IO.failCause(Cause.fail(e));
}

/**
 * @tsplus static fncts.io.IOOps refailCause
 */
export function refailCause<E>(cause: Cause<E>, __tsplusTrace?: string): FIO<E, never> {
  return new Fail(() => cause, __tsplusTrace);
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
  return IO.stackTrace(__tsplusTrace).flatMap((trace) => IO.refailCause(Cause.traced(cause(), trace)));
}

/**
 * Returns the `FiberId` of the `Fiber` on which this `IO` is running
 *
 * @tsplus static fncts.io.IOOps fiberId
 */
export const fiberId: IO<never, never, FiberId> = IO.fiberIdWith((id) => IO.succeedNow(id));

/**
 * @tsplus static fncts.io.IOOps fiberIdWith
 */
export function fiberIdWith<R, E, A>(f: (id: FiberId.Runtime) => IO<R, E, A>): IO<R, E, A> {
  return IO.withFiberRuntime((fiber) => f(fiber.id));
}

/**
 * Filters the collection using the specified effectual predicate.
 *
 * @tsplus static fncts.io.IOOps filter
 */
export function filter<A, R, E>(
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
export function filterMap<A, R, E, B>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, Maybe<B>>,
  __tsplusTrace?: string,
): IO<R, E, Conc<B>> {
  return IO.filterMapWithIndex(as, (_, a) => f(a));
}

/**
 * @tsplus static fncts.io.IOOps filterMapWithIndex
 */
export function filterMapWithIndex<A, R, E, B>(
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
export function filterNot<A, R, E>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, boolean>,
  __tsplusTrace?: string,
): IO<R, E, Conc<A>> {
  return IO.filter(as, (a) => f(a).map((b) => !b));
}

/**
 * Applies `or` if the predicate fails.
 *
 * @tsplus pipeable fncts.io.IO filterOrElse
 */
export function filterOrElse<A, B extends A, R1, E1, A1>(
  refinement: Refinement<A, B>,
  or: (a: Exclude<A, B>) => IO<R1, E1, A1>,
  __tsplusTrace?: string,
): <R, E>(fa: IO<R, E, A>) => IO<R | R1, E | E1, B | A1>;
export function filterOrElse<A, R1, E1, A1>(
  predicate: Predicate<A>,
  or: (a: A) => IO<R1, E1, A1>,
  __tsplusTrace?: string,
): <R, E>(fa: IO<R, E, A>) => IO<R | R1, E | E1, A | A1>;
export function filterOrElse<A>(predicate: Predicate<A>, or: unknown, __tsplusTrace?: string) {
  return <R, E, R1, E1, A1>(fa: IO<R, E, A>): IO<R | R1, E | E1, A | A1> => {
    return fa.flatMap(
      (a): IO<R1, E1, A | A1> => (predicate(a) ? IO.succeedNow(a) : IO.defer((or as (a: A) => IO<R1, E1, A1>)(a))),
    );
  };
}

/**
 * Fails with `failWith` if the predicate fails.
 *
 * @tsplus pipeable fncts.io.IO filterOrFail
 */
export function filterOrFail<A, B extends A, E1>(
  refinement: Refinement<A, B>,
  failWith: (a: Exclude<A, B>) => E1,
): <R, E>(fa: IO<R, E, A>) => IO<R, E | E1, B>;
export function filterOrFail<A, E1>(
  predicate: Predicate<A>,
  failWith: (a: A) => E1,
): <R, E>(fa: IO<R, E, A>) => IO<R, E | E1, A>;
export function filterOrFail<A>(predicate: Predicate<A>, failWith: unknown, __tsplusTrace?: string) {
  return <R, E, E1>(fa: IO<R, E, A>): IO<R, E | E1, A> => {
    return fa.filterOrElse(predicate, (a) => IO.failNow((failWith as (a: A) => E1)(a)));
  };
}

/**
 * Returns an `IO` that yields the value of the first
 * `IO` to succeed.
 *
 * @tsplus static fncts.io.IOOps firstSuccess
 */
export function firstSuccess<R, E, A>(mas: NonEmptyArray<IO<R, E, A>>, __tsplusTrace?: string): IO<R, E, A> {
  return mas.reduce((b, a) => b.orElse(a));
}

/**
 * Halts with specified `unknown` if the predicate fails.
 *
 * @tsplus pipeable fncts.io.IO filterOrHalt
 */
export function filterOrHalt<A, B extends A>(
  refinement: Refinement<A, B>,
  haltWith: (a: Exclude<A, B>) => unknown,
  __tsplusTrace?: string,
): <R, E>(fa: IO<R, E, A>) => IO<R, E, A>;
export function filterOrHalt<A>(
  predicate: Predicate<A>,
  haltWith: (a: A) => unknown,
  __tsplusTrace?: string,
): <R, E>(fa: IO<R, E, A>) => IO<R, E, A>;
export function filterOrHalt<A>(predicate: Predicate<A>, haltWith: unknown, __tsplusTrace?: string) {
  return <R, E>(fa: IO<R, E, A>): IO<R, E, A> => {
    return fa.filterOrElse(predicate, (a) => IO.haltNow((haltWith as (a: A) => unknown)(a)));
  };
}

/**
 * @tsplus getter fncts.io.IO flatten
 */
export function flatten<R, E, R1, E1, A>(self: IO<R, E, IO<R1, E1, A>>, __tsplusTrace?: string): IO<R | R1, E | E1, A> {
  return self.flatMap(identity);
}

/**
 * Folds an `Iterable<A>` using an effectful function f, working sequentially from left to right.
 *
 * @tsplus static fncts.io.IOOps foldLeft
 */
export function foldLeft<A, B, R, E>(
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
 * @tsplus static fncts.io.IOOps foldMap
 */
export function foldMap<R, E, A, M>(
  as: Iterable<IO<R, E, A>>,
  f: (a: A) => M,
  /** @tsplus auto */ M: P.Monoid<M>,
): IO<R, E, M> {
  return IO.foldLeft(as, M.nat, (m, a) => a.map((a) => M.combine(f(a))(m)));
}

function foldRightLoop<A, B, R, E>(
  iterator: Iterator<A>,
  b: UIO<B>,
  f: (a: A, b: IO<R, E, B>) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, B> {
  const next = iterator.next();
  return next.done ? b : f(next.value, foldRightLoop(iterator, b, f));
}

/**
 * Performs a right-associative fold of an `Iterable<A>`
 *
 * @tsplus static fncts.io.IOOps foldRight
 */
export function foldRight<A, B, R, E>(
  as: Iterable<A>,
  b: UIO<B>,
  f: (a: A, b: IO<R, E, B>) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, B> {
  return foldRightLoop(as[Symbol.iterator](), b, f);
}

function foreachWithIndexDiscardLoop<A, R, E, B>(
  iterator: Iterator<A>,
  f: (i: number, a: A) => IO<R, E, B>,
  i = 0,
  __tsplusTrace?: string,
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
export function foreach<A, R, E, B>(
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
export function foreachWithIndex<A, R, E, B>(
  as: Iterable<A>,
  f: (i: number, a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, Conc<B>> {
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
export function foreachWithIndexDiscard<A, R, E, B>(
  as: Iterable<A>,
  f: (i: number, a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, void> {
  return IO.defer(foreachWithIndexDiscardLoop(as[Symbol.iterator](), f));
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and runs
 * produced IOs sequentially.
 *
 * @tsplus static fncts.io.IOOps foreachDiscard
 */
export function foreachDiscard<A, R, E, B>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, void> {
  return IO.defer(foreachWithIndexDiscardLoop(as[Symbol.iterator](), (_, a) => f(a)));
}

/**
 * Repeats this effect forever (until the first failure).
 *
 * @tsplus getter fncts.io.IO forever
 */
export function forever<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, never> {
  return ma.zipRight(IO.yieldNow).flatMap(() => ma.forever);
}

/**
 * Lifts an `Either` into an `IO`
 *
 * @tsplus static fncts.io.IOOps fromEither
 */
export function fromEither<E, A>(either: Lazy<Either<E, A>>, __tsplusTrace?: string): IO<never, E, A> {
  return IO.succeed(either).flatMap((ea) => ea.match(IO.failNow, IO.succeedNow));
}

/**
 * Lifts an `Either` into an `IO`
 *
 * @tsplus static fncts.io.IOOps fromEitherNow
 * @tsplus getter fncts.Either toIO
 */
export function fromEitherNow<E, A>(either: Either<E, A>, __tsplusTrace?: string): IO<never, E, A> {
  return either.match(IO.failNow, IO.succeedNow);
}

/**
 * Lifts an `Eval` into an `IO`
 *
 * @tsplus static fncts.io.IOOps fromEval
 * @tsplus getter fncts.Eval toIO
 */
export function fromEval<A>(computation: Eval<A>, __tsplusTrace?: string): IO<never, never, A> {
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
 * @tsplus getter fncts.Exit toIO
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
 * @tsplus getter fncts.Maybe toIO
 */
export function fromMaybeNow<A = never>(maybe: Maybe<A>, __tsplusTrace?: string): IO<never, NoSuchElementError, A> {
  return maybe.match(() => IO.failNow(new NoSuchElementError("IO.fromMaybeNow")), IO.succeedNow);
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
export function get<R, E, A>(ma: IO<R, E, Maybe<A>>, __tsplusTrace?: string): IO<R, Maybe<E>, A> {
  return ma.matchCauseIO(
    (cause) => IO.failCauseNow(cause.map(Maybe.just)),
    (ma) => ma.match(() => IO.failNow(Nothing()), IO.succeedNow),
  );
}

/**
 * Extracts the optional value, or returns the given 'orElse'.
 *
 * @tsplus pipeable fncts.io.IO getOrElse
 */
export function getOrElse<B>(orElse: Lazy<B>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, Maybe<A>>): IO<R, E, A | B> => {
    return ma.map((ma) => ma.getOrElse(orElse));
  };
}

/**
 * Extracts the optional value, or executes the effect 'orElse'.
 *
 * @tsplus pipeable fncts.io.IO getOrElseIO
 */
export function getOrElseIO<R1, E1, B>(orElse: Lazy<IO<R1, E1, B>>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, Maybe<A>>): IO<R | R1, E | E1, A | B> => {
    return (ma as IO<R, E, Maybe<A | B>>).flatMap((mab) => mab.map(IO.succeedNow).getOrElse(orElse));
  };
}

/**
 * Lifts a Maybe into an IO. If the option is `Nothing`, fail with `onNothing`.
 *
 * @tsplus static fncts.io.IOOps getOrFailWith
 */
export function getOrFailWith<E, A>(maybe: Maybe<A>, onNothing: Lazy<E>, __tsplusTrace?: string): FIO<E, A> {
  return IO.defer(maybe.match(() => IO.fail(onNothing), IO.succeedNow));
}

/**
 * Lifts a Maybe into a IO, if the Maybe is `Nothing` it fails with Unit.
 *
 * @tsplus static fncts.io.IOOps getOrFailUnit
 */
export function getOrFailUnit<A>(option: Maybe<A>, __tsplusTrace?: string): FIO<void, A> {
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
 * @tsplus pipeable fncts.io.IO ifIO
 */
export function ifIO<R1, E1, B, R2, E2, C>(
  onFalse: Lazy<IO<R1, E1, B>>,
  onTrue: Lazy<IO<R2, E2, C>>,
  __tsplusTrace?: string,
) {
  return <R, E>(self: IO<R, E, boolean>): IO<R | R1 | R2, E | E1 | E2, B | C> => {
    return self.flatMap((b) => (b ? onTrue() : onFalse()));
  };
}

/**
 * @tsplus static fncts.io.IOOps if
 */
export function cond<R, E, A, R1, E1, A1>(
  b: boolean,
  onTrue: Lazy<IO<R, E, A>>,
  onFalse: Lazy<IO<R1, E1, A1>>,
  __tsplusTrace?: string,
): IO<R | R1, E | E1, A | A1> {
  return IO.succeedNow(b).ifIO(onTrue, onFalse);
}

/**
 * @tsplus getter fncts.io.IO ignore
 */
export function ignore<R, E, A>(fa: IO<R, E, A>, __tsplusTrace?: string): URIO<R, void> {
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
export function isFailure<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, never, boolean> {
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
export function isSuccess<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, never, boolean> {
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
export function iterate<R, E, A>(
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
export function left<A>(a: Lazy<A>, __tsplusTrace?: string): UIO<Either<A, never>> {
  return IO.succeed(a).flatMap((a) => IO.succeedNow(Either.left(a)));
}

/**
 * @tsplus getter fncts.io.IO just
 */
export function just<R, E, A>(self: IO<R, E, Maybe<A>>): IO<R, Maybe<E>, A> {
  return self.matchIO(
    (e) => IO.fail(Just(e)),
    (a) => a.match(() => IO.fail(Nothing()), IO.succeedNow),
  );
}

/**
 * @tsplus static fncts.io.IOOps log
 */
export function log(message: Lazy<string>, __tsplusTrace?: string): UIO<void> {
  return IO.withFiberRuntime((fiber) => {
    fiber.log(message, Cause.empty(), Nothing(), __tsplusTrace);
    return IO.unit;
  });
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
export function loop<A, R, E, B>(
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
export function loopUnit<A, R, E>(
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
 * @tsplus pipeable fncts.io.IO map
 */
export function map<A, B>(f: (a: A) => B, __tsplusTrace?: string) {
  return <R, E>(fa: IO<R, E, A>): IO<R, E, B> => {
    return fa.flatMap((a) => IO.succeedNow(f(a)));
  };
}

/**
 * Map covariantly over the first argument.
 *
 * Returns an IO with its error channel mapped using the specified
 * function. This can be used to lift a "smaller" error into a "larger"
 * error.
 *
 * @tsplus pipeable fncts.io.IO mapError
 */
export function mapError<E, E1>(f: (e: E) => E1, __tsplusTrace?: string) {
  return <R, A>(fea: IO<R, E, A>): IO<R, E1, A> => {
    return fea.matchCauseIO((cause) => IO.failCauseNow(cause.map(f)), IO.succeedNow);
  };
}

/**
 * @tsplus static fncts.io.IOOps mapTryCatch
 */
export function mapTryCatch<R, E, A, E1, B>(
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
 * @tsplus pipeable fncts.io.IO mapErrorCause
 */
export function mapErrorCause<E, E1>(f: (cause: Cause<E>) => Cause<E1>, __tsplusTrace?: string) {
  return <R, A>(ma: IO<R, E, A>): IO<R, E1, A> => {
    return ma.matchCauseIO((cause) => IO.failCauseNow(f(cause)), IO.succeedNow);
  };
}

/**
 * A more powerful version of `match_` that allows recovering from any kind of failure except interruptions.
 *
 * @tsplus pipeable fncts.io.IO matchCause
 */
export function matchCause<E, A, A1, A2>(
  onFailure: (cause: Cause<E>) => A1,
  onSuccess: (a: A) => A2,
  __tsplusTrace?: string,
) {
  return <R>(self: IO<R, E, A>): IO<R, never, A1 | A2> => {
    return self.matchCauseIO(
      (cause) => IO.succeedNow(onFailure(cause)),
      (a) => IO.succeedNow(onSuccess(a)),
    );
  };
}

/**
 * A more powerful version of `matchIO` that allows recovering from any kind of failure except interruptions.
 *
 * @tsplus pipeable fncts.io.IO matchCauseIO
 */
export function matchCauseIO<E, A, R1, E1, A1, R2, E2, A2>(
  onFailure: (cause: Cause<E>) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string,
) {
  return <R>(self: IO<R, E, A>): IO<R | R1 | R2, E1 | E2, A1 | A2> => {
    return new OnSuccessAndFailure(self, onFailure, onSuccess, __tsplusTrace);
  };
}

/**
 * @tsplus pipeable fncts.io.IO matchIO
 */
export function matchIO<R1, R2, E, E1, E2, A, A1, A2>(
  onFailure: (e: E) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string,
) {
  return <R>(self: IO<R, E, A>): IO<R | R1 | R2, E1 | E2, A1 | A2> => {
    return self.matchCauseIO((cause) => cause.failureOrCause.match(onFailure, IO.failCauseNow), onSuccess);
  };
}

/**
 * Folds over the failure value or the success value to yield an IO that
 * does not fail, but succeeds with the value returned by the left or right
 * function passed to `match_`.
 *
 * @tsplus pipeable fncts.io.IO match
 */
export function match<E, A, B, C>(onFailure: (e: E) => B, onSuccess: (a: A) => C, __tsplusTrace?: string) {
  return <R>(self: IO<R, E, A>): IO<R, never, B | C> => {
    return self.matchIO(
      (e) => IO.succeedNow(onFailure(e)),
      (a) => IO.succeedNow(onSuccess(a)),
    );
  };
}

/**
 * A version of `matchIO` that gives you the (optional) trace of the error.
 *
 * @tsplus pipeable fncts.io.IO matchTraceIO
 */
export function matchTraceIO<E, A, R1, E1, A1, R2, E2, A2>(
  onFailure: (e: E, trace: Trace) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string,
) {
  return <R>(ma: IO<R, E, A>): IO<R | R1 | R2, E1 | E2, A1 | A2> => {
    return ma.matchCauseIO(
      (cause) => cause.failureTraceOrCause.match(([e, trace]) => onFailure(e, trace), IO.failCauseNow),
      onSuccess,
    );
  };
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
export function mergeAll<R, E, A, B>(
  fas: Iterable<IO<R, E, A>>,
  b: B,
  f: (b: B, a: A) => B,
  __tsplusTrace?: string,
): IO<R, E, B> {
  return fas.foldLeft(IO.succeed(b) as IO<R, E, B>, (b, a) => b.zipWith(a, f));
}

/**
 * @tsplus static fncts.io.IOOps nothing
 */
export const nothing = IO.succeedNow(Nothing());

/**
 * Converts an option on errors into an option on values.
 *
 * @tsplus getter fncts.io.IO optional
 */
export function optional<R, E, A>(ma: IO<R, Maybe<E>, A>, __tsplusTrace?: string): IO<R, E, Maybe<A>> {
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
 * @tsplus pipeable fncts.io.IO or
 * @tsplus pipeable-operator fncts.io.IO ||
 */
export function or<R1, E1>(mb: IO<R1, E1, boolean>, __tsplusTrace?: string) {
  return <R, E>(ma: IO<R, E, boolean>): IO<R | R1, E | E1, boolean> => {
    return ma.flatMap((b) => (b ? IO.succeedNow(true) : mb));
  };
}

/**
 * @tsplus pipeable fncts.io.IO orElse
 */
export function orElse<R1, E1, A1>(that: Lazy<IO<R1, E1, A1>>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R | R1, E1, A | A1> => {
    return ma.tryOrElse(that, IO.succeedNow);
  };
}

/**
 * @tsplus pipeable fncts.io.IO orElseEither
 */
export function orElseEither<R1, E1, A1>(that: Lazy<IO<R1, E1, A1>>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R | R1, E1, Either<A, A1>> => {
    return self.tryOrElse(that().map(Either.right), (a) => IO.succeedNow(Either.left(a)));
  };
}

/**
 * @tsplus pipeable fncts.io.IO orElseFail
 */
export function orElseFail<E1>(e: Lazy<E1>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R, E1, A> => {
    return ma.orElse(IO.fail(e));
  };
}

/**
 * @tsplus pipeable fncts.io.IO orElseMaybe
 */
export function orElseMaybe<R1, E1, A1>(that: Lazy<IO<R1, Maybe<E1>, A1>>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, Maybe<E>, A>): IO<R | R1, Maybe<E | E1>, A | A1> => {
    return ma.catchAll((me) => me.match(that, (e) => IO.fail(Just(e))));
  };
}

/**
 * @tsplus pipeable fncts.io.IO orElseSucceed
 */
export function orElseSucceed<A1>(a: Lazy<A1>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R, E, A | A1> => {
    return ma.orElse(IO.succeed(a));
  };
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
export function orHaltKeep<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, never, A> {
  return ma.matchCauseIO((cause) => IO.failCauseNow(cause.flatMap(Cause.halt)), IO.succeedNow);
}

/**
 * @tsplus pipeable fncts.io.IO orHaltWith
 */
export function orHaltWith<E>(f: (e: E) => unknown, __tsplusTrace?: string) {
  return <R, A>(ma: IO<R, E, A>): IO<R, never, A> => {
    return ma.matchIO((e) => IO.haltNow(f(e)), IO.succeedNow);
  };
}

/**
 * Exposes all parallel errors in a single call
 *
 * @tsplus pipeable fncts.io.IO concurrentErrors
 */
export function concurrentErrors(__tsplusTrace?: string) {
  return <R, E, A>(io: IO<R, E, A>): IO<R, List<E>, A> => {
    return io.matchCauseIO((cause) => {
      const f = cause.failures;
      if (f.length === 0) {
        return IO.failCauseNow(cause as Cause<never>);
      } else {
        return IO.failNow(f);
      }
    }, IO.succeedNow);
  };
}

/**
 * Feeds elements of type `A` to a function `f` that returns an IO.
 * Collects all successes and failures in a separated fashion.
 *
 * @tsplus static fncts.io.IOOps partition
 */
export function partition<R, E, A, B>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, never, readonly [Conc<E>, Conc<B>]> {
  return IO.foreach(as, (a) => f(a).either).map((c) => c.separate);
}

/**
 * Keeps some of the errors, and terminates the fiber with the rest
 *
 * @tsplus pipeable fncts.io.IO refineOrHalt
 */
export function refineOrHalt<E, E1>(pf: (e: E) => Maybe<E1>, __tsplusTrace?: string) {
  return <R, A>(fa: IO<R, E, A>): IO<R, E1, A> => {
    return fa.refineOrHaltWith(pf, identity);
  };
}

/**
 * Keeps some of the errors, and terminates the fiber with the rest, using
 * the specified function to convert the `E` into a `Throwable`.
 *
 * @tsplus pipeable fncts.io.IO refineOrHaltWith
 */
export function refineOrHaltWith<E, E1>(pf: (e: E) => Maybe<E1>, f: (e: E) => unknown, __tsplusTrace?: string) {
  return <R, A>(fa: IO<R, E, A>): IO<R, E1, A> => {
    return fa.catchAll((e) => pf(e).match(() => IO.haltNow(f(e)), IO.failNow));
  };
}

/**
 * Fail with the returned value if the partial function `pf` matches, otherwise
 * continue with the held value.
 *
 * @tsplus pipeable fncts.io.IO reject
 */
export function reject<A, E1>(pf: (a: A) => Maybe<E1>, __tsplusTrace?: string) {
  return <R, E>(fa: IO<R, E, A>): IO<R, E | E1, A> => {
    return fa.rejectIO((a) => pf(a).map(IO.failNow));
  };
}

/**
 * Continue with the returned computation if the partial function `pf` matches,
 * translating the successful match into a failure, otherwise continue with
 * the held value.
 *
 * @tsplus pipeable fncts.io.IO rejectIO
 */
export function rejectIO<A, R1, E1>(pf: (a: A) => Maybe<IO<R1, E1, E1>>, __tsplusTrace?: string) {
  return <R, E>(fa: IO<R, E, A>): IO<R | R1, E | E1, A> => {
    return fa.flatMap((a) =>
      pf(a).match(
        () => IO.succeedNow(a),
        (io) => io.flatMap(IO.failNow),
      ),
    );
  };
}

/**
 * Repeats this effect the specified number of times.
 *
 * @tsplus pipeable fncts.io.IO repeatN
 */
export function repeatN_(n: number, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R, E, A> => {
    return ma.flatMap((a) => (n <= 0 ? IO.succeed(a) : ma.repeatN(n - 1)));
  };
}

/**
 * Repeats this effect until its result satisfies the specified predicate.
 *
 * @tsplus pipeable fncts.io.IO repeatUntil
 */
export function repeatUntil<A>(f: (a: A) => boolean, __tsplusTrace?: string) {
  return <R, E>(ma: IO<R, E, A>): IO<R, E, A> => {
    return ma.repeatUntilIO((a) => IO.succeedNow(f(a)));
  };
}

/**
 * Repeats this effect until its error satisfies the specified effectful predicate.
 *
 * @tsplus pipeable fncts.io.IO repeatUntilIO
 */
export function repeatUntilIO<A, R1, E1>(f: (a: A) => IO<R1, E1, boolean>, __tsplusTrace?: string) {
  return <R, E>(ma: IO<R, E, A>): IO<R | R1, E | E1, A> => {
    return ma.flatMap((a) => f(a).flatMap((b) => (b ? IO.succeed(a) : ma.repeatUntilIO(f))));
  };
}

/**
 * Repeats this effect while its error satisfies the specified predicate.
 *
 * @tsplus pipeable fncts.io.IO repeatWhile
 */
export function repeatWhile<A>(f: (a: A) => boolean, __tsplusTrace?: string) {
  return <R, E>(ma: IO<R, E, A>): IO<R, E, A> => {
    return ma.repeatWhileIO((a) => IO.succeedNow(f(a)));
  };
}

/**
 * Repeats this effect while its error satisfies the specified effectful predicate.
 *
 * @tsplus pipeable fncts.io.IO repeatWhileIO
 */
export function repeatWhileIO<A, R1, E1>(f: (a: A) => IO<R1, E1, boolean>, __tsplusTrace?: string) {
  return <R, E>(ma: IO<R, E, A>): IO<R | R1, E | E1, A> => {
    return ma.flatMap((a) => f(a).flatMap((b) => (b ? ma.repeatWhileIO(f) : IO.succeed(a))));
  };
}

/**
 * @tsplus pipeable fncts.io.IO replicate
 */
export function replicate(n: number, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): ImmutableArray<IO<R, E, A>> => {
    return ImmutableArray.range(0, n).map(() => self);
  };
}

/**
 * @tsplus pipeable fncts.io.IO require
 */
export function require<E>(error: Lazy<E>, __tsplusTrace?: string) {
  return <R, A>(ma: IO<R, E, Maybe<A>>): IO<R, E, A> => {
    return ma.flatMap((ma) => ma.match(() => IO.fail(error), IO.succeedNow));
  };
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
export function resurrect<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, unknown, A> {
  return io.unrefineWith(Maybe.just, identity);
}

/**
 * Retries this effect until its error satisfies the specified predicate.
 *
 * @tsplus pipeable fncts.io.IO retryUntil
 */
export function retryUntil<E>(f: (e: E) => boolean, __tsplusTrace?: string) {
  return <R, A>(fa: IO<R, E, A>): IO<R, E, A> => {
    return fa.retryUntilIO((e) => IO.succeedNow(f(e)));
  };
}

/**
 * Retries this effect until its error satisfies the specified effectful predicate.
 *
 * @tsplus pipeable fncts.io.IO retryUntilIO
 */
export function retryUntilIO<E, R1, E1>(f: (e: E) => IO<R1, E1, boolean>, __tsplusTrace?: string) {
  return <R, A>(fa: IO<R, E, A>): IO<R | R1, E | E1, A> => {
    return fa.catchAll((e) => f(e).flatMap((b) => (b ? IO.failNow(e) : fa.retryUntilIO(f))));
  };
}

/**
 * Retries this effect while its error satisfies the specified predicate.
 *
 * @tsplus pipeable fncts.io.IO retryWhile
 */
export function retryWhile<E>(f: (e: E) => boolean, __tsplusTrace?: string) {
  return <R, A>(fa: IO<R, E, A>): IO<R, E, A> => {
    return fa.retryWhileIO((e) => IO.succeedNow(f(e)));
  };
}

/**
 * Retries this effect while its error satisfies the specified effectful predicate.
 *
 * @tsplus pipeable fncts.io.IO retryWhileIO
 */
export function retryWhileIO<E, R1, E1>(f: (e: E) => IO<R1, E1, boolean>, __tsplusTrace?: string) {
  return <R, A>(fa: IO<R, E, A>): IO<R | R1, E | E1, A> => {
    return fa.catchAll((e) => f(e).flatMap((b) => (b ? fa.retryWhileIO(f) : IO.fail(e))));
  };
}

/**
 * Exposes the full cause of failure of this effect.
 *
 * @tsplus getter fncts.io.IO sandbox
 */
export function sandbox<R, E, A>(fa: IO<R, E, A>, __tsplusTrace?: string): IO<R, Cause<E>, A> {
  return fa.matchCauseIO(IO.failNow, IO.succeedNow);
}

/**
 * @tsplus pipeable fncts.io.IO sandboxWith
 */
export function sandboxWith<R, E, A, E1>(f: (_: IO<R, Cause<E>, A>) => IO<R, Cause<E1>, A>, __tsplusTrace?: string) {
  return (ma: IO<R, E, A>): IO<R, E1, A> => {
    return f(ma.sandbox).unsandbox;
  };
}

/**
 * @tsplus static fncts.io.IOOps sequenceIterable
 */
export function sequenceIterable<R, E, A>(as: Iterable<IO<R, E, A>>, __tsplusTrace?: string): IO<R, E, Conc<A>> {
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
export function succeedNow<A>(value: A, __tsplusTrace?: string): IO<never, never, A> {
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
  return new Sync(effect, __tsplusTrace);
}

/**
 * @tsplus pipeable fncts.io.IO summarized
 */
export function summarized<R1, E1, B, C>(summary: IO<R1, E1, B>, f: (start: B, end: B) => C, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R | R1, E | E1, readonly [C, A]> => {
    return gen(function* (_) {
      const start = yield* _(summary);
      const value = yield* _(ma);
      const end   = yield* _(summary);
      return tuple(f(start, end), value);
    });
  };
}

/**
 * Swaps the positions of a Bifunctor's arguments
 *
 * @tsplus getter fncts.io.IO swap
 */
export function swap<R, E, A>(pab: IO<R, E, A>, __tsplusTrace?: string): IO<R, A, E> {
  return pab.matchIO(IO.succeedNow, IO.failNow);
}

/**
 * Swaps the error/value parameters, applies the function `f` and flips the parameters back
 *
 * @tsplus pipeable fncts.io.IO swapWith
 */
export function swapWith<R, E, A, R1, E1, A1>(f: (ma: IO<R, A, E>) => IO<R1, A1, E1>, __tsplusTrace?: string) {
  return (fa: IO<R, E, A>): IO<R1, E1, A1> => f(fa.swap).swap;
}

/**
 * A more powerful variation of `timed` that allows specifying the clock.
 *
 * @tsplus pipeable fncts.io.IO timedWith
 */
export function timedWith<R1, E1>(msTime: IO<R1, E1, number>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R1 | R, E1 | E, readonly [number, A]> =>
    ma.summarized(msTime, (start, end) => end - start);
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
      throw new IOError(Cause.fail(onThrow(u)));
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
 * @tsplus pipeable fncts.io.IO tap
 */
export function tap<A, R1, E1, B>(f: (a: A) => IO<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E>(self: IO<R, E, A>): IO<R1 | R, E1 | E, A> => {
    return self.flatMap((a) => f(a).map(() => a));
  };
}

/**
 * Returns an IO that effectually "peeks" at the cause of the failure of
 * this IO.
 *
 * @tsplus pipeable fncts.io.IO tapCause
 */
export function tapCause<R, E, E2>(f: (e: Cause<E2>) => IO<R, E, any>, __tsplusTrace?: string) {
  return <R2, A2>(ma: IO<R2, E2, A2>): IO<R2 | R, E | E2, A2> => {
    return ma.matchCauseIO((c) => f(c).flatMap(() => IO.failCauseNow(c)), IO.succeedNow);
  };
}

/**
 * Returns an IO that effectfully "peeks" at the failure of this effect.
 *
 * @tsplus pipeable fncts.io.IO tapError
 */
export function tapError<E, R1, E1>(f: (e: E) => IO<R1, E1, any>, __tsplusTrace?: string) {
  return <R, A>(self: IO<R, E, A>) =>
    self.matchCauseIO(
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
 * @tsplus pipeable fncts.io.IO tapErrorCause
 */
export function tapErrorCause<E, R1, E1>(f: (e: Cause<E>) => IO<R1, E1, any>, __tsplusTrace?: string) {
  return <R, A>(self: IO<R, E, A>): IO<R | R1, E | E1, A> => {
    return self.matchCauseIO((cause) => f(cause).zipRight(IO.failCauseNow(cause)), IO.succeedNow);
  };
}

/**
 * @tsplus pipeable fncts.io.IO tryOrElse
 */
export function tryOrElse<A, R1, E1, A1, R2, E2, A2>(
  that: Lazy<IO<R1, E1, A1>>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string,
) {
  return <R, E>(ma: IO<R, E, A>): IO<R | R1 | R2, E1 | E2, A1 | A2> => {
    return ma.matchCauseIO((cause) => cause.keepDefects.match(that, IO.failCauseNow), onSuccess);
  };
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
export function unjust<R, E, A>(self: IO<R, Maybe<E>, A>, __tsplusTrace?: string): IO<R, E, Maybe<A>> {
  return self.matchIO(
    (e) => e.match(() => IO.succeedNow(Nothing()), IO.failNow),
    (a) => IO.succeedNow(Just(a)),
  );
}

/**
 * Takes some fiber failures and converts them into errors, using the
 * specified function to convert the `E` into an `E1 | E2`.
 *
 * @tsplus pipeable fncts.io.IO unrefineWith
 */
export function unrefineWith<E, E1, E2>(pf: (u: unknown) => Maybe<E1>, f: (e: E) => E2, __tsplusTrace?: string) {
  return <R, A>(fa: IO<R, E, A>): IO<R, E1 | E2, A> => {
    return fa.catchAllCause((cause) =>
      cause.find((c) => (c.isHalt() ? pf(c.value) : Nothing())).match(() => IO.failCauseNow(cause.map(f)), IO.failNow),
    );
  };
}

/**
 * The inverse operation `sandbox`
 *
 * @tsplus getter fncts.io.IO unsandbox
 */
export function unsandbox<R, E, A>(ma: IO<R, Cause<E>, A>, __tsplusTrace?: string): IO<R, E, A> {
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
  return IO.withFiberRuntime((state) => {
    state.setFiberRefs(f(state.id, state.getFiberRefs()));
    return IO.unit;
  });
}

/**
 * @tsplus fluent fncts.io.IO __call
 */
export const via: typeof pipe = pipe;

/**
 * @tsplus pipeable fncts.io.IO when
 */
export function when(b: Lazy<boolean>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R, E, void> => {
    return ma.whenIO(IO.succeed(b));
  };
}

/**
 * The moral equivalent of `if (p) exp` when `p` has side-effects
 *
 * @tsplus pipeable fncts.io.IO whenIO
 * @tsplus static fncts.io.IOOps whenIO
 */
export function whenIO<R1, E1>(mb: IO<R1, E1, boolean>, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R1 | R, E | E1, Maybe<A>> => {
    return mb.flatMap((b) => (b ? ma.asJust : IO.nothing));
  };
}

/**
 * @tsplus static fncts.io.IOOps withFiberRuntime
 */
export function withFiberRuntime<R, E, A>(
  onState: (fiber: FiberRuntime<E, A>, status: Running) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return new Stateful(onState, __tsplusTrace);
}

/**
 * @tsplus static fncts.io.IOOps updateRuntimeFlags
 */
export function updateRuntimeFlags(patch: RuntimeFlags.Patch, __tsplusTrace?: string): IO<never, never, void> {
  return new UpdateRuntimeFlags(patch, __tsplusTrace);
}

/**
 * @tsplus static fncts.io.IOOps stackTrace
 */
export function stackTrace(__tsplusTrace?: string): UIO<Trace> {
  return new GenerateStackTrace(__tsplusTrace);
}

/**
 * Returns an effect that yields to the runtime system, starting on a fresh
 * stack. Manual use of this method can improve fairness, at the cost of
 * overhead.
 *
 * @tsplus static fncts.io.IOOps yieldNow
 */
export const yieldNow: UIO<void> = new YieldNow();

/**
 * @tsplus pipeable fncts.io.IO zip
 */
export function zip<R1, E1, B>(that: IO<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R | R1, E | E1, readonly [A, B]> => {
    return self.zipWith(that, tuple);
  };
}

/**
 * @tsplus pipeable fncts.io.IO zipWith
 */
export function zipWith<A, R1, E1, B, C>(that: IO<R1, E1, B>, f: (a: A, b: B) => C, __tsplusTrace?: string) {
  return <R, E>(self: IO<R, E, A>): IO<R | R1, E | E1, C> => {
    return self.flatMap((a) => that.map((b) => f(a, b)));
  };
}

export class GenIO<R, E, A> {
  readonly _R!: () => R;
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
  __tsplusTrace?: string,
): IO<_R<T>, _E<T>, A> {
  return IO.defer(() => {
    const iterator = f(adapter as any);
    const state    = iterator.next();
    const run      = (state: IteratorYieldResult<T> | IteratorReturnResult<A>): IO<any, any, A> => {
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
