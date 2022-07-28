import type { DatumF } from "@fncts/base/data/Datum/definition";
import type * as P from "@fncts/base/typeclass";
import type { Eq } from "@fncts/base/typeclass/Eq";

import { DatumTag, Initial, Pending, Refresh, Replete } from "@fncts/base/data/Datum/definition";
import { Zipped } from "@fncts/base/data/Zipped";

import { TheseTag } from "../These.js";

const _Initial = new Initial();

/**
 * @tsplus static fncts.DatumOps initial
 * @tsplus static fncts.Datum.InitialOps __call
 */
export function initial<A = never>(): Datum<A> {
  return _Initial;
}

const _Pending = new Pending();

/**
 * @tsplus static fncts.DatumOps pending
 * @tsplus static fncts.Datum.PendingOps __call
 */
export function pending<A = never>(): Datum<A> {
  return _Pending;
}

/**
 * @tsplus static fncts.DatumOps refresh
 * @tsplus static fncts.Datum.RefreshOps __call
 */
export function refresh<A>(value: A): Datum<A> {
  return new Refresh(value);
}

/**
 * @tsplus static fncts.DatumOps replete
 * @tsplus static fncts.Datum.RepleteOps __call
 */
export function replete<A>(value: A): Datum<A> {
  return new Replete(value);
}

/**
 * @tsplus getter fncts.Datum value
 */
export function left<E, A>(self: Datum<A>): A | undefined {
  return self.isNonEmpty() ? self.value : undefined;
}

/**
 * @tsplus fluent fncts.Datum isInitial
 */
export function isInitial<A>(self: Datum<A>): self is Initial {
  return self._tag === DatumTag.Initial;
}

/**
 * @tsplus fluent fncts.Datum isPending
 */
export function isPending<A>(self: Datum<A>): self is Pending {
  return self._tag === DatumTag.Pending;
}

/**
 * @tsplus fluent fncts.Datum isRefresh
 */
export function isRefresh<A>(self: Datum<A>): self is Refresh<A> {
  return self._tag === DatumTag.Refresh;
}

/**
 * @tsplus fluent fncts.Datum isReplete
 */
export function isReplete<A>(self: Datum<A>): self is Replete<A> {
  return self._tag === DatumTag.Replete;
}

/**
 * @tsplus fluent fncts.Datum isEmpty
 */
export function isEmpty<A>(self: Datum<A>): self is Initial | Pending {
  return self.isInitial() || self.isPending();
}

/**
 * @tsplus fluent fncts.Datum isNonEmpty
 */
export function isNonEmpty<A>(self: Datum<A>): self is Refresh<A> | Replete<A> {
  return self.isRefresh() || self.isReplete();
}

/**
 * @tsplus fluent fncts.Datum isLoading
 */
export function isLoading<A>(self: Datum<A>): self is Pending | Refresh<A> {
  return self.isPending() || self.isRefresh();
}

/**
 * @tsplus fluent fncts.Datum elem
 */
export function elem<A>(self: Datum<A>, a: A, /** @tsplus auto */ E: Eq<A>): boolean {
  return self.match({
    Initial: () => false,
    Pending: () => false,
    Refresh: (value) => E.equals(a, value),
    Replete: (value) => E.equals(a, value),
  });
}

/**
 * @tsplus fluent fncts.Datum exists
 */
export function exists<A, B extends A>(self: Datum<A>, p: Refinement<A, B>): self is Datum<B>;
export function exists<A>(self: Datum<A>, p: Predicate<A>): boolean;
export function exists<A>(self: Datum<A>, p: Predicate<A>): boolean {
  return self.match({
    Initial: () => false,
    Pending: () => false,
    Refresh: p,
    Replete: p,
  });
}

/**
 * @tsplus fluent fncts.Datum extend
 */
export function extend<A, B>(self: Datum<A>, f: (wa: Datum<A>) => B): Datum<B> {
  return Replete(f(self));
}

/**
 * @tsplus fluent fncts.Datum filter
 */
export function filter<A, B extends A>(self: Datum<A>, p: Refinement<A, B>): Datum<B>;
export function filter<A>(self: Datum<A>, p: Predicate<A>): Datum<A>;
export function filter<A>(self: Datum<A>, p: Predicate<A>): Datum<A> {
  return self.match({
    Initial: () => self,
    Pending: () => self,
    Refresh: (a) => (p(a) ? self : Initial()),
    Replete: (a) => (p(a) ? self : Initial()),
  });
}

/**
 * @tsplus fluent fncts.Datum filterMap
 */
export function filterMap<A, B>(self: Datum<A>, f: (a: A) => Maybe<B>): Datum<B> {
  return self.match({
    Initial: () => unsafeCoerce(self),
    Pending: () => unsafeCoerce(self),
    Refresh: (value) =>
      f(value).match(
        () => Initial(),
        (b) => Refresh(b),
      ),
    Replete: (value) =>
      f(value).match(
        () => Initial(),
        (b) => Replete(b),
      ),
  });
}

/**
 * @tsplus fluent fncts.Datum flatMap
 */
export function flatMap<A, B>(self: Datum<A>, f: (a: A) => Datum<B>): Datum<B> {
  if (self.isEmpty()) {
    return self;
  }
  const that = f(self.value);

  if (that.isEmpty()) {
    return that;
  }
  return self.isRefresh() || that.isRefresh() ? Refresh(that.value!) : Replete(that.value!);
}

/**
 * @tsplus fluent fncts.Datum foldLeft
 */
export function foldLeft<A, B>(self: Datum<A>, b: B, f: (b: B, a: A) => B): B {
  return self.match({
    Initial: () => b,
    Pending: () => b,
    Refresh: (a) => f(b, a),
    Replete: (a) => f(b, a),
  });
}

/**
 * @tsplus fluent fncts.Datum foldMap
 */
export function foldMap<A, M>(self: Datum<A>, f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>): M {
  return self.match({
    Initial: () => M.nat,
    Pending: () => M.nat,
    Refresh: f,
    Replete: f,
  });
}

/**
 * @tsplus fluent fncts.Datum foldRight
 */
export function foldRight<A, B>(self: Datum<A>, b: B, f: (a: A, b: B) => B): B {
  return self.match({
    Initial: () => b,
    Pending: () => b,
    Refresh: (a) => f(a, b),
    Replete: (a) => f(a, b),
  });
}

/**
 * @tsplus fluent fncts.Datum getOrElse
 */
export function getOrElse<A, B>(self: Datum<A>, b: Lazy<B>): A | B {
  return self.match({
    Initial: b,
    Pending: b,
    Refresh: Function.identity,
    Replete: Function.identity,
  });
}

/**
 * @tsplus fluent fncts.Datum match
 */
export function match<A, B, C, D, E>(
  self: Datum<A>,
  cases: {
    Initial: () => B;
    Pending: () => C;
    Refresh: (a: A) => D;
    Replete: (a: A) => E;
  },
): B | C | D | E {
  switch (self._tag) {
    case DatumTag.Initial:
      return cases.Initial();
    case DatumTag.Pending:
      return cases.Pending();
    case DatumTag.Refresh:
      return cases.Refresh(self.value);
    case DatumTag.Replete:
      return cases.Replete(self.value);
  }
}

/**
 * @tsplus fluent fncts.Datum match2
 */
export function match2<A, B, C>(
  self: Datum<A>,
  onEmpty: (isLoading: boolean) => B,
  onValue: (a: A, isLoading: boolean) => C,
): B | C {
  switch (self._tag) {
    case DatumTag.Initial:
      return onEmpty(false);
    case DatumTag.Pending:
      return onEmpty(true);
    case DatumTag.Refresh:
      return onValue(self.value, true);
    case DatumTag.Replete:
      return onValue(self.value, false);
  }
}

/**
 * @tsplus fluent fncts.Datum map
 */
export function map<A, B>(self: Datum<A>, f: (a: A) => B): Datum<B> {
  switch (self._tag) {
    case DatumTag.Initial:
    case DatumTag.Pending:
      return self;
    case DatumTag.Refresh:
      return Refresh(f(self.value));
    case DatumTag.Replete:
      return Replete(f(self.value));
  }
}

/**
 * @tsplus fluent fncts.Datum orElse
 */
export function orElse<A, B>(self: Datum<A>, that: Lazy<Datum<B>>): Datum<A | B> {
  return self.match({
    Initial: that,
    Pending: that,
    Refresh: () => self,
    Replete: () => self,
  });
}

/**
 * @tsplus fluent fncts.Datum partition
 */
export function partition<A, B extends A>(self: Datum<A>, p: Refinement<A, B>): [Datum<A>, Datum<B>];
export function partition<A>(self: Datum<A>, p: Predicate<A>): [Datum<A>, Datum<A>];
export function partition<A>(self: Datum<A>, p: Predicate<A>): [Datum<A>, Datum<A>] {
  return [self.filter(p.invert), self.filter(p)];
}

/**
 * @tsplus fluent fncts.Datum partitionMap
 */
export function partitionMap<A, B, C>(self: Datum<A>, f: (a: A) => Either<B, C>): [Datum<B>, Datum<C>] {
  return self.match({
    Initial: () => [Initial(), Initial()],
    Pending: () => [Pending(), Pending()],
    Refresh: (a) =>
      f(a).match(
        (b) => [Refresh(b), Initial()],
        (c) => [Initial(), Refresh(c)],
      ),
    Replete: (a) =>
      f(a).match(
        (b) => [Replete(b), Initial()],
        (c) => [Initial(), Replete(c)],
      ),
  });
}

/**
 * @tsplus getter fncts.Datum toPending
 */
export function toPending<A>(self: Datum<A>): Datum<A> {
  return self.isEmpty() ? self : Refresh(self.value);
}

/**
 * @tsplus getter fncts.Datum toReplete
 */
export function toReplete<A>(self: Datum<A>): Datum<A> {
  return self.isEmpty() ? self : Replete(self.value);
}

/**
 * @tsplus fluent fncts.Datum traverse
 */
export const traverse: P.Traversable<DatumF>["traverse"] = (self) => (A) => (f) =>
  self.match({
    Initial: () => A.pure(Initial()),
    Pending: () => A.pure(Pending()),
    Refresh: (a) => A.map(f(a), (b) => Refresh(b)),
    Replete: (a) => A.map(f(a), (b) => Replete(b)),
  });

/**
 * @tsplus fluent fncts.Datum zip
 */
export function zip<A, B>(self: Datum<A>, that: Datum<B>): Datum<Zipped.Make<A, B>> {
  return self.zipWith(that, (a, b) => Zipped(a, b));
}

/**
 * @tsplus fluent fncts.Datum zipWith
 */
export function zipWith<A, B, C>(self: Datum<A>, that: Datum<B>, f: (a: A, b: B) => C): Datum<C> {
  if (self.isEmpty()) {
    return self;
  }
  if (that.isEmpty()) {
    return that;
  }
  const c = f(self.value, that.value);
  return self.isRefresh() || that.isRefresh() ? Refresh(c) : Replete(c);
}
