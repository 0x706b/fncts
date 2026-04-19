import type * as P from "../../typeclass.js";
import type { EitherF } from "./definition.js";

import { identity } from "../function.js";
import { EitherTag, EitherTypeId, Left, Right } from "./definition.js";

/**
 * Applies a function inside an `Either` to a value inside another `Either`.
 *
 * @tsplus pipeable fncts.Either ap
 */
export function ap<A, E2>(fa: Either<E2, A>) {
  return <E1, B>(self: Either<E1, (a: A) => B>): Either<E1 | E2, B> => {
    self.concrete();
    fa.concrete();
    return self._tag === EitherTag.Left ? self : fa._tag === EitherTag.Left ? fa : Right(self.right(fa.right));
  };
}

/**
 * Maps both the left and right sides of an `Either`.
 *
 * @tsplus pipeable fncts.Either bimap
 */
export function bimap<E1, A, E2, B>(f: (e: E1) => E2, g: (a: A) => B) {
  return (self: Either<E1, A>): Either<E2, B> => {
    self.concrete();
    return self._tag === EitherTag.Left ? Left(f(self.left)) : Right(g(self.right));
  };
}

/**
 * Recovers from a `Left` value by running the provided handler.
 *
 * @tsplus pipeable fncts.Either catchAll
 */
export function catchAll<E1, E2, B>(f: (e: E1) => Either<E2, B>) {
  return <A>(self: Either<E1, A>): Either<E2, A | B> => {
    self.concrete();
    return self._tag === EitherTag.Left ? f(self.left) : self;
  };
}

/**
 * Conditionally recovers from a `Left` value using a partial handler.
 *
 * @tsplus pipeable fncts.Either catchJust
 */
export function catchJust<E1, E2, B>(f: (e: E1) => Maybe<Either<E2, B>>) {
  return <A>(self: Either<E1, A>): Either<E1 | E2, A | B> => {
    return self.catchAll((e): Either<E1 | E2, A | B> => f(e).getOrElse(self));
  };
}

/**
 * Maps a `Left` value into a `Right` value.
 *
 * @tsplus pipeable fncts.Either catchMap
 */
export function catchMap<E, B>(f: (e: E) => B) {
  return <A>(self: Either<E, A>): Either<never, A | B> => {
    return self.catchAll((e) => Right(f(e)));
  };
}

/**
 * Chains computations that may fail, propagating the first `Left`.
 *
 * @tsplus pipeable fncts.Either flatMap
 */
export function flatMap<A, E2, B>(f: (a: A) => Either<E2, B>) {
  return <E1>(self: Either<E1, A>): Either<E1 | E2, B> => {
    self.concrete();
    return self._tag === EitherTag.Left ? self : f(self.right);
  };
}

/**
 * Folds over the `Right` value from the left with an initial accumulator.
 *
 * @tsplus pipeable fncts.Either foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return <E>(self: Either<E, A>): B => {
    self.concrete();
    return self._tag === EitherTag.Left ? b : f(b, self.right);
  };
}

/**
 * Maps a `Right` value to a monoid and returns the monoid identity on `Left`.
 *
 * @tsplus pipeable fncts.Either foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>) {
  return <E>(self: Either<E, A>): M => {
    self.concrete();
    return self._tag === EitherTag.Left ? M.nat : f(self.right);
  };
}

/**
 * Folds over the `Right` value from the right with an initial accumulator.
 *
 * @tsplus pipeable fncts.Either foldRight
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return <E>(self: Either<E, A>): B => {
    self.concrete();
    return self._tag === EitherTag.Left ? b : f(self.right, b);
  };
}

/**
 * Extracts the left value as a `Maybe`.
 *
 * @tsplus getter fncts.Either getLeft
 */
export function getLeft<E, A>(self: Either<E, A>): Maybe<E> {
  return self.match(
    (e) => Just(e),
    (_a) => Nothing(),
  );
}

/**
 * Returns the `Right` value or computes a fallback from the `Left` value.
 *
 * @tsplus pipeable fncts.Either getOrElse
 */
export function getOrElse<E, B>(orElse: (e: E) => B) {
  return <A>(self: Either<E, A>): A | B => {
    return self.match(orElse, identity);
  };
}

/**
 * Extracts the right value as a `Maybe`.
 *
 * @tsplus getter fncts.Either getRight
 */
export function getRight<E, A>(self: Either<E, A>): Maybe<A> {
  return self.match(
    (_e) => Nothing(),
    (a) => Just(a),
  );
}

/**
 * Checks whether a value is an `Either`.
 *
 * @tsplus static fncts.EitherOps isEither
 */
export function isEither(u: unknown): u is Either<unknown, unknown> {
  return isObject(u) && EitherTypeId in u;
}

/**
 * Returns true when this `Either` is a `Left`.
 *
 * @tsplus fluent fncts.Either isLeft
 *
 * @tsplus static fncts.EitherOps isLeft
 */
export function isLeft<E, A>(self: Either<E, A>): self is Left<E> {
  self.concrete();
  return self._tag === EitherTag.Left;
}

/**
 * Returns true when this `Either` is a `Right`.
 *
 * @tsplus fluent fncts.Either isRight
 *
 * @tsplus static fncts.EitherOps isRight
 */
export function isRight<E, A>(self: Either<E, A>): self is Right<A> {
  self.concrete();
  return self._tag === EitherTag.Right;
}

/**
 * Maps the `Right` value.
 *
 * @tsplus static fncts.EitherOps map
 *
 * @tsplus pipeable fncts.Either map
 */
export function map<A, B>(f: (a: A) => B) {
  return <E>(self: Either<E, A>): Either<E, B> => {
    self.concrete();
    return self._tag === EitherTag.Left ? self : Right(f(self.right));
  };
}

/**
 * Maps the `Left` value.
 *
 * @tsplus pipeable fncts.Either mapLeft
 */
export function mapLeft<E1, E2>(f: (e: E1) => E2) {
  return <A>(self: Either<E1, A>): Either<E2, A> => {
    self.concrete();
    return self._tag === EitherTag.Left ? Left(f(self.left)) : self;
  };
}

/**
 * Merges both sides into a single value.
 *
 * @tsplus getter fncts.Either value
 */
export function merge<E, A>(self: Either<E, A>): E | A {
  return self.match(identity, identity);
}

/**
 * Returns the fallback `Either` when this value is `Left`.
 *
 * @tsplus pipeable fncts.Either orElse
 */
export function orElse<E2, B>(that: Lazy<Either<E2, B>>) {
  return <E1, A>(self: Either<E1, A>): Either<E1 | E2, A | B> => {
    self.concrete();
    return self._tag === EitherTag.Left ? that() : self;
  };
}

/**
 * Swaps left and right sides.
 *
 * @tsplus getter fncts.Either swap
 */
export function swap<E, A>(self: Either<E, A>): Either<A, E> {
  self.concrete();
  return self._tag === EitherTag.Left ? Right(self.left) : Left(self.right);
}

/**
 * Traverses the `Right` value with an applicative effect.
 *
 * @tsplus getter fncts.Either traverse
 */
export function traverse_<E, A>(self: Either<E, A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E1, B>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E1, B>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E1, Either<E, B>> =>
      self.match(
        (e) => G.pure(Left(e)),
        (a) => f(a).pipe(G.map((b) => Right(b))),
      );
}

export const traverse: P.Traversable<EitherF>["traverse"] = (A) => (f) => (self) => self.traverse(A)(f);

/**
 * Keeps a `Right` value only when it satisfies the predicate.
 *
 * @tsplus pipeable fncts.Either filter
 */
export function filter<E, A>(f: Predicate<A>, /** @tsplus auto */ M: P.Monoid<E>) {
  return (self: Either<E, A>): Either<E, A> => {
    self.concrete();
    return self._tag === EitherTag.Left ? self : f(self.right) ? self : Left(M.nat);
  };
}

/**
 * Maps and filters a `Right` value with a `Maybe`-returning function.
 *
 * @tsplus pipeable fncts.Either filterMap
 */
export function filterMap<E, A, B>(f: (a: A) => Maybe<B>, /** @tsplus auto */ M: P.Monoid<E>) {
  return (self: Either<E, A>): Either<E, B> => {
    self.concrete();
    return self._tag === EitherTag.Left
      ? self
      : f(self.right).match(
          () => Left(M.nat),
          (b) => Right(b),
        );
  };
}

/**
 * Partitions a `Right` value based on a predicate.
 *
 * @tsplus pipeable fncts.Either partition
 */
export function partition<E, A>(p: Predicate<A>, /** @tsplus auto */ M: P.Monoid<E>) {
  return (self: Either<E, A>): readonly [Either<E, A>, Either<E, A>] => {
    self.concrete();
    return self._tag === EitherTag.Left ? [self, self] : p(self.right) ? [Left(M.nat), self] : [self, Left(M.nat)];
  };
}

/**
 * Partitions a `Right` value by mapping it to another `Either`.
 *
 * @tsplus pipeable fncts.Either partitionMap
 */
export function partitionMap<E, A, B, C>(f: (a: A) => Either<B, C>, /** @tsplus auto */ M: P.Monoid<E>) {
  return (self: Either<E, A>): readonly [Either<E, B>, Either<E, C>] => {
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
  };
}

/**
 * Converts an `Either` to `Maybe`, discarding the `Left` value.
 *
 * @tsplus getter fncts.Either toMaybe
 */
export function toMaybe<E, A>(self: Either<E, A>): Maybe<A> {
  return self.match(
    () => Nothing(),
    (a) => Just(a),
  );
}

/**
 * Combines two `Either` values into a tuple when both are `Right`.
 *
 * @tsplus pipeable fncts.Either zip
 */
export function zip<E1, B>(that: Either<E1, B>) {
  return <E, A>(self: Either<E, A>): Either<E | E1, Zipped.Make<A, B>> => {
    return self.zipWith(that, (a, b) => Zipped(a, b));
  };
}

/**
 * Combines two `Either` values with a function when both are `Right`.
 *
 * @tsplus pipeable fncts.Either zipWith
 */
export function zipWith<A, E2, B, C>(fb: Either<E2, B>, f: (a: A, b: B) => C) {
  return <E1>(self: Either<E1, A>): Either<E1 | E2, C> => {
    self.concrete();
    fb.concrete();
    return self._tag === EitherTag.Left ? self : fb._tag === EitherTag.Left ? fb : Right(f(self.right, fb.right));
  };
}

// codegen:start { preset: barrel, include: api/*.ts }
export * from "./api/align.js";
export * from "./api/alignWith.js";
// codegen:end
