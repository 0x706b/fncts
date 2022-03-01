import type { Conc } from "../../collection/immutable/Conc";
import type { FiberId } from "../../data/FiberId";
import type { Lazy } from "../../data/function";
import type * as P from "../../prelude";
import type { _E, _R } from "../../types";
import type { URManaged } from "./definition";
import type { Intersection } from "@fncts/typelevel";

import { Cause } from "../../data/Cause";
import { Either } from "../../data/Either";
import { Exit } from "../../data/Exit";
import { identity } from "../../data/function";
import { Just, Maybe, Nothing } from "../../data/Maybe";
import { hasTypeId } from "../../util/predicates";
import { FiberRef } from "../FiberRef";
import { IO } from "../IO";
import { Managed, ManagedTypeId } from "./definition";
import { Finalizer } from "./Finalizer";

/**
 * Maps this effect to the specified constant while preserving the
 * effects of this effect.
 *
 * @tsplus fluent fncts.control.Managed as
 */
export function as_<R, E, A, B>(ma: Managed<R, E, A>, b: Lazy<B>, __tsplusTrace?: string): Managed<R, E, B> {
  return ma.map(b);
}

/**
 * Maps the success value of this effect to an optional value.
 *
 * @tsplus getter fncts.control.Managed asJust
 */
export function asJust<R, E, A>(ma: Managed<R, E, A>): Managed<R, E, Maybe<A>> {
  return ma.map(Maybe.just);
}

/**
 * Maps the error value of this effect to an optional value.
 *
 * @tsplus getter fncts.control.Managed asJustError
 */
export function asJustError<R, E, A>(ma: Managed<R, E, A>): Managed<R, Maybe<E>, A> {
  return ma.mapError(Maybe.just);
}

/**
 * @tsplus getter fncts.control.Managed asUnit
 */
export function asUnit<R, E, A>(ma: Managed<R, E, A>): Managed<R, E, void> {
  return ma.map(() => undefined);
}

/**
 * Create a managed that accesses the environment.
 *
 * @tsplus static fncts.control.ManagedOps environmentWith
 */
export function environmentWith<R, A>(f: (r: R) => A, __tsplusTrace?: string): Managed<R, never, A> {
  return Managed.environment<R>().map(f);
}

/**
 * Create a managed that accesses the environment.
 *
 * @tsplus static fncts.control.ManagedOps environmentWithIO
 */
export function environmentWithIO<R0, R, E, A>(f: (r: R0) => IO<R, E, A>, __tsplusTrace?: string): Managed<R0 & R, E, A> {
  return Managed.environment<R0>().mapIO(f);
}

/**
 * Create a managed that accesses the environment.
 *
 * @tsplus static fncts.control.ManagedOps environmentWithManaged
 */
export function environmentWithManaged<R0, R, E, A>(f: (r: R0) => Managed<R, E, A>, __tsplusTrace?: string): Managed<R0 & R, E, A> {
  return Managed.environment<R0>().chain(f);
}

/**
 * Submerges the error case of an `Either` into the `Managed`. The inverse
 * operation of `Managed.either`.
 *
 * @tsplus getter fncts.control.Managed absolve
 */
export function absolve<R, E, E1, A>(fa: Managed<R, E, Either<E1, A>>, __tsplusTrace?: string): Managed<R, E | E1, A> {
  return fa.chain(Managed.fromEitherNow);
}

/**
 * @tsplus fluent fncts.control.Managed apFirst
 */
export function apFirst_<R, E, A, R1, E1, B>(fa: Managed<R, E, A>, fb: Managed<R1, E1, B>): Managed<R & R1, E | E1, A> {
  return fa.zipWith(fb, (a, _) => a);
}

/**
 * @tsplus fluent fncts.control.Managed apSecond
 */
export function apSecond_<R, E, A, R1, E1, B>(fa: Managed<R, E, A>, fb: Managed<R1, E1, B>): Managed<R & R1, E | E1, B> {
  return fa.zipWith(fb, (_, b) => b);
}

/**
 * Returns an effect whose failure and success channels have been mapped by
 * the specified pair of functions, `f` and `g`.
 *
 * @tsplus fluent fncts.control.Managed bimap
 */
export function bimap_<R, E, A, B, C>(self: Managed<R, E, A>, f: (e: E) => B, g: (a: A) => C): Managed<R, B, C> {
  return new Managed(self.io.bimap(f, ([fin, a]) => [fin, g(a)]));
}

/**
 * Recovers from all errors.
 *
 * @tsplus fluent fncts.control.Managed catchAll
 */
export function catchAll_<R, E, A, R1, E1, B>(
  ma: Managed<R, E, A>,
  f: (e: E) => Managed<R1, E1, B>,
  __tsplusTrace?: string,
): Managed<R & R1, E1, A | B> {
  return ma.matchManaged(f, Managed.succeedNow);
}

/**
 * Recovers from all errors with provided Cause.
 *
 * @tsplus fluent fncts.control.Managed catchAllCause
 */
export function catchAllCause_<R, E, A, R1, E1, B>(
  ma: Managed<R, E, A>,
  f: (e: Cause<E>) => Managed<R1, E1, B>,
  __tsplusTrace?: string,
): Managed<R & R1, E1, A | B> {
  return ma.matchCauseManaged(f, Managed.succeedNow);
}

/**
 * Recovers from some or all of the error cases.
 *
 * @tsplus fluent fncts.control.Managed catchJust
 */
export function catchJust_<R, E, A, R1, E1, B>(
  ma: Managed<R, E, A>,
  pf: (e: E) => Maybe<Managed<R1, E1, B>>,
  __tsplusTrace?: string,
): Managed<R & R1, E | E1, A | B> {
  return ma.catchAll((e) => pf(e).getOrElse(Managed.failNow(e)));
}

/**
 * Recovers from some or all of the error Causes.
 *
 * @tsplus fluent fncts.control.Managed catchJustCause
 */
export function catchJustCause_<R, E, A, R1, E1, B>(
  ma: Managed<R, E, A>,
  pf: (e: Cause<E>) => Maybe<Managed<R1, E1, B>>,
  __tsplusTrace?: string,
): Managed<R & R1, E | E1, A | B> {
  return ma.catchAllCause((cause) => pf(cause).getOrElse(Managed.failCauseNow(cause)));
}

/**
 * Fail with `e` if the supplied partial function does not match, otherwise
 * succeed with the returned value.
 *
 * @tsplus fluent fncts.control.Managed collect
 */
export function collect_<R, E, A, E1, B>(
  ma: Managed<R, E, A>,
  e: E1,
  pf: (a: A) => Maybe<B>,
  __tsplusTrace?: string,
): Managed<R, E | E1, B> {
  return ma.collectManaged(e, (a) => pf(a).map(Managed.succeedNow));
}

/**
 * Fail with `e` if the supplied partial function does not match, otherwise
 * continue with the returned value.
 *
 * @tsplus fluent fncts.control.Managed collectManaged
 */
export function collectManaged_<R, E, A, E1, R2, E2, B>(
  ma: Managed<R, E, A>,
  e: E1,
  pf: (a: A) => Maybe<Managed<R2, E2, B>>,
  __tsplusTrace?: string,
): Managed<R & R2, E | E1 | E2, B> {
  return ma.chain((a) => pf(a).getOrElse(Managed.failNow(e)));
}

/**
 * Returns a managed that models the execution of this managed, followed by
 * the passing of its value to the specified continuation function `f`,
 * followed by the managed that it returns.
 *
 * @tsplus fluent fncts.control.Managed chain
 */
export function chain_<R, E, A, R1, E1, B>(
  self: Managed<R, E, A>,
  f: (a: A) => Managed<R1, E1, B>,
  __tsplusTrace?: string,
): Managed<R & R1, E | E1, B> {
  return new Managed(
    self.io.chain(([releaseSelf, a]) =>
      f(a).io.map(([releaseThat, b]) => [
        Finalizer.get((exit) =>
          Finalizer.reverseGet(releaseThat)(exit).result.chain((e1) =>
            Finalizer.reverseGet(releaseSelf)(exit).result.chain((e2) => IO.fromExitNow(e1.apSecond(e2))),
          ),
        ),
        b,
      ]),
    ),
  );
}

/**
 * Effectfully map the error channel
 *
 * @tsplus fluent fncts.control.Managed chainError
 */
export function chainError_<R, E, A, R1, E1>(ma: Managed<R, E, A>, f: (e: E) => URManaged<R1, E1>): Managed<R & R1, E1, A> {
  return ma.swapWith((me) => me.chain(f));
}

/**
 * @tsplus fluent fncts.control.Managed compose
 */
export function compose_<R, E, A, E1, B>(ma: Managed<R, E, A>, mb: Managed<A, E1, B>, __tsplusTrace?: string): Managed<R, E | E1, B> {
  return ma.chain((a) => mb.provideEnvironment(a));
}

/**
 * @tsplus static fncts.control.ManagedOps defer
 */
export function defer<R, E, A>(managed: Lazy<Managed<R, E, A>>, __tsplusTrace?: string): Managed<R, E, A> {
  return Managed.succeed(managed).flatten;
}

/**
 * @tsplus getter fncts.control.Managed either
 */
export function either<R, E, A>(fa: Managed<R, E, A>, __tsplusTrace?: string): Managed<R, never, Either<E, A>> {
  return fa.match(Either.left, Either.right);
}

/**
 * Returns a Managed that ignores errors raised by the acquire effect and
 * runs it repeatedly until it eventually succeeds.
 *
 * @tsplus getter fncts.control.Managed eventually
 */
export function eventually<R, E, A>(ma: Managed<R, E, A>): Managed<R, never, A> {
  return new Managed(ma.io.eventually);
}

/**
 * Returns an effect that performs the outer effect first, followed by the
 * inner effect, yielding the value of the inner effect.
 *
 * This method can be used to "flatten" nested effects.
 *
 * @tsplus getter fncts.control.Managed flatten
 */
export function flatten<R, E, R1, E1, A>(self: Managed<R, E, Managed<R1, E1, A>>, __tsplusTrace?: string): Managed<R & R1, E | E1, A> {
  return self.chain(identity);
}

/**
 * Returns an effect that performs the outer effect first, followed by the
 * inner effect, yielding the value of the inner effect.
 *
 * This method can be used to "flatten" nested effects.
 *
 * @tsplus getter fncts.control.Managed flattenIO
 */
export function flattenIO<R, E, R1, E1, A>(mma: Managed<R, E, IO<R1, E1, A>>, __tsplusTrace?: string): Managed<R & R1, E | E1, A> {
  return mma.mapIO(identity);
}

/**
 * Folds an Iterable<A> using an effectual function f, working sequentially from left to right.
 *
 * @tsplus static fncts.control.ManagedOps foldLeft
 */
export function foldLeft_<R, E, A, B>(
  as: Iterable<A>,
  b: B,
  f: (b: B, a: A) => Managed<R, E, B>,
  __tsplusTrace?: string,
): Managed<R, E, B> {
  return as.foldLeft(Managed.succeedNow(b) as Managed<R, E, B>, (acc, a) => acc.chain((b) => f(b, a)));
}

/**
 * Combines an array of `Managed` effects using a `Monoid`
 *
 * @tsplus static fncts.control.ManagedOps foldMap
 */
export function foldMap_<M>(M: P.Monoid<M>) {
  return <R, E, A>(mas: Iterable<Managed<R, E, A>>, f: (a: A) => M, __tsplusTrace?: string): Managed<R, E, M> =>
    Managed.foldLeft(mas, M.nat, (m, ma) => ma.map((a) => M.combine_(m, f(a))));
}

/**
 * Lifts an `Either` into a `Managed` value.
 *
 * @tsplus static fncts.control.ManagedOps fromEither
 */
export function fromEither<E, A>(either: Lazy<Either<E, A>>): Managed<unknown, E, A> {
  return Managed.succeed(either).chain((ea) => ea.match(Managed.failNow, Managed.succeedNow));
}

/**
 * Lifts an `Either` into a `Managed` value.
 *
 * @tsplus static fncts.control.ManagedOps fromEitherNow
 */
export function fromEitherNow<E, A>(either: Either<E, A>): Managed<unknown, E, A> {
  return either.match(Managed.failNow, Managed.succeedNow);
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns the results in a new `B[]`.
 *
 * For a parallel version of this method, see `foreachC_`.
 * If you do not need the results, see `foreachUnitC_` for a more efficient implementation.
 *
 * @tsplus static fncts.control.ManagedOps foreach
 */
export function foreach_<R, E, A, B>(as: Iterable<A>, f: (a: A) => Managed<R, E, B>, __tsplusTrace?: string): Managed<R, E, Conc<B>> {
  return new Managed(
    IO.foreach(as, (a) => f(a).io).map((results) => {
      const fins   = results.map((r) => r[0]);
      const values = results.map((r) => r[1]);
      return [Finalizer.get((exit) => IO.foreach(fins.reverse, (fin) => Finalizer.reverseGet(fin)(exit))), values];
    }),
  );
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and runs
 * produced effects sequentially.
 *
 * Equivalent to `Managed.foreach(as, f).asUnit`, but without the cost of building
 * the list of results.
 *
 * @tsplus static fncts.control.ManagedOps foreachDiscard
 */
export function foreachDiscard_<R, E, A>(
  as: Iterable<A>,
  f: (a: A) => Managed<R, E, unknown>,
  __tsplusTrace?: string,
): Managed<R, E, void> {
  return new Managed(
    IO.foreach(as, (a) => f(a).io).map((results) => {
      const fins = results.map((r) => r[0]);
      return [Finalizer.get((exit) => IO.foreach(fins.reverse, (fin) => Finalizer.reverseGet(fin)(exit))), undefined];
    }),
  );
}

/**
 * Unwraps the optional success of this effect, but can fail with None value.
 *
 * @tsplus getter fncts.control.Managed getMaybe
 */
export function getMaybe<R, A>(ma: Managed<R, never, Maybe<A>>, __tsplusTrace?: string): Managed<R, Maybe<never>, A> {
  return ma.chain((maybe) => maybe.match(() => Managed.failNow(Nothing()), Managed.succeedNow));
}

/**
 * Provides the `Managed` effect with its required environment, which eliminates
 * its dependency on `R`.
 *
 * @tsplus fluent fncts.control.Managed provideEnvironment
 */
export function provideEnvironment_<R, E, A>(ma: Managed<R, E, A>, env: R, __tsplusTrace?: string): Managed<unknown, E, A> {
  return ma.contramapEnvironment(() => env);
}

/**
 * Modify the environment required to run a Managed
 *
 * @tsplus fluent fncts.control.Managed contramapEnvironment
 */
export function contramapEnvironment_<R, E, A, R0>(ma: Managed<R, E, A>, f: (r0: R0) => R, __tsplusTrace?: string): Managed<R0, E, A> {
  return new Managed(ma.io.contramapEnvironment(f));
}

/**
 * @tsplus fluent fncts.control.Managed provideSomeEnvironment
 */
export function provideSomeEnvironment_<R, E, A, R0>(
  ma: Managed<R, E, A>,
  r: R0,
  __tsplusTrace?: string,
): Managed<Intersection.Erase<R, R0>, E, A> {
  return ma.contramapEnvironment((r0) => ({ ...(r0 as R), ...r }));
}

/**
 * Runs `onTrue` if the result of `b` is `true` and `onFalse` otherwise.
 *
 * @tsplus fluent fncts.control.Managed ifManaged
 */
export function ifManaged_<R, E, R1, E1, B, R2, E2, C>(
  mb: Managed<R, E, boolean>,
  onTrue: Managed<R1, E1, B>,
  onFalse: Managed<R2, E2, C>,
  __tsplusTrace?: string,
): Managed<R & R1 & R2, E | E1 | E2, B | C> {
  return mb.chain((b) => (b ? onTrue : onFalse));
}

/**
 * Runs `onTrue` if the result of `b` is `true` and `onFalse` otherwise.
 *
 * @tsplus static fncts.control.ManagedOps if
 */
export function if_<R, E, A, R1, E1, B>(
  b: Lazy<boolean>,
  onTrue: Managed<R, E, A>,
  onFalse: Managed<R1, E1, B>,
): Managed<R & R1, E | E1, A | B> {
  return Managed.succeed(b).ifManaged(onTrue, onFalse);
}

/**
 * Ignores the success or failure of a Managed
 *
 * @tsplus getter fncts.control.Managed ignore
 */
export function ignore<R, E, A>(ma: Managed<R, E, A>): Managed<R, never, void> {
  return ma.match(
    () => undefined,
    () => undefined,
  );
}

/**
 * Returns a new managed effect that ignores defects in finalizers.
 *
 * @tsplus getter fncts.control.Managed ignoreReleaseFailures
 */
export function ignoreReleaseFailures<R, E, A>(ma: Managed<R, E, A>): Managed<R, E, A> {
  return new Managed(
    FiberRef.currentReleaseMap.get
      .tap((releaseMap) =>
        releaseMap.updateAll((finalizer) => Finalizer.get((exit) => Finalizer.reverseGet(finalizer)(exit).catchAllCause(() => IO.unit))),
      )
      .apSecond(ma.io),
  );
}

/**
 * Returns a Managed that is interrupted as if by the fiber calling this
 * method.
 *
 * @tsplus static fncts.control.ManagedOps interrupt
 */
export const interrupt: Managed<unknown, never, never> = Managed.fromIO(IO.fiberId).chain((id) =>
  Managed.failCauseNow(Cause.interrupt(id)),
);

/**
 * Returns a Managed that is interrupted as if by the specified fiber.
 *
 * @tsplus static fncts.control.ManagedOps interruptAs
 */
export function interruptAs(fiberId: FiberId): Managed<unknown, never, never> {
  return Managed.failCauseNow(Cause.interrupt(fiberId));
}

/**
 * Returns whether this managed effect is a failure.
 *
 * @tsplus getter fncts.control.Managed isFailure
 */
export function isFailure<R, E, A>(ma: Managed<R, E, A>, __tsplusTrace?: string): Managed<R, never, boolean> {
  return ma.match(
    () => true,
    () => false,
  );
}

/**
 * Returns whether this managed effect is a success.
 *
 * @tsplus getter fncts.control.Managed isSuccess
 */
export function isSuccess<R, E, A>(ma: Managed<R, E, A>, __tsplusTrace?: string): Managed<R, never, boolean> {
  return ma.match(
    () => false,
    () => true,
  );
}

/**
 * Depending on the environment execute this or the other effect
 *
 * @tsplus fluent fncts.control.Managed join
 */
export function join_<R, E, A, R1, E1, A1>(
  ma: Managed<R, E, A>,
  that: Managed<R1, E1, A1>,
  __tsplusTrace?: string,
): Managed<Either<R, R1>, E | E1, A | A1> {
  return Managed.environment<Either<R, R1>>().chain((env) =>
    env.match(
      (r) => ma.provideEnvironment(r),
      (r1) => that.provideEnvironment(r1),
    ),
  );
}

/**
 * Depending on provided environment returns either this one or the other effect.
 *
 * @tsplus fluent fncts.control.Managed joinEither
 */
export function joinEither_<R, E, A, R1, E1, A1>(
  ma: Managed<R, E, A>,
  that: Managed<R1, E1, A1>,
  __tsplusTrace?: string,
): Managed<Either<R, R1>, E | E1, Either<A, A1>> {
  return Managed.environment<Either<R, R1>>().chain((env) =>
    env.match(
      (r) => ma.map(Either.left).provideEnvironment(r),
      (r1) => that.map(Either.right).provideEnvironment(r1),
    ),
  );
}

/**
 * Returns a managed whose success is mapped by the specified `f` function.
 *
 * @tsplus fluent fncts.control.Managed map
 */
export function map_<R, E, A, B>(self: Managed<R, E, A>, f: (a: A) => B, __tsplusTrace?: string): Managed<R, E, B> {
  return new Managed(self.io.map(([fin, a]) => [fin, f(a)]));
}

/**
 * Returns an effect whose failure is mapped by the specified `f` function.
 *
 * @tsplus fluent fncts.control.Managed mapError
 */
export function mapError_<R, E, A, D>(self: Managed<R, E, A>, f: (e: E) => D, __tsplusTrace?: string): Managed<R, D, A> {
  return new Managed(self.io.mapError(f));
}

/**
 * Returns a Managed whose full failure is mapped by the specified `f` function.
 *
 * @tsplus fluent fncts.control.Managed mapErrorCause
 */
export function mapErrorCause_<R, E, A, D>(self: Managed<R, E, A>, f: (e: Cause<E>) => Cause<D>, __tsplusTrace?: string): Managed<R, D, A> {
  return new Managed(self.io.mapErrorCause(f));
}

/**
 * Returns a managed whose success is mapped by the specified `f` function.
 *
 * @tsplus fluent fncts.control.Managed mapIO
 */
export function mapIO_<R, E, A, R1, E1, B>(
  self: Managed<R, E, A>,
  f: (a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string,
): Managed<R & R1, E | E1, B> {
  return new Managed(self.io.chain(([fin, a]) => f(a).map((b) => [fin, b])));
}

/**
 * Folds over the failure value or the success value to yield an effect that
 * does not fail, but succeeds with the value returned by the left or right
 * function passed to `match`.
 *
 * @tsplus fluent fncts.control.Managed match
 */
export function match_<R, E, A, B, C>(
  ma: Managed<R, E, A>,
  onError: (e: E) => B,
  onSuccess: (a: A) => C,
  __tsplusTrace?: string,
): Managed<R, never, B | C> {
  return ma.matchManaged(
    (e) => Managed.succeedNow(onError(e)),
    (a) => Managed.succeedNow(onSuccess(a)),
  );
}

/**
 * A more powerful version of `match` that allows recovering from any kind of failure except interruptions.
 *
 * @tsplus fluent fncts.control.Managed matchCause
 */
export function matchCause_<R, E, A, B, C>(
  ma: Managed<R, E, A>,
  onFailure: (cause: Cause<E>) => B,
  onSuccess: (a: A) => C,
): Managed<R, never, B | C> {
  return ma.sandbox.match(onFailure, onSuccess);
}

/**
 * A more powerful version of `matchM` that allows recovering from any kind of failure except interruptions.
 *
 * @tsplus fluent fncts.control.Managed matchCauseManaged
 */
export function matchCauseManaged_<R, E, A, R1, E1, A1, R2, E2, A2>(
  ma: Managed<R, E, A>,
  onFailure: (cause: Cause<E>) => Managed<R1, E1, A1>,
  onSuccess: (a: A) => Managed<R2, E2, A2>,
  __tsplusTrace?: string,
): Managed<R & R1 & R2, E1 | E2, A1 | A2> {
  return new Managed(
    ma.io.matchCauseIO(
      (c): IO<R1, E1, readonly [Finalizer, A1 | A2]> => onFailure(c).io,
      ([_, a]) => onSuccess(a).io,
    ),
  );
}

/**
 * Recovers from errors by accepting one Managed to execute for the case of an
 * error, and one Managed to execute for the case of success.
 *
 * @tsplus fluent fncts.control.Managed matchManaged
 */
export function matchManaged_<R, E, A, R1, E1, B, R2, E2, C>(
  ma: Managed<R, E, A>,
  f: (e: E) => Managed<R1, E1, B>,
  g: (a: A) => Managed<R2, E2, C>,
  __tsplusTrace?: string,
): Managed<R & R1 & R2, E1 | E2, B | C> {
  return ma.matchCauseManaged((cause) => cause.failureOrCause.match(f, Managed.failCauseNow), g);
}

/**
 * Returns a new Managed where the error channel has been merged into the
 * success channel to their common combined type.
 *
 * @tsplus getter fncts.control.Managed merge
 */
export function merge<R, E, A>(ma: Managed<R, E, A>, __tsplusTrace?: string): Managed<R, never, E | A> {
  return ma.matchManaged(Managed.succeedNow, Managed.succeedNow);
}

/**
 * Merges an `Iterable<Managed>` to a single `Managed`, working sequentially.
 *
 * @tsplus static fncts.control.ManagedOps mergeAll
 */
export function mergeAll_<R, E, A, B>(mas: Iterable<Managed<R, E, A>>, b: B, f: (b: B, a: A) => B): Managed<R, E, B> {
  return mas.foldLeft(Managed.succeedNow(b) as Managed<R, E, B>, (b, a) => b.zipWith(a, f));
}

/**
 * Executes this effect and returns its value, if it succeeds, but
 * otherwise executes the specified effect.
 *
 * @tsplus fluent fncts.control.Managed orElse
 */
export function orElse_<R, E, A, R1, E1, B>(
  ma: Managed<R, E, A>,
  that: Lazy<Managed<R1, E1, B>>,
  __tsplusTrace?: string,
): Managed<R & R1, E | E1, A | B> {
  return ma.matchManaged(() => that(), Managed.succeedNow);
}

/**
 * Returns an effect that will produce the value of this effect, unless it
 * fails, in which case, it will produce the value of the specified effect.
 *
 * @tsplus fluent fncts.control.Managed orElseEither
 */
export function orElseEither_<R, E, A, R1, E1, B>(
  ma: Managed<R, E, A>,
  that: Lazy<Managed<R1, E1, B>>,
  __tsplusTrace?: string,
): Managed<R & R1, E1, Either<B, A>> {
  return ma.matchManaged(
    () => that().map(Either.left),
    (a) => Managed.succeedNow(Either.right(a)),
  );
}

/**
 * Executes this effect and returns its value, if it succeeds, but
 * otherwise fails with the specified error.
 *
 * @tsplus fluent fncts.control.Managed orElseFail
 */
export function orElseFail_<R, E, A, E1>(ma: Managed<R, E, A>, e: Lazy<E1>): Managed<R, E | E1, A> {
  return ma.orElse(Managed.fail(e));
}

/**
 * Returns an effect that will produce the value of this effect, unless it
 * fails with the `None` value, in which case it will produce the value of
 * the specified effect.
 *
 * @tsplus fluent fncts.control.Managed orElseOptional
 */
export function orElseOptional_<R, E, A, R1, E1, B>(
  ma: Managed<R, Maybe<E>, A>,
  that: Lazy<Managed<R1, Maybe<E1>, B>>,
  __tsplusTrace?: string,
): Managed<R & R1, Maybe<E | E1>, A | B> {
  return ma.catchAll((me) => me.match(that, (e) => Managed.failNow(Just(e))));
}

/**
 * Executes this Managed and returns its value, if it succeeds, but
 * otherwise succeeds with the specified value.
 *
 * @tsplus fluent fncts.control.Managed orElseSucceed
 */
export function orElseSucceed_<R, E, A, A1>(ma: Managed<R, E, A>, that: Lazy<A1>, __tsplusTrace?: string): Managed<R, E, A | A1> {
  return ma.orElse(Managed.succeed(that));
}

/**
 * Keeps none of the errors, and terminates the fiber with them, using
 * the specified function to convert the `E` into an unknown`.
 *
 * @tsplus fluent fncts.control.Managed orHaltWith
 */
export function orHaltWith_<R, E, A>(ma: Managed<R, E, A>, f: (e: E) => unknown, __tsplusTrace?: string): Managed<R, never, A> {
  return new Managed(ma.io.orHaltWith(f));
}

/**
 * Translates effect failure into death of the fiber, making all failures unchecked and
 * not a part of the type of the effect.
 *
 * @tsplus getter fncts.control.Managed orHalt
 */
export function orHalt<R, E, A>(ma: Managed<R, E, A>): Managed<R, never, A> {
  return ma.orHaltWith(identity);
}

/**
 * Keeps some of the errors, and terminates the fiber with the rest, using
 * the specified function to convert the `E` into a `Throwable`.
 *
 * @tsplus fluent fncts.control.Managed refineOrHaltWith
 */
export function refineOrHaltWith_<R, E, A, E1>(
  ma: Managed<R, E, A>,
  pf: (e: E) => Maybe<E1>,
  f: (e: E) => unknown,
  __tsplusTrace?: string,
): Managed<R, E1, A> {
  return ma.catchAll((e) => pf(e).match(() => Managed.haltNow(f(e)), Managed.failNow));
}

/**
 * Keeps some of the errors, and terminates the fiber with the rest
 *
 * @tsplus fluent fncts.control.Managed refineOrHalt
 */
export function refineOrHalt_<R, E, A, E1>(ma: Managed<R, E, A>, pf: (e: E) => Maybe<E1>, __tsplusTrace?: string): Managed<R, E1, A> {
  return ma.refineOrHaltWith(pf, identity);
}

/**
 * Fail with the returned value if the partial function `pf` matches, otherwise
 * continue with our held value.
 *
 * @tsplus fluent fncts.control.Managed reject
 */
export function reject_<R, E, A, E1>(ma: Managed<R, E, A>, pf: (a: A) => Maybe<E1>, __tsplusTrace?: string): Managed<R, E | E1, A> {
  return ma.rejectManaged((a) => pf(a).map(Managed.failNow));
}

/**
 * Continue with the returned computation if the partial function `pf` matches,
 * translating the successful match into a failure, otherwise continue with
 * our held value.
 *
 * @tsplus fluent fncts.control.Managed rejectManaged
 */
export function rejectManaged_<R, E, A, R1, E1>(
  ma: Managed<R, E, A>,
  pf: (a: A) => Maybe<Managed<R1, E1, E1>>,
  __tsplusTrace?: string,
): Managed<R & R1, E | E1, A> {
  return ma.chain((a) =>
    pf(a).match(
      () => Managed.succeedNow(a),
      (me) => me.chain(Managed.failNow),
    ),
  );
}

/**
 * @tsplus fluent fncts.control.Managed require
 */
export function require_<R, E, A>(ma: Managed<R, E, Maybe<A>>, error: Lazy<E>, __tsplusTrace?: string): Managed<R, E, A> {
  return ma.chain((r) => r.match(() => Managed.succeed(error).chain(Managed.failNow), Managed.succeedNow));
}

/**
 * Returns a Managed that semantically runs the Managed on a fiber,
 * producing an `Exit` for the completion value of the fiber.
 *
 * @tsplus getter fncts.control.Managed result
 */
export function result<R, E, A>(ma: Managed<R, E, A>, __tsplusTrace?: string): Managed<R, never, Exit<E, A>> {
  return ma.matchCauseManaged(
    (cause) => Managed.succeedNow(Exit.failCause(cause)),
    (a) => Managed.succeedNow(Exit.succeed(a)),
  );
}

/**
 * Extracts the optional value, or returns the given 'default'.
 *
 * @tsplus fluent fncts.control.Managed justOrElse
 */
export function justOrElse_<R, E, A, B>(self: Managed<R, E, Maybe<A>>, onNothing: Lazy<B>, __tsplusTrace?: string): Managed<R, E, A | B> {
  return self.map((ma) => ma.getOrElse(onNothing()));
}

/**
 * Extracts the optional value, or executes the effect 'default'.
 *
 * @tsplus fluent fncts.control.Managed justOrElseManaged
 */
export function justOrElseManaged_<R, E, A, R1, E1, B>(
  self: Managed<R, E, Maybe<A>>,
  onNothing: Lazy<Managed<R1, E1, B>>,
  __tsplusTrace?: string,
): Managed<R & R1, E | E1, A | B> {
  return self.chain((ma) => ma.match(onNothing, Managed.succeedNow));
}

/**
 * Extracts the optional value, or fails with the given error 'e'.
 *
 * @tsplus fluent fncts.control.Managed justOrFailWith
 */
export function justOrFailWith_<R, E, A, E1>(self: Managed<R, E, Maybe<A>>, e: Lazy<E1>, __tsplusTrace?: string): Managed<R, E | E1, A> {
  return self.chain((ma) => ma.match(() => Managed.failNow(e()), Managed.succeedNow));
}

/**
 * Exposes the full cause of failure of this Managed.
 *
 * @tsplus getter fncts.control.Managed sandbox
 */
export function sandbox<R, E, A>(ma: Managed<R, E, A>, __tsplusTrace?: string): Managed<R, Cause<E>, A> {
  return new Managed(ma.io.sandbox);
}

/**
 * Companion helper to `sandbox`. Allows recovery, and partial recovery, from
 * errors and defects alike.
 *
 * @tsplus fluent fncts.control.Managed sandboxWith
 */
export function sandboxWith<R, E, A, R1, E1, B>(
  self: Managed<R, E, A>,
  f: (ma: Managed<R, Cause<E>, A>) => Managed<R1, Cause<E1>, B>,
  __tsplusTrace?: string,
): Managed<R & R1, E | E1, B> {
  return f(self.sandbox).unsandbox;
}

/**
 * Evaluate each effect in the structure from left to right, and collect the
 * results. For a parallel version, see `sequenceIterableC`.
 *
 * @tsplus static fncts.control.ManagedOps sequenceIterable
 */
export function sequenceIterable<R, E, A>(mas: Iterable<Managed<R, E, A>>, __tsplusTrace?: string): Managed<R, E, Conc<A>> {
  return Managed.foreach(mas, identity);
}

/**
 * Evaluate each effect in the structure from left to right, and discard the
 * results. For a parallel version, see `sequenceIterableUnitC`.
 *
 * @tsplus static fncts.control.ManagedOps sequenceIterableUnit
 */
export function sequenceIterableUnit<R, E, A>(mas: Iterable<Managed<R, E, A>>, __tsplusTrace?: string): Managed<R, E, void> {
  return Managed.foreachDiscard(mas, identity);
}

/**
 * Swaps the error and result
 *
 * @tsplus getter fncts.control.Managed swap
 */
export function swap<R, E, A>(ma: Managed<R, E, A>, __tsplusTrace?: string): Managed<R, A, E> {
  return ma.matchManaged(Managed.succeedNow, Managed.failNow);
}

/**
 * Swap the error and result, then apply an effectful function to the effect
 *
 * @tsplus fluent fncts.control.Managed swapWith
 */
export function swapWith_<R, E, A, R1, E1, B>(
  ma: Managed<R, E, A>,
  f: (me: Managed<R, A, E>) => Managed<R1, B, E1>,
  __tsplusTrace?: string,
): Managed<R1, E1, B> {
  return f(ma.swap).swap;
}

/**
 * Returns a managed that effectfully peeks at the acquired resource.
 *
 * @tsplus fluent fncts.control.Managed tap
 */
export function tap_<R, E, A, Q, D>(
  ma: Managed<R, E, A>,
  f: (a: A) => Managed<Q, D, any>,
  __tsplusTrace?: string,
): Managed<R & Q, E | D, A> {
  return ma.chain((a) => f(a).map(() => a));
}

/**
 * Returns an effect that effectfully peeks at the failure or success of the acquired resource.
 *
 * @tsplus fluent fncts.control.Managed tapBoth
 */
export function tapBoth_<R, E, A, R1, E1, R2, E2>(
  ma: Managed<R, E, A>,
  f: (e: E) => Managed<R1, E1, any>,
  g: (a: A) => Managed<R2, E2, any>,
  __tsplusTrace?: string,
): Managed<R & R1 & R2, E | E1 | E2, A> {
  return ma.matchManaged(
    (e) => f(e).chain(() => Managed.failNow(e)),
    (a) => g(a).map(() => a),
  );
}

/**
 * Returns an effect that effectually peeks at the cause of the failure of
 * the acquired resource.
 *
 * @tsplus fluent fncts.control.Managed tapCause
 */
export function tapCause_<R, E, A, R1, E1>(self: Managed<R, E, A>, f: (c: Cause<E>) => Managed<R1, E1, any>): Managed<R & R1, E | E1, A> {
  return self.catchAllCause((cause) => f(cause).chain(() => Managed.failCauseNow(cause)));
}

/**
 * Returns an effect that effectfully peeks at the failure of the acquired resource.
 *
 * @tsplus fluent fncts.control.Managed tapError
 */
export function tapError_<R, E, A, R1, E1>(ma: Managed<R, E, A>, f: (e: E) => Managed<R1, E1, any>): Managed<R & R1, E | E1, A> {
  return ma.tapBoth(f, Managed.succeedNow);
}

/**
 * Like `Managed#tap`, but uses a function that returns an `IO` value rather than a
 * `Managed` value.
 *
 * @tsplus fluent fncts.control.Managed tapIO
 */
export function tapIO_<R, E, A, R1, E1>(ma: Managed<R, E, A>, f: (a: A) => IO<R1, E1, any>): Managed<R & R1, E | E1, A> {
  return ma.mapIO((a) => f(a).as(a));
}

/**
 * The moral equivalent of `if (!p) exp`
 *
 * @tsplus fluent fncts.control.Managed unless
 */
export function unless_<R, E, A>(self: Managed<R, E, A>, b: Lazy<boolean>, __tsplusTrace?: string): Managed<R, E, void> {
  return Managed.defer(() => (b() ? Managed.unit : self.asUnit));
}

/**
 * The moral equivalent of `if (!p) exp`
 *
 * @tsplus satic fncts.control.ManagedOps unless
 */
export function unless(b: () => boolean) {
  return <R, E, A>(ma: Lazy<Managed<R, E, A>>, __tsplusTrace?: string): Managed<R, E, void> =>
    Managed.defer(() => (b() ? Managed.unit : ma().asUnit));
}

/**
 * The moral equivalent of `if (!p) exp` when `p` has side-effects
 *
 * @tsplus fluent fncts.control.Managed unlessManaged
 */
export function unlessManaged_<R, E, A, R1, E1>(
  ma: Managed<R, E, A>,
  mb: Lazy<Managed<R1, E1, boolean>>,
  __tsplusTrace?: string,
): Managed<R & R1, E | E1, void> {
  return Managed.defer(() => mb().chain((b) => (b ? Managed.unit : ma.asUnit)));
}

/**
 * The moral equivalent of `if (!p) exp` when `p` has side-effects
 *
 * @tsplus satic fncts.control.ManagedOps unlessManaged
 */
export function unlessManaged<R1, E1>(mb: Lazy<Managed<R1, E1, boolean>>) {
  return <R, E, A>(ma: Lazy<Managed<R, E, A>>, __tsplusTrace?: string): Managed<R & R1, E1 | E, void> =>
    Managed.defer(() => mb().chain((b) => (b ? Managed.unit : ma().asUnit)));
}

/**
 * The inverse operation of `sandbox`
 *
 * @tsplus getter fncts.control.Managed unsandbox
 */
export function unsandbox<R, E, A>(self: Managed<R, Cause<E>, A>): Managed<R, E, A> {
  return self.mapErrorCause((c) => c.flatten);
}

/**
 * Unwraps a `Managed` that is inside an `IO`.
 *
 * @tsplus static fncts.control.ManagedOps unwrap
 */
export function unwrap<R, E, R1, E1, A>(fa: IO<R, E, Managed<R1, E1, A>>, __tsplusTrace?: string): Managed<R & R1, E | E1, A> {
  return Managed.fromIO(fa).flatten;
}

/**
 * The moral equivalent of `if (p) exp`
 *
 * @tsplus fluent fncts.control.Managed when
 */
export function when_<R, E, A>(ma: Managed<R, E, A>, b: Lazy<boolean>): Managed<R, E, void> {
  return Managed.defer(() => (b() ? ma.asUnit : Managed.unit));
}

/**
 * The moral equivalent of `if (p) exp`
 *
 * @tsplus static fncts.control.ManagedOps when
 */
export function when(b: Lazy<boolean>) {
  return <R, E, A>(ma: Lazy<Managed<R, E, A>>, __tsplusTrace?: string): Managed<R, E, void> =>
    Managed.defer(() => (b() ? ma().asUnit : Managed.unit));
}

/**
 * The moral equivalent of `if (p) exp` when `p` has side-effects
 *
 * @trace call
 */
export function whenManaged_<R, E, A, R1, E1>(
  ma: Managed<R, E, A>,
  mb: Lazy<Managed<R1, E1, boolean>>,
  __tsplusTrace?: string,
): Managed<R & R1, E | E1, void> {
  return Managed.defer(() => mb().chain((b) => (b ? ma.asUnit : Managed.unit)));
}

/**
 * The moral equivalent of `if (p) exp` when `p` has side-effects
 *
 * @dataFirst whenManaged_
 * @trace call
 */
export function whenManaged<R1, E1>(mb: Lazy<Managed<R1, E1, boolean>>) {
  return <R, E, A>(ma: Lazy<Managed<R, E, A>>, __tsplusTrace?: string): Managed<R & R1, E1 | E, void> =>
    Managed.defer(() => mb().chain((b) => (b ? ma().asUnit : Managed.unit)));
}

/**
 * Returns a managed that executes both this managed and the specified managed,
 * in sequence, combining their results with the specified `f` function.
 *
 * @tsplus fluent fncts.control.Managed zipWith
 */
export function zipWith_<R, E, A, R1, E1, B, C>(
  fa: Managed<R, E, A>,
  fb: Managed<R1, E1, B>,
  f: (a: A, b: B) => C,
  __tsplusTrace?: string,
) {
  return fa.chain((a) => fb.map((b) => f(a, b)));
}

export class GenManaged<R, E, A> {
  readonly _R!: (_R: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => A;

  constructor(readonly M: Managed<R, E, A>, readonly _trace?: string) {}

  *[Symbol.iterator](): Generator<GenManaged<R, E, A>, A, any> {
    return yield this;
  }
}

export const __adapter = (_: any): Managed<unknown, unknown, unknown> => {
  if (Managed.isManaged(_)) {
    return _;
  }
  return Managed.fromIO(_);
};

const adapter = (_: any, __tsplusTrace?: string) => {
  return new GenManaged(__adapter(_), __tsplusTrace);
};

/**
 * @tsplus static fncts.control.ManagedOps gen
 */
export function gen<T extends GenManaged<any, any, any>, A>(
  f: (i: {
    <R, E, A>(_: Managed<R, E, A>, __tsplusTrace?: string): GenManaged<R, E, A>;
    <R, E, A>(_: IO<R, E, A>, __tsplusTrace?: string): GenManaged<R, E, A>;
  }) => Generator<T, A, any>,
): Managed<_R<T>, _E<T>, A> {
  return Managed.defer(() => {
    const iterator = f(adapter as any);
    const state    = iterator.next();

    function run(state: IteratorYieldResult<T> | IteratorReturnResult<A>): Managed<any, any, A> {
      if (state.done) {
        return Managed.succeedNow(state.value);
      }
      return state.value.M.chain((val) => {
        const next = iterator.next(val);
        return run(next);
      });
    }

    return run(state);
  });
}
