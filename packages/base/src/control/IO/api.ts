import type { MutableArray } from "../../collection/immutable/Array";
import type { ConcBuilder } from "../../collection/immutable/Conc";
import type { Lazy } from "../../data/function";
import type { InterruptStatus } from "../../data/InterruptStatus";
import type { Trace } from "../../data/Trace";
import type { _E, _R } from "../../types";
import type { FIO, URIO } from "./definition";
import type { Intersection } from "@fncts/typelevel";

import { Array } from "../../collection/immutable/Array";
import { Conc } from "../../collection/immutable/Conc";
import { Cause } from "../../data/Cause";
import { Either } from "../../data/Either";
import { Exit } from "../../data/Exit";
import { identity, tuple } from "../../data/function";
import { Maybe, Nothing } from "../../data/Maybe";
import { Chain, Ensuring, GetInterrupt, Give, IO, Match } from "./definition";

/**
 * @tsplus fluent fncts.control.IO apFirst
 */
export function apFirst_<R, E, A, R1, E1, B>(
  self: IO<R, E, A>,
  fb: IO<R1, E1, B>,
  __tsplusTrace?: string
): IO<R1 & R, E1 | E, A> {
  return self.chain((a) => fb.map(() => a));
}

/**
 * Combine two effectful actions, keeping only the result of the second
 *
 * @tsplus fluent fncts.control.IO apSecond
 */
export function apSecond_<R, E, A, R1, E1, B>(
  self: IO<R, E, A>,
  fb: IO<R1, E1, B>,
  __tsplusTrace?: string
): IO<R1 & R, E1 | E, B> {
  return self.chain(() => fb);
}

/**
 * @tsplus fluent fncts.control.IO as
 */
export function as_<R, E, A, B>(self: IO<R, E, A>, b: Lazy<B>): IO<R, E, B> {
  return self.map(() => b());
}

/**
 * Maps the success value of this effect to an optional value.
 *
 * @tsplus getter fncts.control.IO asJust
 */
export function asJust<R, E, A>(
  ma: IO<R, E, A>,
  __tsplusTrace?: string
): IO<R, E, Maybe<A>> {
  return ma.map(Maybe.just);
}

/**
 * Maps the error value of this IO to an optional value.
 *
 * @tsplus getter fncts.control.IO asJustError
 */
export function asJustError<R, E, A>(
  ma: IO<R, E, A>,
  __tsplusTrace?: string
): IO<R, Maybe<E>, A> {
  return ma.mapError(Maybe.just);
}

/**
 * @tsplus getter fncts.control.IO asUnit
 */
export function asUnit<R, E, A>(self: IO<R, E, A>): IO<R, E, void> {
  return self.as(undefined);
}

/**
 * Returns an IO whose failure and success channels have been mapped by
 * the specified pair of functions, `f` and `g`.
 *
 * @tsplus fluent fncts.control.IO bimap
 */
export function bimap_<R, E, A, E1, B>(
  self: IO<R, E, A>,
  f: (e: E) => E1,
  g: (a: A) => B,
  __tsplusTrace?: string
): IO<R, E1, B> {
  return self.matchIO(
    (e) => IO.failNow(f(e)),
    (a) => IO.succeedNow(g(a))
  );
}

/**
 * Returns an IO that effectfully "peeks" at the failure or success of
 * this effect.
 *
 * @tsplus fluent fncts.control.IO bitap
 */
export function bitap_<R, E, A, R1, E1, R2, E2>(
  self: IO<R, E, A>,
  onFailure: (e: E) => IO<R1, E1, any>,
  onSuccess: (a: A) => IO<R2, E2, any>,
  __tsplusTrace?: string
): IO<R & R1 & R2, E | E1 | E2, A> {
  return self.matchCauseIO(
    (cause) =>
      cause.failureOrCause.match(
        (e) => onFailure(e).chain(() => IO.failCauseNow(cause)),
        () => IO.failCauseNow(cause)
      ),
    (a) => onSuccess(a).apSecond(IO.succeedNow(a))
  );
}

/**
 * Recovers from the specified error
 *
 * @tsplus fluent fncts.control.IO catch
 */
export function catch_<
  N extends keyof E,
  K extends E[N] & string,
  R,
  E,
  A,
  R1,
  E1,
  A1
>(
  ma: IO<R, E, A>,
  tag: N,
  k: K,
  f: (e: Extract<E, { [n in N]: K }>) => IO<R1, E1, A1>,
  __tsplusTrace?: string
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
 * @tsplus fluent fncts.control.IO catchAll
 */
export function catchAll_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  f: (e: E) => IO<R1, E1, A1>,
  __tsplusTrace?: string
): IO<R & R1, E1, A | A1> {
  return ma.matchIO(f, IO.succeedNow);
}

/**
 *
 * Recovers from all errors with provided cause.
 *
 * @tsplus fluent fncts.control.IO catchAllCause
 */
export function catchAllCause_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  f: (_: Cause<E>) => IO<R1, E1, A1>,
  __tsplusTrace?: string
) {
  return ma.matchCauseIO(f, IO.succeedNow);
}

/**
 * Recovers from some or all of the error cases.
 *
 * @tsplus fluent fncts.control.IO catchJust
 */
export function catchJust_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  f: (e: E) => Maybe<IO<R1, E1, A1>>,
  __tsplusTrace?: string
): IO<R & R1, E | E1, A | A1> {
  return ma.matchCauseIO(
    (cause) =>
      cause.failureOrCause.match(
        (e) => f(e).getOrElse(IO.failCauseNow(cause)),
        IO.failCauseNow
      ),
    IO.succeedNow
  );
}

/**
 * Recovers from some or all of the error cases with provided cause.
 *
 * @tsplus fluent fncts.control.IO catchJustCause
 */
export function catchJustCause_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  f: (_: Cause<E>) => Maybe<IO<R1, E1, A1>>
): IO<R & R1, E | E1, A | A1> {
  return ma.matchCauseIO(
    (cause) => f(cause).getOrElse(IO.failCauseNow(cause)),
    IO.succeedNow
  );
}

/**
 * Recovers from some or all of the defects with provided partial function.
 *
 * *WARNING*: There is no sensible way to recover from defects. This
 * method should be used only at the boundary between IO and an external
 * system, to transmit information on a defect for diagnostic or explanatory
 * purposes.
 *
 * @tsplus fluent fncts.control.IO catchJustDefect
 */
export function catchJustDefect_<R, E, A, R1, E1, A1>(
  ma: IO<R, E, A>,
  f: (_: unknown) => Maybe<IO<R1, E1, A1>>,
  __tsplusTrace?: string
): IO<R & R1, E | E1, A | A1> {
  return ma.unrefineWith(f, IO.failNow).catchAll(identity);
}

/**
 * Recovers from the specified error
 *
 * @tsplus fluent IO catchTag
 */
export function catchTag_<
  K extends E["_tag"] & string,
  R,
  E extends { _tag: string },
  A,
  R1,
  E1,
  A1
>(
  ma: IO<R, E, A>,
  k: K,
  f: (e: Extract<E, { _tag: K }>) => IO<R1, E1, A1>,
  __tsplusTrace?: string
): IO<R & R1, Exclude<E, { _tag: K }> | E1, A | A1> {
  return ma.catch("_tag", k, f);
}

/**
 * @tsplus getter fncts.control.IO cause
 */
export function cause<R, E, A>(
  ma: IO<R, E, A>,
  __tsplusTrace?: string
): IO<R, never, Cause<E>> {
  return ma.matchCauseIO(IO.succeedNow, () => IO.succeedNow(Cause.empty()));
}

/**
 * @tsplus fluent fncts.control.IO causeAsError
 */
export function causeAsError<R, E, A>(
  ma: IO<R, E, A>,
  __tsplusTrace?: string
): IO<R, Cause<E>, A> {
  return ma.matchCauseIO(IO.failNow, IO.succeedNow);
}

/**
 * Returns an IO that models the execution of this effect, followed by
 * the passing of its value to the specified continuation function `f`,
 * followed by the effect that it returns.
 *
 * @tsplus fluent fncts.control.IO chain
 */
export function chain_<R, E, A, R1, E1, B>(
  ma: IO<R, E, A>,
  f: (a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string
): IO<R & R1, E | E1, B> {
  return new Chain(ma, f, __tsplusTrace);
}

/**
 * Folds an `IO` that may fail with `E` or succeed with `A` into one that never fails but succeeds with `Either<E, A>`
 *
 * @tsplus getter fncts.control.IO either
 */
export function either<R, E, A>(
  ma: IO<R, E, A>,
  __tsplusTrace?: string
): URIO<R, Either<E, A>> {
  return ma.match(Either.left, Either.right);
}

/**
 * @tsplus fluent fncts.control.IO ensuring
 */
export function ensuring_<R, E, A, R1>(
  self: IO<R, E, A>,
  finalizer: IO<R1, never, any>,
  __tsplusTrace?: string
): IO<R & R1, E, A> {
  return new Ensuring(self, finalizer, __tsplusTrace);
}

/**
 * Filters the collection using the specified effectual predicate.
 *
 * @tsplus static fncts.control.IOOps filter
 */
export function filter_<A, R, E>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, boolean>,
  __tsplusTrace?: string
): IO<R, E, Conc<A>> {
  return as
    .foldLeft(
      IO.succeedNow(Conc.builder<A>()) as IO<R, E, ConcBuilder<A>>,
      (eff, a) =>
        eff.zipWith(f(a), (builder, p) => {
          if (p) {
            builder.append(a);
          }
          return builder;
        })
    )
    .map((b) => b.result());
}

/**
 * Folds an `Iterable<A>` using an effectful function f, working sequentially from left to right.
 *
 * @tsplus static fncts.control.IOOps foldLeft
 */
export function foldLeft_<A, B, R, E>(
  as: Iterable<A>,
  b: B,
  f: (b: B, a: A) => IO<R, E, B>,
  __tsplusTrace?: string
): IO<R, E, B> {
  return as.foldLeft(IO.succeedNow(b) as IO<R, E, B>, (acc, el) =>
    acc.chain((a) => f(a, el))
  );
}

function foreachWithIndexDiscardLoop<A, R, E, B>(
  iterator: Iterator<A>,
  f: (i: number, a: A) => IO<R, E, B>,
  i = 0
): IO<R, E, void> {
  const next = iterator.next();
  return next.done
    ? IO.unit
    : f(i, next.value).chain(() =>
        foreachWithIndexDiscardLoop(iterator, f, i + 1)
      );
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns the results in a new `Conc<B>`.
 *
 * For a parallel version of this method, see `foreachC`.
 * If you do not need the results, see `foreachUnit` for a more efficient implementation.
 *
 * @tsplus static fncts.control.IOOps foreach
 */
export function foreach_<A, R, E, B>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string
): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const acc: MutableArray<B> = [];
    return IO.foreachWithIndexDiscard(as, (_, a) =>
      f(a).chain((b) => {
        acc.push(b);
        return IO.unit;
      })
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
 * @tsplus static fncts.control.IOOps foreachWithIndex
 */
export function foreachWithIndex_<A, R, E, B>(
  as: Iterable<A>,
  f: (i: number, a: A) => IO<R, E, B>
): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const acc: MutableArray<B> = [];
    return IO.foreachWithIndexDiscard(as, (i, a) =>
      f(i, a).chain((b) => {
        acc.push(b);
        return IO.unit;
      })
    ).as(Conc.from(acc));
  });
}

/**
 * @tsplus static fncts.control.IOOps foreachWithIndexDiscard
 */
export function foreachWithIndexDiscard_<A, R, E, B>(
  as: Iterable<A>,
  f: (i: number, a: A) => IO<R, E, B>
): IO<R, E, void> {
  return IO.defer(foreachWithIndexDiscardLoop(as[Symbol.iterator](), f));
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and runs
 * produced IOs sequentially.
 *
 * @tsplus static fncts.control.IOOps foreachDiscard
 */
export function foreachDiscard_<A, R, E, B>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, B>
): IO<R, E, void> {
  return IO.defer(
    foreachWithIndexDiscardLoop(as[Symbol.iterator](), (_, a) => f(a))
  );
}

/**
 * Repeats this effect forever (until the first failure).
 *
 * @tsplus getter fncts.control.IO forever
 */
export function forever<R, E, A>(ma: IO<R, E, A>): IO<R, E, never> {
  return ma.apSecond(IO.yieldNow).chain(() => ma.forever);
}

/**
 * Provides all of the environment required to compute a MonadEnv
 *
 * Provides the `IO` with its required environment, which eliminates
 * its dependency on `R`.
 *
 * @tsplus fluent fncts.control.IO give
 */
export function give_<R, E, A>(
  self: IO<R, E, A>,
  r: R,
  __tsplusTrace?: string
): FIO<E, A> {
  return new Give(self, r, __tsplusTrace);
}

/**
 * Provides some of the environment required to run this `IO`,
 * leaving the remainder `R0`.
 *
 * @tsplus fluent fncts.control.IO gives
 */
export function gives_<R0, R, E, A>(self: IO<R, E, A>, f: (r0: R0) => R) {
  return IO.asksIO((r0: R0) => self.give(f(r0)));
}

/**
 * Provides some of the environment required to run this effect,
 * leaving the remainder `R0` and combining it automatically using spread.
 */
export function giveSome_<R, E, A, R0>(
  ma: IO<R, E, A>,
  r: R0
): IO<Intersection.Erase<R, R0>, E, A> {
  return ma.gives((env) => ({ ...(env as R), ...r }));
}

/**
 * @tsplus fluent fncts.control.IO ifIO
 */
export function ifIO_<R, E, R1, E1, B, R2, E2, C>(
  self: IO<R, E, boolean>,
  onFalse: Lazy<IO<R1, E1, B>>,
  onTrue: Lazy<IO<R2, E2, C>>
): IO<R & R1 & R2, E | E1 | E2, B | C> {
  return self.chain((b) => (b ? onTrue() : onFalse()));
}

/**
 * Returns an `IO` whose success is mapped by the specified function `f`.
 *
 * @tsplus fluent fncts.control.IO map
 */
export function map_<R, E, A, B>(
  fa: IO<R, E, A>,
  f: (a: A) => B,
  __tsplusTrace?: string
): IO<R, E, B> {
  return fa.chain((a) => IO.succeedNow(f(a)));
}

/**
 * Map covariantly over the first argument.
 *
 * Returns an IO with its error channel mapped using the specified
 * function. This can be used to lift a "smaller" error into a "larger"
 * error.
 *
 * @tsplus fluent fncts.control.IO mapError
 */
export function mapError_<R, E, A, E1>(
  fea: IO<R, E, A>,
  f: (e: E) => E1,
  __tsplusTrace?: string
): IO<R, E1, A> {
  return fea.matchCauseIO(
    (cause) => IO.failCauseNow(cause.map(f)),
    IO.succeedNow
  );
}

/**
 * A more powerful version of `match_` that allows recovering from any kind of failure except interruptions.
 *
 * @tsplus fluent fncts.control.IO matchCause
 */
export function matchCause_<R, E, A, A1, A2>(
  self: IO<R, E, A>,
  onFailure: (cause: Cause<E>) => A1,
  onSuccess: (a: A) => A2,
  __tsplusTrace?: string
): IO<R, never, A1 | A2> {
  return self.matchCauseIO(
    (cause) => IO.succeedNow(onFailure(cause)),
    (a) => IO.succeedNow(onSuccess(a))
  );
}

/**
 * A more powerful version of `matchIO` that allows recovering from any kind of failure except interruptions.
 *
 * @tsplus fluent fncts.control.IO matchCauseIO
 */
export function matchCauseIO_<R, E, A, R1, E1, A1, R2, E2, A2>(
  self: IO<R, E, A>,
  onFailure: (cause: Cause<E>) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string
): IO<R & R1 & R2, E1 | E2, A1 | A2> {
  return new Match(self, onFailure, onSuccess, __tsplusTrace);
}

/**
 * @tsplus fluent fncts.control.IO matchIO
 */
export function matchIO_<R, R1, R2, E, E1, E2, A, A1, A2>(
  self: IO<R, E, A>,
  onFailure: (e: E) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string
): IO<R & R1 & R2, E1 | E2, A1 | A2> {
  return self.matchCauseIO(
    (cause) => cause.failureOrCause.match(onFailure, IO.failCauseNow),
    onSuccess
  );
}

/**
 * Folds over the failure value or the success value to yield an IO that
 * does not fail, but succeeds with the value returned by the left or right
 * function passed to `match_`.
 *
 * @tsplus fluent fncts.control.IO match
 */
export function match_<R, E, A, B, C>(
  self: IO<R, E, A>,
  onFailure: (e: E) => B,
  onSuccess: (a: A) => C,
  __tsplusTrace?: string
): IO<R, never, B | C> {
  return self.matchIO(
    (e) => IO.succeedNow(onFailure(e)),
    (a) => IO.succeedNow(onSuccess(a))
  );
}

/**
 * A version of `matchIO` that gives you the (optional) trace of the error.
 *
 * @tsplus fluent fncts.control.IO matchTraceIO
 */
export function matchTraceIO_<R, E, A, R1, E1, A1, R2, E2, A2>(
  ma: IO<R, E, A>,
  onFailure: (e: E, trace: Trace) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string
): IO<R & R1 & R2, E1 | E2, A1 | A2> {
  return ma.matchCauseIO(
    (cause) =>
      cause.failureTraceOrCause.match(
        ([e, trace]) => onFailure(e, trace),
        IO.failCauseNow
      ),
    onSuccess
  );
}

/**
 * @tsplus fluent fncts.control.IO replicate
 */
export function replicate_<R, E, A>(
  self: IO<R, E, A>,
  n: number,
  __tsplusTrace?: string
): Array<IO<R, E, A>> {
  return Array.range(0, n).map(() => self);
}

/**
 * Returns an IO that semantically runs the IO on a fiber,
 * producing an `Exit` for the completion value of the fiber.
 *
 * @tsplus getter fncts.control.IO result
 */
export function result<R, E, A>(
  ma: IO<R, E, A>,
  __tsplusTrace?: string
): IO<R, never, Exit<E, A>> {
  return ma.matchCauseIO(
    (cause) => IO.succeedNow(Exit.failCause(cause)),
    (a) => IO.succeedNow(Exit.succeed(a))
  );
}

/**
 * Returns an `IO` that submerges an `Either` into the `IO`.
 *
 * @tsplus getter fncts.control.IO absolve
 */
export function absolve<R, E, E1, A>(
  ma: IO<R, E, Either<E1, A>>,
  __tsplusTrace?: string
): IO<R, E | E1, A> {
  return ma.chain((ea) => ea.match(IO.failNow, IO.succeedNow));
}

/**
 * Composes computations in sequence, using the return value of one computation as input for the next
 * and keeping only the result of the first
 *
 * Returns an IO that effectfully "peeks" at the success of this effect.
 *
 * @tsplus fluent fncts.control.IO tap
 */
export function tap_<R, E, A, R1, E1, B>(
  self: IO<R, E, A>,
  f: (a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string
): IO<R1 & R, E1 | E, A> {
  return self.chain((a) => f(a).map(() => a));
}

/**
 * Returns an IO that effectfully "peeks" at the failure of this effect.
 *
 * @tsplus fluent fncts.control.IO tapError
 */
export function tapError_<R, E, A, R1, E1>(
  self: IO<R, E, A>,
  f: (e: E) => IO<R1, E1, any>,
  __tsplusTrace?: string
) {
  return self.matchCauseIO(
    (cause) =>
      cause.failureOrCause.match(
        (e) => f(e).chain(() => IO.failCauseNow(cause)),
        (_) => IO.failCauseNow(cause)
      ),
    IO.succeedNow
  );
}

/**
 * Returns an effect that effectually "peeks" at the cause of the failure of
 * this effect.
 *
 * @tsplus fluent fncts.control.IO tapErrorCause
 */
export function tapErrorCause_<R, E, A, R1, E1>(
  self: IO<R, E, A>,
  f: (e: Cause<E>) => IO<R1, E1, any>,
  __tsplusTrace?: string
): IO<R & R1, E | E1, A> {
  return self.matchCauseIO(
    (cause) => f(cause).apSecond(IO.failCauseNow(cause)),
    IO.succeedNow
  );
}

/**
 * Takes some fiber failures and converts them into errors, using the
 * specified function to convert the `E` into an `E1 | E2`.
 *
 * @tsplus fluent fncts.control.IO unrefineWith
 */
export function unrefineWith_<R, E, A, E1, E2>(
  fa: IO<R, E, A>,
  pf: (u: unknown) => Maybe<E1>,
  f: (e: E) => E2,
  __tsplusTrace?: string
): IO<R, E1 | E2, A> {
  return fa.catchAllCause((cause) =>
    cause
      .find((c) => (c.isHalt() ? pf(c.value) : Nothing()))
      .match(() => IO.failCauseNow(cause.map(f)), IO.failNow)
  );
}

/**
 * The moral equivalent of `if (p) exp` when `p` has side-effects
 *
 * @tsplus fluent fncts.control.IO whenIO
 */
export function whenIO_<R, E, A, R1, E1>(
  mb: IO<R1, E1, boolean>,
  ma: IO<R, E, A>
): IO<R1 & R, E | E1, void> {
  return mb.chain((b) => (b ? ma.asUnit : IO.unit));
}

/**
 * @tsplus fluent fncts.control.IO zip
 */
export function zip_<R, E, A, R1, E1, B>(
  self: IO<R, E, A>,
  that: IO<R1, E1, B>
): IO<R & R1, E | E1, readonly [A, B]> {
  return self.zipWith(that, tuple);
}

/**
 * @tsplus fluent fncts.control.IO zipWith
 */
export function zipWith_<R, E, A, R1, E1, B, C>(
  self: IO<R, E, A>,
  that: IO<R1, E1, B>,
  f: (a: A, b: B) => C
): IO<R & R1, E | E1, C> {
  return self.chain((a) => that.map((b) => f(a, b)));
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
 * @tsplus static fncts.control.IOOps gen
 * @gen
 */
export function gen<T extends GenIO<any, any, any>, A>(
  f: (i: {
    <R, E, A>(_: IO<R, E, A>, __tsplusTrace?: string): GenIO<R, E, A>;
  }) => Generator<T, A, any>
): IO<_R<T>, _E<T>, A> {
  return IO.defer(() => {
    const iterator = f(adapter as any);
    const state    = iterator.next();

    const run = (
      state: IteratorYieldResult<T> | IteratorReturnResult<A>
    ): IO<any, any, A> => {
      if (state.done) {
        return IO.succeed(state.value);
      }
      const f = (val: any) => {
        const next = iterator.next(val);
        return run(next);
      };
      return state.value.effect.chain(f);
    };

    return run(state);
  });
}
