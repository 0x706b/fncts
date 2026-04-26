import type { Nullable } from "@fncts/base/types";

import { Either, Left, Right } from "./definition.js";

/**
 * Converts a `Maybe` to an `Either`, using `nothing` for the `Left` case.
 *
 * @tsplus static fncts.EitherOps fromMaybe
 *
 * @tsplus pipeable fncts.Maybe toEither
 */
export function fromMaybe<E>(nothing: Lazy<E>) {
  return <A>(self: Maybe<A>): Either<E, A> => {
    return self.match(
      () => Left(nothing()),
      (a) => Right(a),
    );
  };
}

/**
 * Converts a nullable value to an `Either`.
 *
 * @tsplus static fncts.EitherOps fromNullable
 */
export function fromNullable<E, A>(value: A, nullable: Lazy<E>): Either<E, NonNullable<A>> {
  return value == null ? Left(nullable()) : Right(value as NonNullable<A>);
}

/**
 * Lifts a nullable-returning function into one returning `Either`.
 *
 * @tsplus static fncts.EitherOps fromNullableK
 */
export function fromNullableK<E, P extends ReadonlyArray<unknown>, A>(
  f: (...params: P) => Nullable<A>,
  nullable: Lazy<E>,
): (...params: P) => Either<E, NonNullable<A>> {
  return (...params) => Either.fromNullable(f(...params), nullable);
}

/**
 * Builds an `Either` from a value and predicate.
 *
 * @tsplus static fncts.EitherOps fromPredicate
 */
export function fromPredicate<E, A, B extends A>(value: A, p: Refinement<A, B>, otherwise: (a: A) => E): Either<E, B>;
export function fromPredicate<E, A>(value: A, p: Predicate<A>, otherwise: (a: A) => E): Either<E, A>;
export function fromPredicate<E, A>(value: A, p: Predicate<A>, otherwise: (a: A) => E): Either<E, A> {
  return p(value) ? Right(value) : left(otherwise(value));
}
/**
 * Constructs a `Left` value.
 *
 * @tsplus static fncts.EitherOps left
 *
 * @tsplus static fncts.Either.LeftOps __call
 */
export function left<E = never, A = never>(e: E, __tsplusTrace?: string): Either<E, A> {
  return new Left(e, __tsplusTrace);
}
/**
 * Constructs a `Right` value.
 *
 * @tsplus static fncts.EitherOps right
 *
 * @tsplus static fncts.Either.RightOps __call
 */
export function right<E = never, A = never>(a: A, __tsplusTrace?: string): Either<E, A> {
  return new Right(a, __tsplusTrace);
}

/**
 * Executes a thunk and converts thrown errors into `Left` values.
 *
 * @tsplus static fncts.EitherOps tryCatch
 */
export function tryCatch<E, A>(thunk: () => A, exception: (e: unknown) => E): Either<E, A> {
  try {
    return Right(thunk());
  } catch (e) {
    return Left(exception(e));
  }
}

/**
 * Lifts a throwing function into one returning `Either`.
 *
 * @tsplus static fncts.EitherOps tryCatchK
 */
export function tryCatchK<P extends ReadonlyArray<unknown>, E, A>(
  f: (...params: P) => A,
  exception: (e: unknown) => E,
): (...params: P) => Either<E, A> {
  return (...params) => Either.tryCatch(() => f(...params), exception);
}
