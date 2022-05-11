import type * as P from "../../typeclass.js";
import type { EitherF } from "./definition.js";

import { hasTypeId } from "../../util/predicates.js";
import { identity } from "../function.js";
import { concrete } from "./definition.js";
import { EitherTag, EitherTypeId, Left, Right } from "./definition.js";

/**
 * @tsplus fluent fncts.Either ap
 */
export function ap_<E1, A, E2, B>(self: Either<E1, (a: A) => B>, fa: Either<E2, A>): Either<E1 | E2, B> {
  self.concrete();
  fa.concrete();
  return self._tag === EitherTag.Left ? self : fa._tag === EitherTag.Left ? fa : Right(self.right(fa.right));
}

/**
 * @tsplus fluent fncts.Either bimap
 */
export function bimap_<E1, A, E2, B>(self: Either<E1, A>, f: (e: E1) => E2, g: (a: A) => B): Either<E2, B> {
  self.concrete();
  return self._tag === EitherTag.Left ? Left(f(self.left)) : Right(g(self.right));
}

/**
 * @tsplus fluent fncts.Either catchAll
 */
export function catchAll_<E1, A, E2, B>(self: Either<E1, A>, f: (e: E1) => Either<E2, B>): Either<E2, A | B> {
  self.concrete();
  return self._tag === EitherTag.Left ? f(self.left) : self;
}

/**
 * @tsplus fluent fncts.Either catchJust
 */
export function catchJust_<E1, A, E2, B>(
  self: Either<E1, A>,
  f: (e: E1) => Maybe<Either<E2, B>>,
): Either<E1 | E2, A | B> {
  return self.catchAll((e): Either<E1 | E2, A | B> => f(e).getOrElse(self));
}

/**
 * @tsplus fluent fncts.Either catchMap
 */
export function catchMap_<E, A, B>(self: Either<E, A>, f: (e: E) => B): Either<never, A | B> {
  return self.catchAll((e) => Right(f(e)));
}

/**
 * @tsplus fluent fncts.Either flatMap
 */
export function flatMap_<E1, A, E2, B>(self: Either<E1, A>, f: (a: A) => Either<E2, B>): Either<E1 | E2, B> {
  self.concrete();
  return self._tag === EitherTag.Left ? self : f(self.right);
}

/**
 * @tsplus fluent fncts.Either foldLeft
 */
export function foldLeft_<E, A, B>(self: Either<E, A>, b: B, f: (b: B, a: A) => B): B {
  self.concrete();
  return self._tag === EitherTag.Left ? b : f(b, self.right);
}

/**
 * @tsplus fluent fncts.Either foldRight
 */
export function foldRight_<E, A, B>(self: Either<E, A>, b: B, f: (a: A, b: B) => B): B {
  self.concrete();
  return self._tag === EitherTag.Left ? b : f(self.right, b);
}

/**
 * @tsplus fluent fncts.Either foldMap
 */
export function foldMap_<E, A, M>(self: Either<E, A>, f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>): M {
  self.concrete();
  return self._tag === EitherTag.Left ? M.nat : f(self.right);
}

/**
 * @tsplus getter fncts.Either getLeft
 */
export function getLeft<E, A>(self: Either<E, A>): Maybe<E> {
  return self.match(
    (e) => Just(e),
    (_a) => Nothing(),
  );
}

/**
 * @tsplus getter fncts.Either getRight
 */
export function getRight<E, A>(self: Either<E, A>): Maybe<A> {
  return self.match(
    (_e) => Nothing(),
    (a) => Just(a),
  );
}

/**
 * @tsplus fluent fncts.Either getOrElse
 */
export function getOrElse_<E, A, B>(self: Either<E, A>, orElse: (e: E) => B): A | B {
  return self.match(orElse, identity);
}

/**
 * @tsplus static fncts.EitherOps isEither
 */
export function isEither(u: unknown): u is Either<unknown, unknown> {
  return hasTypeId(u, EitherTypeId);
}

/**
 * @tsplus fluent fncts.Either isLeft
 * @tsplus static fncts.EitherOps isLeft
 */
export function isLeft<E, A>(self: Either<E, A>): self is Left<E> {
  self.concrete();
  return self._tag === EitherTag.Left;
}

/**
 * @tsplus fluent fncts.Either isRight
 * @tsplus static fncts.EitherOps isRight
 */
export function isRight<E, A>(self: Either<E, A>): self is Right<A> {
  self.concrete();
  return self._tag === EitherTag.Right;
}

/**
 * @tsplus fluent fncts.Either map
 */
export function map_<E, A, B>(self: Either<E, A>, f: (a: A) => B): Either<E, B> {
  self.concrete();
  return self._tag === EitherTag.Left ? self : Right(f(self.right));
}

/**
 * @tsplus fluent fncts.Either mapLeft
 */
export function mapLeft_<E1, A, E2>(self: Either<E1, A>, f: (e: E1) => E2): Either<E2, A> {
  self.concrete();
  return self._tag === EitherTag.Left ? Left(f(self.left)) : self;
}

/**
 * @tsplus getter fncts.Either value
 */
export function merge<E, A>(self: Either<E, A>): E | A {
  return self.match(identity, identity);
}

/**
 * @tsplus fluent fncts.Either orElse
 */
export function orElse_<E1, A, E2, B>(self: Either<E1, A>, that: Lazy<Either<E2, B>>): Either<E1 | E2, A | B> {
  self.concrete();
  return self._tag === EitherTag.Left ? that() : self;
}

/**
 * @tsplus getter fncts.Either swap
 */
export function swap<E, A>(self: Either<E, A>): Either<A, E> {
  self.concrete();
  return self._tag === EitherTag.Left ? Right(self.left) : Left(self.right);
}

/**
 * @tsplus fluent fncts.Either traverse
 */
export const traverse_: P.Traversable<EitherF>["traverse"] = (self, f, A) =>
  self.match(
    (e) => A.pure(Left(e)),
    (a) => f(a).map((b) => Right(b), A),
  );

export function zipWith_<E1, A, E2, B, C>(
  self: Either<E1, A>,
  fb: Either<E2, B>,
  f: (a: A, b: B) => C,
): Either<E1 | E2, C> {
  self.concrete();
  fb.concrete();
  return self._tag === EitherTag.Left ? self : fb._tag === EitherTag.Left ? fb : Right(f(self.right, fb.right));
}

/**
 * @tsplus fluent fncts.Either filterMap
 */
export function filterMap<E, A, B>(
  self: Either<E, A>,
  f: (a: A) => Maybe<B>,
  /** @tsplus auto */ M: P.Monoid<E>,
): Either<E, B> {
  self.concrete();
  return self._tag === EitherTag.Left
    ? self
    : f(self.right).match(
        () => Left(M.nat),
        (b) => Right(b),
      );
}

/**
 * @tsplus fluent fncts.Either filter
 */
export function filter<E, A>(self: Either<E, A>, f: Predicate<A>, /** @tsplus auto */ M: P.Monoid<E>): Either<E, A> {
  self.concrete();
  return self._tag === EitherTag.Left ? self : f(self.right) ? self : Left(M.nat);
}

/**
 * @tsplus fluent fncts.Either partitionMap
 */
export function partitionMap<E, A, B, C>(
  self: Either<E, A>,
  f: (a: A) => Either<B, C>,
  /** @tsplus auto */ M: P.Monoid<E>,
): readonly [Either<E, B>, Either<E, C>] {
  self.concrete();
  if (self._tag === EitherTag.Left) {
    return [self, self];
  }
  const fb: Either<B, C> = f(self.right);
  fb.concrete();
  switch (fb._tag) {
    case EitherTag.Left:
      return [Right(fb.left), Left(M.nat)];
    case EitherTag.Right:
      return [Left(M.nat), fb];
  }
}

/**
 * @tsplus fluent fncts.Either partition
 */
export function partition<E, A>(
  self: Either<E, A>,
  p: Predicate<A>,
  /** @tsplus auto */ M: P.Monoid<E>,
): readonly [Either<E, A>, Either<E, A>] {
  self.concrete();
  return self._tag === EitherTag.Left ? [self, self] : p(self.right) ? [Left(M.nat), self] : [self, Left(M.nat)];
}

// codegen:start { preset: barrel, include: api/*.ts }
export * from "./api/align.js";
export * from "./api/alignWith.js";
// codegen:end
