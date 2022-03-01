import type { Cause } from "../../data/Cause";
import type { FIO, URIO } from "../IO";
import type { Pull } from "./Pull";

import { Conc } from "../../collection/immutable/Conc";
import { Exit } from "../../data/Exit";
import { Just, Maybe, Nothing } from "../../data/Maybe";
import { IO } from "../IO";

/**
 * A `Take<E, A>` represents a single `take` from a queue modeling a stream of
 * values. A `Take` may be a failure cause `Cause<E>`, an chunk value `A`
 * or an end-of-stream marker.
 *
 * @tsplus type fncts.control.Stream.Take
 * @tsplus companion fncts.control.Stream.TakeOps
 */
export class Take<E, A> {
  readonly _E!: () => E;
  readonly _A!: () => A;

  constructor(readonly exit: Exit<Maybe<E>, Conc<A>>) {}
}

/**
 * Transforms `Take[E, A]` to `Effect[R, E, B]`.
 *
 * @tsplus getter fncts.control.Stream.Take done
 */
export function done<E, A>(self: Take<E, A>): FIO<Maybe<E>, Conc<A>> {
  return IO.fromExitNow(self.exit);
}

/**
 * Folds over the failure cause, success value and end-of-stream marker to
 * yield a value.
 *
 * @tsplus fluent fncts.control.Stream.Take match
 */
export function match_<E, A, Z>(self: Take<E, A>, end: Z, error: (cause: Cause<E>) => Z, value: (chunk: Conc<A>) => Z): Z {
  return self.exit.match((cause) => cause.flipCauseMaybe.match(() => end, error), value);
}

/**
 * Effectful version of `Take#fold`.
 *
 * Folds over the failure cause, success value and end-of-stream marker to
 * yield an effect.
 *
 * @tsplus fluent fncts.control.Stream.Take matchIO
 */
export function matchIO_<R, R1, R2, E, E1, E2, E3, A, Z>(
  self: Take<E, A>,
  end: IO<R, E1, Z>,
  error: (cause: Cause<E>) => IO<R1, E2, Z>,
  value: (chunk: Conc<A>) => IO<R2, E3, Z>,
): IO<R & R1 & R2, E1 | E2 | E3, Z> {
  return self.exit.match((cause) => cause.flipCauseMaybe.match(() => end, error), value);
}

/**
 * Checks if this `take` is done (`Take.end`).
 *
 * @tsplus getter fncts.control.Stream.Take isDone
 */
export function isDone<E, A>(self: Take<E, A>): boolean {
  return self.exit.match(
    (cause) => cause.flipCauseMaybe.isNothing(),
    () => false,
  );
}

/**
 * Checks if this `take` is a failure.
 *
 * @tsplus getter fncts.control.Stream.Take isFailure
 */
export function isFailure<E, A>(self: Take<E, A>): boolean {
  return self.exit.match(
    (cause) => cause.flipCauseMaybe.isJust(),
    () => false,
  );
}

/**
 * Checks if this `take` is a success.
 *
 * @tsplus getter fncts.control.Stream.Take isSuccess
 */
export function isSuccess<E, A>(self: Take<E, A>): boolean {
  return self.exit.match(
    () => false,
    () => true,
  );
}

/**
 * Transforms `Take<E, A>` to `Take<E, B>` by applying function `f`.
 *
 * @tsplus fluent fncts.control.Stream.Take map
 */
export function map_<E, A, B>(self: Take<E, A>, f: (a: A) => B): Take<E, B> {
  return new Take(self.exit.map((chunk) => chunk.map(f)));
}

/**
 * Returns an effect that effectfully "peeks" at the success of this take.
 *
 * @tsplus fluent fncts.control.Stream.Take tap
 */
export function tap_<R, E, E1, A>(self: Take<E, A>, f: (chunk: Conc<A>) => IO<R, E1, any>): IO<R, E1, void> {
  return self.exit.foreachIO(f);
}

/**
 * Creates a `Take<never, A>` with a singleton chunk.
 *
 * @tsplus static fncts.control.Stream.TakeOps single
 */
export function single<A>(a: A): Take<never, A> {
  return new Take(Exit.succeed(Conc.single(a)));
}

/**
 * Creates a `Take[Nothing, A]` with the specified chunk.
 *
 * @tsplus static fncts.control.Stream.TakeOps chunk
 */
export function chunk<A>(as: Conc<A>): Take<never, A> {
  return new Take(Exit.succeed(as));
}

/**
 * Creates a failing `Take<E, unknown>` with the specified failure.
 *
 * @tsplus static fncts.control.Stream.TakeOps fail
 */
export function fail<E>(e: E): Take<E, never> {
  return new Take(Exit.fail(Just(e)));
}

/**
 * Creates an effect from `Effect<R, E,A>` that does not fail, but succeeds with the `Take<E, A>`.
 * Error from stream when pulling is converted to `Take.halt`. Creates a singleton chunk.
 *
 * @tsplus static fncts.control.Stream.TakeOps fromIO
 */
export function fromIO<R, E, A>(effect: IO<R, E, A>): URIO<R, Take<E, A>> {
  return effect.matchCause((cause) => failCause(cause), single);
}

/**
 * Creates effect from `Pull<R, E, A>` that does not fail, but succeeds with the `Take<E, A>`.
 * Error from stream when pulling is converted to `Take.halt`, end of stream to `Take.end`.
 *
 * @tsplus static fncts.control.Stream.TakeOps fromPull
 */
export function fromPull<R, E, A>(pull: Pull<R, E, A>): URIO<R, Take<E, A>> {
  return pull.matchCause((cause) => cause.flipCauseMaybe.match(() => end, failCause), chunk);
}

/**
 * Creates a failing `Take<E, never>` with the specified cause.
 *
 * @tsplus static fncts.control.Stream.TakeOps failCause
 */
export function failCause<E>(c: Cause<E>): Take<E, never> {
  return new Take(Exit.failCause(c.map(Maybe.just)));
}

/**
 * Creates a failing `Take<never, never>` with the specified throwable.
 *
 * @tsplus static fncts.control.Stream.TakeOps halt
 */
export function halt<E>(e: E): Take<never, never> {
  return new Take(Exit.halt(e));
}

/**
 * Creates a `Take<E, A>` from `Exit<E, A>`.
 *
 * @tsplus static fncts.control.Stream.TakeOps fromExit
 */
export function fromExit<E, A>(exit: Exit<E, A>): Take<E, A> {
  return new Take(exit.bimap(Maybe.just, Conc.single));
}

/**
 * End-of-stream marker
 */
export const end: Take<never, never> = new Take(Exit.fail(Nothing()));
