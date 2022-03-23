import type * as P from "../../prelude.js";
import type { Lazy } from "../function.js";
import type { Maybe } from "../Maybe.js";
import type { Either } from "./definition.js";
import type { EitherF } from "./instances.js";

import { hasTypeId } from "../../util/predicates.js";
import { identity, unsafeCoerce } from "../function.js";
import { Just, Nothing } from "../Maybe.js";
import { EitherTag, EitherTypeId, Left, Right } from "./definition.js";

/**
 * @tsplus fluent fncts.data.Either ap
 */
export function ap_<E1, A, E2, B>(
  self: Either<E1, (a: A) => B>,
  fa: Either<E2, A>,
): Either<E1 | E2, B> {
  return self._tag === EitherTag.Left
    ? self
    : fa._tag === EitherTag.Left
    ? fa
    : Right(self.right(fa.right));
}

/**
 * @tsplus fluent fncts.data.Either bimap
 */
export function bimap_<E1, A, E2, B>(
  self: Either<E1, A>,
  f: (e: E1) => E2,
  g: (a: A) => B,
): Either<E2, B> {
  return self._tag === EitherTag.Left ? Left(f(self.left)) : Right(g(self.right));
}

/**
 * @tsplus fluent fncts.data.Either catchAll
 */
export function catchAll_<E1, A, E2, B>(
  self: Either<E1, A>,
  f: (e: E1) => Either<E2, B>,
): Either<E2, A | B> {
  return self._tag === EitherTag.Left ? f(self.left) : self;
}

/**
 * @tsplus fluent fncts.data.Either catchJust
 */
export function catchJust_<E1, A, E2, B>(
  self: Either<E1, A>,
  f: (e: E1) => Maybe<Either<E2, B>>,
): Either<E1 | E2, A | B> {
  return self.catchAll((e): Either<E1 | E2, A | B> => f(e).getOrElse(self));
}

/**
 * @tsplus fluent fncts.data.Either catchMap
 */
export function catchMap_<E, A, B>(self: Either<E, A>, f: (e: E) => B): Either<never, A | B> {
  return self.catchAll((e) => Right(f(e)));
}

/**
 * @tsplus fluent fncts.data.Either chain
 */
export function chain_<E1, A, E2, B>(
  self: Either<E1, A>,
  f: (a: A) => Either<E2, B>,
): Either<E1 | E2, B> {
  return self._tag === EitherTag.Left ? self : f(self.right);
}

/**
 * @tsplus fluent fncts.data.Either foldLeft
 */
export function foldLeft_<E, A, B>(self: Either<E, A>, b: B, f: (b: B, a: A) => B): B {
  return self._tag === EitherTag.Left ? b : f(b, self.right);
}

/**
 * @tsplus fluent fncts.data.Either foldRight
 */
export function foldRight_<E, A, B>(self: Either<E, A>, b: B, f: (a: A, b: B) => B): B {
  return self._tag === EitherTag.Left ? b : f(self.right, b);
}

/**
 * @constrained
 */
export function foldMap_<M>(M: P.Monoid<M>) {
  return <E, A>(self: Either<E, A>, f: (a: A) => M): M =>
    self._tag === EitherTag.Left ? M.nat : f(self.right);
}

/**
 * @tsplus getter fncts.data.Either foldMap
 */
export function foldMapSelf<E, A>(self: Either<E, A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (a: A) => M): M =>
      foldMap_(M)(self, f);
}

/**
 * @tsplus getter fncts.data.Either getLeft
 */
export function getLeft<E, A>(self: Either<E, A>): Maybe<E> {
  return self.match(
    (e) => Just(e),
    (_a) => Nothing(),
  );
}

/**
 * @tsplus getter fncts.data.Either getRight
 */
export function getRight<E, A>(self: Either<E, A>): Maybe<A> {
  return self.match(
    (_e) => Nothing(),
    (a) => Just(a),
  );
}

/**
 * @tsplus fluent fncts.data.Either getOrElse
 */
export function getOrElse_<E, A, B>(self: Either<E, A>, orElse: (e: E) => B): A | B {
  return self.match(orElse, identity);
}

/**
 * @tsplus static fncts.data.EitherOps isEither
 */
export function isEither(u: unknown): u is Either<unknown, unknown> {
  return hasTypeId(u, EitherTypeId);
}

/**
 * @tsplus fluent fncts.data.Either isLeft
 * @tsplus static fncts.data.EitherOps isLeft
 */
export function isLeft<E, A>(self: Either<E, A>): self is Left<E> {
  return self._tag === EitherTag.Left;
}

/**
 * @tsplus fluent fncts.data.Either isRight
 * @tsplus static fncts.data.EitherOps isRight
 */
export function isRight<E, A>(self: Either<E, A>): self is Right<A> {
  return self._tag === EitherTag.Right;
}

/**
 * @tsplus fluent fncts.data.Either map
 */
export function map_<E, A, B>(self: Either<E, A>, f: (a: A) => B): Either<E, B> {
  return self._tag === EitherTag.Left ? self : Right(f(self.right));
}

/**
 * @tsplus fluent fncts.data.Either mapLeft
 */
export function mapLeft_<E1, A, E2>(self: Either<E1, A>, f: (e: E1) => E2): Either<E2, A> {
  return self._tag === EitherTag.Left ? Left(f(self.left)) : self;
}

/**
 * @tsplus getter fncts.data.Either value
 */
export function merge<E, A>(self: Either<E, A>): E | A {
  return self.match(identity, identity);
}

/**
 * @tsplus fluent fncts.data.Either orElse
 */
export function orElse_<E1, A, E2, B>(
  self: Either<E1, A>,
  that: Lazy<Either<E2, B>>,
): Either<E1 | E2, A | B> {
  return self._tag === EitherTag.Left ? that() : self;
}

export const sequence: P.sequence<EitherF> = (A) => (self) => traverse_(A)(self, identity);

/**
 * @tsplus getter fncts.data.Either sequence
 */
export const sequenceSelf: P.sequenceSelf<EitherF> = (self) => (A) =>
  unsafeCoerce(traverse_(A)(self, unsafeCoerce(identity)));

/**
 * @tsplus getter fncts.data.Either swap
 */
export function swap<E, A>(self: Either<E, A>): Either<A, E> {
  return self._tag === EitherTag.Left ? Right(self.left) : Left(self.right);
}

export const traverse_: P.traverse_<EitherF> = (A) => (self, f) =>
  self.match(
    (e) => A.pure(Left(e)),
    (a) =>
      pipe(
        f(a),
        A.map((b) => Right(b)),
      ),
  );

export const traverse: P.traverse<EitherF> = (A) => (f) => (self) => traverse_(A)(self, f);

/**
 * @tsplus getter fncts.data.Either traverse
 */
export const traverseSelf: P.traverseSelf<EitherF> = (self) => (A) => (f) => traverse_(A)(self, f);

export function zipWith_<E1, A, E2, B, C>(
  self: Either<E1, A>,
  fb: Either<E2, B>,
  f: (a: A, b: B) => C,
): Either<E1 | E2, C> {
  return self._tag === EitherTag.Left
    ? self
    : fb._tag === EitherTag.Left
    ? fb
    : Right(f(self.right, fb.right));
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst ap_
 */
export function ap<A, E2>(fa: Either<E2, A>) {
  return <E1, B>(self: Either<E1, (a: A) => B>): Either<E1 | E2, B> => ap_(self, fa);
}
/**
 * @tsplus dataFirst bimap_
 */
export function bimap<E1, A, E2, B>(f: (e: E1) => E2, g: (a: A) => B) {
  return (self: Either<E1, A>): Either<E2, B> => bimap_(self, f, g);
}
/**
 * @tsplus dataFirst catchAll_
 */
export function catchAll<E1, E2, B>(f: (e: E1) => Either<E2, B>) {
  return <A>(self: Either<E1, A>): Either<E2, A | B> => catchAll_(self, f);
}
/**
 * @tsplus dataFirst catchJust_
 */
export function catchJust<E1, E2, B>(f: (e: E1) => Maybe<Either<E2, B>>) {
  return <A>(self: Either<E1, A>): Either<E1 | E2, A | B> => catchJust_(self, f);
}
/**
 * @tsplus dataFirst catchMap_
 */
export function catchMap<E, B>(f: (e: E) => B) {
  return <A>(self: Either<E, A>): Either<never, A | B> => catchMap_(self, f);
}
/**
 * @tsplus dataFirst chain_
 */
export function chain<A, E2, B>(f: (a: A) => Either<E2, B>) {
  return <E1>(self: Either<E1, A>): Either<E1 | E2, B> => chain_(self, f);
}
/**
 * @tsplus dataFirst foldLeft_
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return <E>(self: Either<E, A>): B => foldLeft_(self, b, f);
}
/**
 * @tsplus dataFirst foldRight_
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return <E>(self: Either<E, A>): B => foldRight_(self, b, f);
}
/**
 * @tsplus dataFirst getOrElse_
 */
export function getOrElse<E, B>(orElse: (e: E) => B) {
  return <A>(self: Either<E, A>): A | B => getOrElse_(self, orElse);
}
/**
 * @tsplus dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return <E>(self: Either<E, A>): Either<E, B> => map_(self, f);
}
/**
 * @tsplus dataFirst mapLeft_
 */
export function mapLeft<E1, E2>(f: (e: E1) => E2) {
  return <A>(self: Either<E1, A>): Either<E2, A> => mapLeft_(self, f);
}
/**
 * @tsplus dataFirst orElse_
 */
export function orElse<E2, B>(that: Lazy<Either<E2, B>>) {
  return <E1, A>(self: Either<E1, A>): Either<E1 | E2, A | B> => orElse_(self, that);
}
/**
 * @tsplus dataFirst zipWith_
 */
export function zipWith<A, E2, B, C>(fb: Either<E2, B>, f: (a: A, b: B) => C) {
  return <E1>(self: Either<E1, A>): Either<E1 | E2, C> => zipWith_(self, fb, f);
}
/**
 * @constrained
 * @tsplus dataFirst foldMap_
 */
export function foldMap<M>(M: P.Monoid<M>) {
  return <A>(f: (a: A) => M) =>
    <E>(self: Either<E, A>) =>
      foldMap_(M)(self, f);
}
// codegen:end

// codegen:start { preset: barrel, include: api/*.ts }
export * from "./api/align.js";
export * from "./api/alignWith.js";
// codegen:end
