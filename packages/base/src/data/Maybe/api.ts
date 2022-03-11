import type { Eq, Monoid } from "../../prelude.js";
import type { Nullable } from "../../types/Nullable.js";
import type { Either } from "../Either.js";
import type { Lazy } from "../function.js";
import type { Predicate } from "../Predicate.js";
import type { Refinement } from "../Refinement.js";
import type { MaybeF } from "./instances.js";

import { Apply } from "../../prelude.js";
import { identity } from "../function.js";
import { Just, Maybe, MaybeTag, Nothing } from "./definition.js";

/**
 * @tsplus fluent fncts.data.Maybe ap
 */
export function ap_<A, B>(self: Maybe<(a: A) => B>, fa: Maybe<A>): Maybe<B> {
  return self._tag === MaybeTag.Just && fa._tag === MaybeTag.Just ? Just(self.value(fa.value)) : Nothing();
}

/**
 * @tsplus static fncts.data.MaybeOps sequenceS
 */
export const sequenceS = Apply.sequenceSF<MaybeF>({ map_, ap_, zipWith_ });

/**
 * Applies `f` to the value contained in `Maybe` if it is `Just` and returns the result,
 * otherwise returns `Nothing`.
 *
 * @tsplus fluent fncts.data.Maybe chain
 */
export function chain_<A, B>(self: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  return self._tag === MaybeTag.Just ? f(self.value) : (self as Nothing);
}

/**
 * @constrained
 */
export function elem_<A>(E: Eq<A>) {
  return (self: Maybe<A>, elem: A): boolean => (self._tag === MaybeTag.Just ? E.equals_(self.value, elem) : false);
}

/**
 * @tsplus fluent fncts.data.Maybe elem
 */
export function elemSelf<A>(self: Maybe<A>) {
  return (E: Eq<A>) =>
    (elem: A): boolean =>
      elem_(E)(self, elem);
}

/**
 * @constrained
 * @tsplus fluent fncts.data.Maybe exists
 */
export function exists_<A>(self: Maybe<A>, p: Predicate<A>): boolean {
  return self._tag === MaybeTag.Just ? p(self.value) : false;
}

/**
 * @tsplus fluent fncts.data.Maybe filter
 */
export function filter_<A, B>(self: Maybe<A>, p: Predicate<A>): Maybe<A>;
export function filter_<A, B extends A>(self: Maybe<A>, p: Refinement<A, B>): Maybe<B>;
export function filter_<A, B>(self: Maybe<A>, p: Predicate<A>): Maybe<A> {
  return self._tag === MaybeTag.Just && p(self.value) ? self : Nothing();
}

/**
 * @tsplus fluent fncts.data.Maybe filter
 */
export function filterMap_<A, B>(self: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  return self.chain(f);
}

/**
 * @tsplus getter fncts.data.Maybe flatten
 */
export function flatten<A>(self: Maybe<Maybe<A>>): Maybe<A> {
  return self.chain(identity);
}

/**
 * @tsplus fluent fncts.data.Maybe partition
 */
export function partition_<A>(self: Maybe<A>, p: Predicate<A>): readonly [Maybe<A>, Maybe<A>];
export function partition_<A, B extends A>(self: Maybe<A>, p: Refinement<A, B>): readonly [Maybe<A>, Maybe<B>];
export function partition_<A>(self: Maybe<A>, p: Predicate<A>): readonly [Maybe<A>, Maybe<A>] {
  return self._tag === MaybeTag.Just && p(self.value) ? [Nothing(), self] : [self, Nothing()];
}

/**
 * @tsplus fluent fncts.data.Maybe partitionMap
 */
export function partitionMap_<A, B, C>(self: Maybe<A>, f: (a: A) => Either<B, C>): readonly [Maybe<B>, Maybe<C>] {
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
 * @tsplus fluent fncts.data.Maybe foldLeft
 */
export function foldLeft_<A, B>(self: Maybe<A>, b: B, f: (b: B, a: A) => B): B {
  return self._tag === MaybeTag.Just ? f(b, self.value) : b;
}

/**
 * @tsplus fluent fncts.data.Maybe foldRight
 */
export function foldRight_<A, B>(self: Maybe<A>, b: B, f: (a: A, b: B) => B): B {
  return self._tag === MaybeTag.Just ? f(self.value, b) : b;
}

/**
 * @constrained
 */
export function foldMap_<M>(M: Monoid<M>) {
  return <A>(self: Maybe<A>, f: (a: A) => M): M => (self._tag === MaybeTag.Just ? f(self.value) : M.nat);
}

/**
 * @tsplus getter fncts.data.Maybe foldMap
 */
export function foldMapSelf<A>(self: Maybe<A>) {
  return <M>(M: Monoid<M>) =>
    (f: (a: A) => M): M =>
      foldMap_(M)(self, f);
}

/**
 * Extracts the value from `Maybe` if it exists, or returns the result of `orElse`.
 *
 * @tsplus fluent fncts.data.Maybe getOrElse
 */
export function getOrElse_<A, B>(self: Maybe<A>, orElse: Lazy<B>): A | B {
  return self._tag === MaybeTag.Just ? self.value : orElse();
}

/**
 * Applies `f` to the value contained in `Maybe` if it is `Just`, otherwise returns `Nothing`.
 *
 * @tsplus fluent fncts.data.Maybe map
 */
export function map_<A, B>(self: Maybe<A>, f: (a: A) => B): Maybe<B> {
  return self._tag === MaybeTag.Just ? Just(f(self.value)) : (self as Nothing);
}

/**
 * `chain` + `fromNullable`
 *
 * @tsplus fluent fncts.data.Maybe mapNullable
 */
export function mapNullable_<A, B>(self: Maybe<A>, f: (a: A) => Nullable<B>): Maybe<NonNullable<B>> {
  return self.chain(Maybe.fromNullableK(f));
}

/**
 * @tsplus fluent fncts.data.Maybe orElse
 */
export function orElse_<A, B>(self: Maybe<A>, fb: Lazy<Maybe<B>>): Maybe<A | B> {
  return self._tag === MaybeTag.Nothing ? fb() : self;
}

/**
 * Extracts the value from `Maybe` if it is `Just`, otherwise returns `undefined`
 *
 * @tsplus getter fncts.data.Maybe value
 */
export function toUndefined<A>(self: Maybe<A>): A | undefined {
  return self.match(() => undefined, identity);
}

/**
 * @tsplus fluent fncts.data.Maybe zipWith
 */
export function zipWith_<A, B, C>(self: Maybe<A>, fb: Maybe<B>, f: (a: A, b: B) => C): Maybe<C> {
  return self._tag === MaybeTag.Just && fb._tag === MaybeTag.Just ? Just(f(self.value, fb.value)) : Nothing();
}

/**
 * @tsplus fluent fncts.data.Maybe zip
 */
export function zip_<A, B>(self: Maybe<A>, that: Maybe<B>): Maybe<readonly [A, B]> {
  return self.zipWith(that, (a, b) => [a, b]);
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst ap_
 */
export function ap<A>(fa: Maybe<A>) {
  return <B>(self: Maybe<(a: A) => B>): Maybe<B> => ap_(self, fa);
}
/**
 * Applies `f` to the value contained in `Maybe` if it is `Just` and returns the result,
 * otherwise returns `Nothing`.
 * @tsplus dataFirst chain_
 */
export function chain<A, B>(f: (a: A) => Maybe<B>) {
  return (self: Maybe<A>): Maybe<B> => chain_(self, f);
}
/**
 * @constrained
 * @tsplus dataFirst exists_
 */
export function exists<A>(p: Predicate<A>) {
  return (self: Maybe<A>): boolean => exists_(self, p);
}
/**
 * @tsplus dataFirst filter_
 */
export function filter<A>(p: Predicate<A>): <B>(self: Maybe<A>) => Maybe<A>;
/**
 * @tsplus dataFirst filter_
 */
export function filter<A, B extends A>(p: Refinement<A, B>): (self: Maybe<A>) => Maybe<B>;
/**
 * @tsplus dataFirst filter_
 */
export function filter<A>(p: Predicate<A>) {
  return <B>(self: Maybe<A>): Maybe<A> => filter_(self, p);
}
/**
 * @tsplus dataFirst filterMap_
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: Maybe<A>): Maybe<B> => filterMap_(self, f);
}
/**
 * @tsplus dataFirst partition_
 */
export function partition<A>(p: Predicate<A>): (self: Maybe<A>) => readonly [Maybe<A>, Maybe<A>];
/**
 * @tsplus dataFirst partition_
 */
export function partition<A, B extends A>(p: Refinement<A, B>): (self: Maybe<A>) => readonly [Maybe<A>, Maybe<B>];
/**
 * @tsplus dataFirst partition_
 */
export function partition<A>(p: Predicate<A>) {
  return (self: Maybe<A>): readonly [Maybe<A>, Maybe<A>] => partition_(self, p);
}
/**
 * @tsplus dataFirst partitionMap_
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: Maybe<A>): readonly [Maybe<B>, Maybe<C>] => partitionMap_(self, f);
}
/**
 * @tsplus dataFirst foldLeft_
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: Maybe<A>): B => foldLeft_(self, b, f);
}
/**
 * @tsplus dataFirst foldRight_
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: Maybe<A>): B => foldRight_(self, b, f);
}
/**
 * Extracts the value from `Maybe` if it exists, or returns the result of `orElse`.
 * @tsplus dataFirst getOrElse_
 */
export function getOrElse<B>(orElse: Lazy<B>) {
  return <A>(self: Maybe<A>): A | B => getOrElse_(self, orElse);
}
/**
 * Applies `f` to the value contained in `Maybe` if it is `Just`, otherwise returns `Nothing`.
 * @tsplus dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Maybe<A>): Maybe<B> => map_(self, f);
}
/**
 * `chain` + `fromNullable`
 * @tsplus dataFirst mapNullable_
 */
export function mapNullable<A, B>(f: (a: A) => Nullable<B>) {
  return (self: Maybe<A>): Maybe<NonNullable<B>> => mapNullable_(self, f);
}
/**
 * @tsplus dataFirst orElse_
 */
export function orElse<B>(fb: Lazy<Maybe<B>>) {
  return <A>(self: Maybe<A>): Maybe<A | B> => orElse_(self, fb);
}
/**
 * @tsplus dataFirst zipWith_
 */
export function zipWith<A, B, C>(fb: Maybe<B>, f: (a: A, b: B) => C) {
  return (self: Maybe<A>): Maybe<C> => zipWith_(self, fb, f);
}
/**
 * @tsplus dataFirst zip_
 */
export function zip<B>(that: Maybe<B>) {
  return <A>(self: Maybe<A>): Maybe<readonly [A, B]> => zip_(self, that);
}
/**
 * @constrained
 * @tsplus dataFirst elem_
 */
export function elem<A>(E: Eq<A>) {
  return (elem: A) => (self: Maybe<A>) => elem_(E)(self, elem);
}
/**
 * @constrained
 * @tsplus dataFirst foldMap_
 */
export function foldMap<M>(M: Monoid<M>) {
  return <A>(f: (a: A) => M) =>
    (self: Maybe<A>) =>
      foldMap_(M)(self, f);
}
// codegen:end
