import type { Nullable } from "@fncts/base/types";

import { Either, Left, Right } from "./definition.js";

/**
 * @tsplus static fncts.EitherOps left
 * @tsplus static fncts.Either.LeftOps __call
 */
export function left<E = never, A = never>(e: E): Either<E, A> {
  return new Left(e);
}

/**
 * @tsplus static fncts.EitherOps right
 * @tsplus static fncts.Either.RightOps __call
 */
export function right<E = never, A = never>(a: A): Either<E, A> {
  return new Right(a);
}

/**
 * @tsplus static fncts.EitherOps fromMaybe
 * @tsplus fluent fncts.Maybe toEither
 */
export function fromMaybe_<E, A>(self: Maybe<A>, nothing: Lazy<E>): Either<E, A> {
  return self.match(
    () => Left(nothing()),
    (a) => Right(a),
  );
}

/**
 * @tsplus static fncts.EitherOps fromNullable
 */
export function fromNullable_<E, A>(value: A, nullable: Lazy<E>): Either<E, NonNullable<A>> {
  return value == null ? Left(nullable()) : Right(value as NonNullable<A>);
}

/**
 * @tsplus static fncts.EitherOps fromNullableK
 */
export function fromNullableK<E, P extends ReadonlyArray<unknown>, A>(
  f: (...params: P) => Nullable<A>,
  nullable: Lazy<E>,
): (...params: P) => Either<E, NonNullable<A>> {
  return (...params) => Either.fromNullable(f(...params), nullable);
}

/**
 * @tsplus static fncts.EitherOps fromPredicate
 */
export function fromPredicate_<E, A, B extends A>(value: A, p: Refinement<A, B>, otherwise: (a: A) => E): Either<E, B>;
export function fromPredicate_<E, A>(value: A, p: Predicate<A>, otherwise: (a: A) => E): Either<E, A>;
export function fromPredicate_<E, A>(value: A, p: Predicate<A>, otherwise: (a: A) => E): Either<E, A> {
  return p(value) ? Right(value) : left(otherwise(value));
}

/**
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
 * @tsplus static fncts.EitherOps tryCatchK
 */
export function tryCatchK<P extends ReadonlyArray<unknown>, E, A>(
  f: (...params: P) => A,
  exception: (e: unknown) => E,
): (...params: P) => Either<E, A> {
  return (...params) => Either.tryCatch(() => f(...params), exception);
}
