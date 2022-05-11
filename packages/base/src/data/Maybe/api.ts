import type { Eq, Monoid } from "@fncts/base/typeclass";
import type { Nullable } from "@fncts/base/types";

import { identity } from "../function.js";
import { MaybeTag } from "./definition.js";

/**
 * @tsplus fluent fncts.Maybe ap
 */
export function ap_<A, B>(self: Maybe<(a: A) => B>, fa: Maybe<A>): Maybe<B> {
  self.concrete();
  fa.concrete();
  return self._tag === MaybeTag.Just && fa._tag === MaybeTag.Just ? Just(self.value(fa.value)) : Nothing();
}

/**
 * Applies `f` to the value contained in `Maybe` if it is `Just` and returns the result,
 * otherwise returns `Nothing`.
 *
 * @tsplus fluent fncts.Maybe flatMap
 */
export function flatMap_<A, B>(self: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  self.concrete();
  return self._tag === MaybeTag.Just ? f(self.value) : (self as Nothing);
}

/**
 * @tsplus fluent fncts.Maybe elem
 */
export function elem_<A>(self: Maybe<A>, elem: A, E: Eq<A>): boolean {
  self.concrete();
  return self._tag === MaybeTag.Just ? E.equals(self.value, elem) : false;
}

/**
 * @constrained
 * @tsplus fluent fncts.Maybe exists
 */
export function exists_<A>(self: Maybe<A>, p: Predicate<A>): boolean {
  self.concrete();
  return self._tag === MaybeTag.Just ? p(self.value) : false;
}

/**
 * @tsplus fluent fncts.Maybe filter
 */
export function filter_<A, B>(self: Maybe<A>, p: Predicate<A>): Maybe<A>;
export function filter_<A, B extends A>(self: Maybe<A>, p: Refinement<A, B>): Maybe<B>;
export function filter_<A, B>(self: Maybe<A>, p: Predicate<A>): Maybe<A> {
  self.concrete();
  return self._tag === MaybeTag.Just && p(self.value) ? self : Nothing();
}

/**
 * @tsplus fluent fncts.Maybe filter
 */
export function filterMap_<A, B>(self: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  return self.flatMap(f);
}

/**
 * @tsplus getter fncts.Maybe flatten
 */
export function flatten<A>(self: Maybe<Maybe<A>>): Maybe<A> {
  return self.flatMap(identity);
}

/**
 * @tsplus fluent fncts.Maybe partition
 */
export function partition_<A>(self: Maybe<A>, p: Predicate<A>): readonly [Maybe<A>, Maybe<A>];
export function partition_<A, B extends A>(self: Maybe<A>, p: Refinement<A, B>): readonly [Maybe<A>, Maybe<B>];
export function partition_<A>(self: Maybe<A>, p: Predicate<A>): readonly [Maybe<A>, Maybe<A>] {
  self.concrete();
  return self._tag === MaybeTag.Just && p(self.value) ? [Nothing(), self] : [self, Nothing()];
}

/**
 * @tsplus fluent fncts.Maybe partitionMap
 */
export function partitionMap_<A, B, C>(self: Maybe<A>, f: (a: A) => Either<B, C>): readonly [Maybe<B>, Maybe<C>] {
  self.concrete();
  if (self._tag === MaybeTag.Just) {
    return f(self.value).match(
      (b) => [Just(b), Nothing()],
      (c) => [Nothing(), Just(c)],
    );
  } else {
    return [Nothing(), Nothing()];
  }
}

/**
 * @tsplus fluent fncts.Maybe foldLeft
 */
export function foldLeft_<A, B>(self: Maybe<A>, b: B, f: (b: B, a: A) => B): B {
  self.concrete();
  return self._tag === MaybeTag.Just ? f(b, self.value) : b;
}

/**
 * @tsplus fluent fncts.Maybe foldRight
 */
export function foldRight_<A, B>(self: Maybe<A>, b: B, f: (a: A, b: B) => B): B {
  self.concrete();
  return self._tag === MaybeTag.Just ? f(self.value, b) : b;
}

/**
 * @tsplus fluent fncts.Maybe foldMap
 */
export function foldMap_<A, M>(self: Maybe<A>, f: (a: A) => M, /** @tsplus auto */ M: Monoid<M>): M {
  self.concrete();
  return self._tag === MaybeTag.Just ? f(self.value) : M.nat;
}

/**
 * Extracts the value from `Maybe` if it exists, or returns the result of `orElse`.
 *
 * @tsplus fluent fncts.Maybe getOrElse
 */
export function getOrElse_<A, B>(self: Maybe<A>, orElse: Lazy<B>): A | B {
  self.concrete();
  return self._tag === MaybeTag.Just ? self.value : orElse();
}

/**
 * Applies `f` to the value contained in `Maybe` if it is `Just`, otherwise returns `Nothing`.
 *
 * @tsplus fluent fncts.Maybe map
 */
export function map_<A, B>(self: Maybe<A>, f: (a: A) => B): Maybe<B> {
  self.concrete();
  return self._tag === MaybeTag.Just ? Just(f(self.value)) : (self as Nothing);
}

/**
 * `chain` + `fromNullable`
 *
 * @tsplus fluent fncts.Maybe mapNullable
 */
export function mapNullable_<A, B>(self: Maybe<A>, f: (a: A) => Nullable<B>): Maybe<NonNullable<B>> {
  return self.flatMap(Maybe.fromNullableK(f));
}

/**
 * @tsplus fluent fncts.Maybe orElse
 */
export function orElse_<A, B>(self: Maybe<A>, fb: Lazy<Maybe<B>>): Maybe<A | B> {
  self.concrete();
  return self._tag === MaybeTag.Nothing ? fb() : self;
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
 * @tsplus fluent fncts.Maybe zipWith
 */
export function zipWith_<A, B, C>(self: Maybe<A>, fb: Maybe<B>, f: (a: A, b: B) => C): Maybe<C> {
  self.concrete();
  fb.concrete();
  return self._tag === MaybeTag.Just && fb._tag === MaybeTag.Just ? Just(f(self.value, fb.value)) : Nothing();
}

/**
 * @tsplus fluent fncts.Maybe zip
 */
export function zip_<A, B>(self: Maybe<A>, that: Maybe<B>): Maybe<readonly [A, B]> {
  return self.zipWith(that, (a, b) => [a, b]);
}
