import type { Eq, Monoid } from "@fncts/base/typeclass";
import type { Nullable } from "@fncts/base/types";

import { identity } from "../function.js";
import { MaybeTag } from "./definition.js";

/**
 * Applies a function inside a `Maybe` to a value inside another `Maybe`.
 *
 * @tsplus pipeable fncts.Maybe ap
 */
export function ap<A>(fa: Maybe<A>) {
  return <B>(self: Maybe<(a: A) => B>): Maybe<B> => {
    self.concrete();
    fa.concrete();
    return self._tag === MaybeTag.Just && fa._tag === MaybeTag.Just ? Just(self.value(fa.value)) : Nothing();
  };
}

/**
 * Returns true if this `Maybe` contains the specified value.
 *
 * @tsplus pipeable fncts.Maybe elem
 */
export function elem<A>(elem: A, /** @tsplus auto */ E: Eq<A>) {
  return (self: Maybe<A>): boolean => {
    self.concrete();
    return self._tag === MaybeTag.Just ? E.equals(elem)(self.value) : false;
  };
}

/**
 * Keeps the value only if it satisfies the predicate.
 *
 * @tsplus pipeable fncts.Maybe filter
 */
export function filter<A>(p: Predicate<A>): (self: Maybe<A>) => Maybe<A>;
export function filter<A, B extends A>(p: Refinement<A, B>): (self: Maybe<A>) => Maybe<B>;
export function filter<A>(p: Predicate<A>) {
  return (self: Maybe<A>): Maybe<A> => {
    self.concrete();
    return self._tag === MaybeTag.Just && p(self.value) ? self : Nothing();
  };
}
/**
 * Maps and filters a value with a `Maybe`-returning function.
 *
 * @tsplus pipeable fncts.Maybe filter
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: Maybe<A>): Maybe<B> => {
    return self.flatMap(f);
  };
}
/**
 * Applies `f` to the value contained in `Maybe` if it is `Just` and returns the result,
 * otherwise returns `Nothing`.
 *
 * @tsplus pipeable fncts.Maybe flatMap
 */
export function flatMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: Maybe<A>): Maybe<B> => {
    self.concrete();
    return self._tag === MaybeTag.Just ? f(self.value) : (self as Nothing);
  };
}

/**
 * Flattens a nested `Maybe`.
 *
 * @tsplus getter fncts.Maybe flatten
 */
export function flatten<A>(self: Maybe<Maybe<A>>): Maybe<A> {
  return self.flatMap(identity);
}

/**
 * Folds over the value from the left with an initial accumulator.
 *
 * @tsplus pipeable fncts.Maybe foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: Maybe<A>): B => {
    self.concrete();
    return self._tag === MaybeTag.Just ? f(b, self.value) : b;
  };
}

/**
 * Maps the value to a monoid or returns the monoid identity for `Nothing`.
 *
 * @tsplus pipeable fncts.Maybe foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: Monoid<M>) {
  return (self: Maybe<A>): M => {
    self.concrete();
    return self._tag === MaybeTag.Just ? f(self.value) : M.nat;
  };
}
/**
 * Folds over the value from the right with an initial accumulator.
 *
 * @tsplus pipeable fncts.Maybe foldRight
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: Maybe<A>): B => {
    self.concrete();
    return self._tag === MaybeTag.Just ? f(self.value, b) : b;
  };
}
/**
 * Extracts the value from `Maybe` if it exists, or returns the result of `orElse`.
 *
 * @tsplus pipeable fncts.Maybe getOrElse
 */
export function getOrElse<B>(orElse: Lazy<B>) {
  return <A>(self: Maybe<A>): A | B => {
    self.concrete();
    return self._tag === MaybeTag.Just ? self.value : orElse();
  };
}

/**
 * Returns the contained value or throws if this is `Nothing`.
 *
 * @tsplus getter fncts.Maybe getOrThrow
 */
export function getOrThrow<A>(self: Maybe<A>): A {
  self.concrete();
  switch (self._tag) {
    case MaybeTag.Nothing:
      throw new NoSuchElementError("getOrThrow called on Nothing");
    case MaybeTag.Just:
      return self.value;
  }
}

/**
 * Applies `f` to the value contained in `Maybe` if it is `Just`, otherwise returns `Nothing`.
 *
 * @tsplus pipeable fncts.Maybe map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Maybe<A>): Maybe<B> => {
    self.concrete();
    return self._tag === MaybeTag.Just ? Just(f(self.value)) : (self as Nothing);
  };
}

/**
 * `flatMap(fromNullable)`
 *
 * @tsplus pipeable fncts.Maybe mapNullable
 */
export function mapNullable<A, B>(f: (a: A) => Nullable<B>) {
  return (self: Maybe<A>): Maybe<NonNullable<B>> => {
    return self.flatMap(Maybe.fromNullableK(f));
  };
}

/**
 * Returns the fallback `Maybe` when this value is `Nothing`.
 *
 * @tsplus pipeable fncts.Maybe orElse
 */
export function orElse<B>(fb: Lazy<Maybe<B>>) {
  return <A>(self: Maybe<A>): Maybe<A | B> => {
    self.concrete();
    return self._tag === MaybeTag.Nothing ? fb() : self;
  };
}
/**
 * Partitions a `Maybe` value based on a predicate.
 *
 * @tsplus pipeable fncts.Maybe partition
 */
export function partition<A>(p: Predicate<A>): (self: Maybe<A>) => readonly [Maybe<A>, Maybe<A>];
export function partition<A, B extends A>(p: Refinement<A, B>): (self: Maybe<A>) => readonly [Maybe<A>, Maybe<B>];
export function partition<A>(p: Predicate<A>) {
  return (self: Maybe<A>): readonly [Maybe<A>, Maybe<A>] => {
    self.concrete();
    return self._tag === MaybeTag.Just && p(self.value) ? [Nothing(), self] : [self, Nothing()];
  };
}

/**
 * Partitions a `Maybe` value by mapping it to an `Either`.
 *
 * @tsplus pipeable fncts.Maybe partitionMap
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: Maybe<A>): readonly [Maybe<B>, Maybe<C>] => {
    self.concrete();
    if (self._tag === MaybeTag.Just) {
      return f(self.value).match(
        (b) => [Just(b), Nothing()],
        (c) => [Nothing(), Just(c)],
      );
    } else {
      return [Nothing(), Nothing()];
    }
  };
}

/**
 * Returns true if this is `Just` and the predicate holds.
 *
 * @tsplus pipeable fncts.Maybe some
 */
export function some<A>(p: Predicate<A>) {
  return (self: Maybe<A>): boolean => {
    self.concrete();
    return self._tag === MaybeTag.Just ? p(self.value) : false;
  };
}

/**
 * Extracts the value from `Maybe` if it is `Just`, otherwise returns `undefined`
 *
 * @tsplus getter fncts.Maybe value
 */
export function toUndefined<A>(self: Maybe<A>): A | undefined {
  return self.match(() => undefined, identity);
}

/**
 * Combines two `Maybe` values into a tuple when both are `Just`.
 *
 * @tsplus pipeable fncts.Maybe zip
 */
export function zip<B>(that: Maybe<B>) {
  return <A>(self: Maybe<A>): Maybe<Zipped.Make<A, B>> => {
    return self.zipWith(that, (a, b) => Zipped(a, b));
  };
}

/**
 * Combines two `Maybe` values with a function when both are `Just`.
 *
 * @tsplus pipeable fncts.Maybe zipWith
 */
export function zipWith<A, B, C>(fb: Maybe<B>, f: (a: A, b: B) => C) {
  return (self: Maybe<A>): Maybe<C> => {
    self.concrete();
    fb.concrete();
    return self._tag === MaybeTag.Just && fb._tag === MaybeTag.Just ? Just(f(self.value, fb.value)) : Nothing();
  };
}
