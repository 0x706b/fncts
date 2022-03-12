import type { Nullable } from "../../types/Nullable.js";
import type { Lazy } from "../function.js";
import type { Maybe } from "../Maybe.js";
import type { Predicate } from "../Predicate.js";
import type { Refinement } from "../Refinement.js";

import { Either, Left, Right } from "./definition.js";

/**
 * @tsplus static fncts.data.EitherOps left
 * @tsplus static fncts.data.Either.LeftOps __call
 */
export function left<E = never, A = never>(e: E): Either<E, A> {
  return new Left(e);
}

/**
 * @tsplus static fncts.data.EitherOps right
 * @tsplus static fncts.data.Either.RightOps __call
 */
export function right<E = never, A = never>(a: A): Either<E, A> {
  return new Right(a);
}

/**
 * @tsplus static fncts.data.EitherOps fromMaybe
 * @tsplus fluent fncts.data.Maybe toEither
 */
export function fromMaybe_<E, A>(self: Maybe<A>, nothing: Lazy<E>): Either<E, A> {
  return self.match(
    () => Left(nothing()),
    (a) => Right(a),
  );
}

/**
 * @tsplus static fncts.data.EitherOps fromNullable
 */
export function fromNullable_<E, A>(value: A, nullable: Lazy<E>): Either<E, NonNullable<A>> {
  return value == null ? Left(nullable()) : Right(value as NonNullable<A>);
}

/**
 * @tsplus static fncts.data.EitherOps fromNullableK
 */
export function fromNullableK<E, P extends ReadonlyArray<unknown>, A>(
  f: (...params: P) => Nullable<A>,
  nullable: Lazy<E>,
): (...params: P) => Either<E, NonNullable<A>> {
  return (...params) => Either.fromNullable(f(...params), nullable);
}

/**
 * @tsplus static fncts.data.EitherOps fromPredicate
 */
export function fromPredicate_<E, A, B extends A>(
  value: A,
  p: Refinement<A, B>,
  otherwise: (a: A) => E,
): Either<E, B>;
export function fromPredicate_<E, A>(
  value: A,
  p: Predicate<A>,
  otherwise: (a: A) => E,
): Either<E, A>;
export function fromPredicate_<E, A>(
  value: A,
  p: Predicate<A>,
  otherwise: (a: A) => E,
): Either<E, A> {
  return p(value) ? Right(value) : left(otherwise(value));
}

/**
 * @tsplus static fncts.data.EitherOps tryCatch
 */
export function tryCatch<E, A>(thunk: () => A, exception: (e: unknown) => E): Either<E, A> {
  try {
    return Right(thunk());
  } catch (e) {
    return Left(exception(e));
  }
}

/**
 * @tsplus static fncts.data.EitherOps tryCatchK
 */
export function tryCatchK<P extends ReadonlyArray<unknown>, E, A>(
  f: (...params: P) => A,
  exception: (e: unknown) => E,
): (...params: P) => Either<E, A> {
  return (...params) => Either.tryCatch(() => f(...params), exception);
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst fromMaybe_
 */
export function fromMaybe<E>(nothing: Lazy<E>) {
  return <A>(self: Maybe<A>): Either<E, A> => fromMaybe_(self, nothing);
}
/**
 * @tsplus dataFirst fromNullable_
 */
export function fromNullable<E>(nullable: Lazy<E>) {
  return <A>(value: A): Either<E, NonNullable<A>> => fromNullable_(value, nullable);
}
/**
 * @tsplus dataFirst fromPredicate_
 */
export function fromPredicate<E, A, B extends A>(
  p: Refinement<A, B>,
  otherwise: (a: A) => E,
): (value: A) => Either<E, B>;
/**
 * @tsplus dataFirst fromPredicate_
 */
export function fromPredicate<E, A>(
  p: Predicate<A>,
  otherwise: (a: A) => E,
): (value: A) => Either<E, A>;
/**
 * @tsplus dataFirst fromPredicate_
 */
export function fromPredicate<E, A>(p: Predicate<A>, otherwise: (a: A) => E) {
  return (value: A): Either<E, A> => fromPredicate_(value, p, otherwise);
}
// codegen:end
