import type { DatumF } from "@fncts/base/data/Datum/definition";
import type * as P from "@fncts/base/typeclass";
import type { Eq } from "@fncts/base/typeclass/Eq";

import { concrete, DatumTag, Initial, Pending, Refresh, Replete } from "@fncts/base/data/Datum/definition";
import { Zipped } from "@fncts/base/data/Zipped";

import { TheseTag } from "../These.js";

const _Initial = new Initial();

/**
 * @tsplus static fncts.DatumOps initial
 * @tsplus static fncts.Datum.InitialOps __call
 */
export function initial<E = never, A = never>(): Datum<E, A> {
  return _Initial;
}

const _Pending = new Pending();

/**
 * @tsplus static fncts.DatumOps pending
 * @tsplus static fncts.Datum.PendingOps __call
 */
export function pending<E = never, A = never>(): Datum<E, A> {
  return _Pending;
}

/**
 * @tsplus static fncts.DatumOps refresh
 * @tsplus static fncts.Datum.RefreshOps __call
 */
export function refresh<E, A>(value: These<E, A>): Datum<E, A> {
  return new Refresh(value);
}

/**
 * @tsplus static fncts.DatumOps replete
 * @tsplus static fncts.Datum.RepleteOps __call
 */
export function replete<E, A>(value: These<E, A>): Datum<E, A> {
  return new Replete(value);
}

/**
 * @tsplus static fncts.DatumOps refreshLeft
 */
export function refreshLeft<E, A = never>(e: E): Datum<E, A> {
  return Datum.refresh(These.left(e));
}

/**
 * @tsplus static fncts.DatumOps refreshRight
 */
export function refreshRight<E = never, A = never>(a: A): Datum<E, A> {
  return Datum.refresh(These.right(a));
}

/**
 * @tsplus static fncts.DatumOps refreshBoth
 */
export function refreshBoth<E, A>(e: E, a: A): Datum<E, A> {
  return Datum.refresh(These.both(e, a));
}

/**
 * @tsplus static fncts.DatumOps repleteLeft
 */
export function repleteLeft<E, A = never>(e: E): Datum<E, A> {
  return Datum.replete(These.left(e));
}

/**
 * @tsplus static fncts.DatumOps repleteRight
 */
export function repleteRight<E = never, A = never>(a: A): Datum<E, A> {
  return Datum.replete(These.right(a));
}

/**
 * @tsplus static fncts.DatumOps repleteBoth
 */
export function repleteBoth<E, A>(e: E, a: A): Datum<E, A> {
  return Datum.replete(These.both(e, a));
}

/**
 * @tsplus getter fncts.Datum right
 */
export function right<E, A>(self: Datum<E, A>): A | undefined {
  return self.isNonEmpty() ? self.value.rightMaybe.value : undefined;
}

/**
 * @tsplus getter fncts.Datum left
 */
export function left<E, A>(self: Datum<E, A>): E | undefined {
  return self.isNonEmpty() ? self.value.leftMaybe.value : undefined;
}

/**
 * @tsplus fluent fncts.Datum isInitial
 */
export function isInitial<E, A>(self: Datum<E, A>): self is Initial {
  concrete(self);
  return self._tag === DatumTag.Initial;
}

/**
 * @tsplus fluent fncts.Datum isPending
 */
export function isPending<E, A>(self: Datum<E, A>): self is Pending {
  concrete(self);
  return self._tag === DatumTag.Pending;
}

/**
 * @tsplus fluent fncts.Datum isRefresh
 */
export function isRefresh<E, A>(self: Datum<E, A>): self is Refresh<E, A> {
  concrete(self);
  return self._tag === DatumTag.Refresh;
}

/**
 * @tsplus fluent fncts.Datum isReplete
 */
export function isReplete<E, A>(self: Datum<E, A>): self is Replete<E, A> {
  concrete(self);
  return self._tag === DatumTag.Replete;
}

/**
 * @tsplus fluent fncts.Datum isEmpty
 */
export function isEmpty<E, A>(self: Datum<E, A>): self is Initial | Pending {
  return self.isInitial() || self.isPending();
}

/**
 * @tsplus fluent fncts.Datum isNonEmpty
 */
export function isNonEmpty<E, A>(self: Datum<E, A>): self is Refresh<E, A> | Replete<E, A> {
  return self.isRefresh() || self.isReplete();
}

/**
 * @tsplus fluent fncts.Datum isLoading
 */
export function isLoading<E, A>(self: Datum<E, A>): self is Pending | Refresh<E, A> {
  return self.isPending() || self.isRefresh();
}

/**
 * @tsplus getter fncts.Datum rightMaybe
 */
export function rightMaybe<E, A>(self: Datum<E, A>): Maybe<A> {
  return self.isNonEmpty() ? self.value.rightMaybe : Nothing();
}

/**
 * @tsplus getter fncts.Datum leftMaybe
 */
export function leftMaybe<E, A>(self: Datum<E, A>): Maybe<E> {
  return self.isNonEmpty() ? self.value.leftMaybe : Nothing();
}

/**
 * @tsplus getter fncts.Datum condemn
 */
export function condemn<E, A>(self: Datum<E, A>): Datum<E, A> {
  concrete(self);
  switch (self._tag) {
    case DatumTag.Initial:
    case DatumTag.Pending:
      return self;
    case DatumTag.Refresh:
      return self.value.isBoth() ? Datum.refreshLeft(self.value.left) : self;
    case DatumTag.Replete:
      return self.value.isBoth() ? Datum.repleteLeft(self.value.left) : self;
  }
}

/**
 * @tsplus fluent fncts.Datum condemnWhen
 */
export function condemnWhen<E, A>(self: Datum<E, A>, p: Predicate<E>): Datum<E, A> {
  concrete(self);
  switch (self._tag) {
    case DatumTag.Initial:
    case DatumTag.Pending:
      return self;
    case DatumTag.Refresh:
      return self.value.isBoth() && p(self.value.left) ? Datum.refreshLeft(self.value.left) : self;
    case DatumTag.Replete:
      return self.value.isBoth() && p(self.value.left) ? Datum.repleteLeft(self.value.left) : self;
  }
}

/**
 * @tsplus fluent fncts.Datum elem
 */
export function elem<E, A>(self: Datum<E, A>, a: A, /** @tsplus auto */ E: Eq<A>): boolean {
  return self.matchAll({
    Initial: () => false,
    Pending: () => false,
    RefreshLeft: () => false,
    RefreshRight: (value) => E.equals(value, a),
    RefreshBoth: (_, value) => E.equals(value, a),
    RepleteLeft: () => false,
    RepleteRight: (value) => E.equals(value, a),
    RepleteBoth: (_, value) => E.equals(value, a),
  });
}

/**
 * @tsplus fluent fncts.Datum exists
 */
export function exists<E, A, B extends A>(self: Datum<E, A>, p: Refinement<A, B>): self is Datum<E, B>;
export function exists<E, A>(self: Datum<E, A>, p: Predicate<A>): boolean;
export function exists<E, A>(self: Datum<E, A>, p: Predicate<A>): boolean {
  return self.match({
    Initial: () => false,
    Pending: () => false,
    Refresh: (value) => (value.isLeft() ? false : p(value.right)),
    Replete: (value) => (value.isLeft() ? false : p(value.right)),
  });
}

/**
 * @tsplus fluent fncts.Datum extend
 */
export function extend<E, A, B>(self: Datum<E, A>, f: (wa: Datum<E, A>) => B): Datum<never, B> {
  return Datum.repleteRight(f(self));
}

/**
 * @tsplus fluent fncts.Datum filter
 */
export function filter<E, A, B extends A>(self: Datum<E, A>, p: Refinement<A, B>): Datum<E, B>;
export function filter<E, A>(self: Datum<E, A>, p: Predicate<A>): Datum<E, A>;
export function filter<E, A>(self: Datum<E, A>, p: Predicate<A>): Datum<E, A> {
  return self.matchAll({
    Initial: () => self,
    Pending: () => self,
    RefreshLeft: () => self,
    RefreshRight: (a) => (p(a) ? self : Initial()),
    RefreshBoth: (_, a) => (p(a) ? self : Initial()),
    RepleteLeft: () => self,
    RepleteRight: (a) => (p(a) ? self : Initial()),
    RepleteBoth: (_, a) => (p(a) ? self : Initial()),
  });
}

/**
 * @tsplus fluent fncts.Datum filterMap
 */
export function filterMap<E, A, B>(self: Datum<E, A>, f: (a: A) => Maybe<B>): Datum<E, B> {
  return self.match({
    Initial: () => unsafeCoerce(self),
    Pending: () => unsafeCoerce(self),
    Refresh: (value) =>
      value.match2(Datum.refreshLeft, (e, a) =>
        f(a).match(
          () => Datum.initial(),
          (b) => Datum.refresh(These.rightOrBoth(e, b)),
        ),
      ),
    Replete: (value) =>
      value.match2(Datum.repleteLeft, (e, a) =>
        f(a).match(
          () => Datum.initial(),
          (b) => Datum.replete(These.rightOrBoth(e, b)),
        ),
      ),
  });
}

/**
 * @tsplus fluent fncts.Datum flatMap 1
 */
export function flatMap<E, A, E1, B>(self: Datum<E, A>, f: (a: A) => Datum<E1, B>): Datum<E | E1, B> {
  concrete(self);
  switch (self._tag) {
    case DatumTag.Initial:
    case DatumTag.Pending:
      return self;
    case DatumTag.Refresh:
      return self.value.match(
        (e) => Datum.refreshLeft(e),
        f,
        (_, a) => f(a),
      );
    case DatumTag.Replete:
      return self.value.match(
        (e) => Datum.repleteLeft(e),
        f,
        (_, a) => f(a),
      );
  }
}

/**
 * @tsplus fluent fncts.Datum flatMap
 */
export function flatMapCombine<E, A, B>(
  self: Datum<E, A>,
  f: (a: A) => Datum<E, B>,
  /** @tsplus auto */ S: P.Semigroup<E>,
): Datum<E, B> {
  concrete(self);
  switch (self._tag) {
    case DatumTag.Initial:
    case DatumTag.Pending:
      return self;
    case DatumTag.Refresh:
      return self.value.match(
        (e) => Datum.refreshLeft(e),
        f,
        (e, a) => {
          const next = f(a);
          return next.matchAll({
            Initial: () => next,
            Pending: () => next,
            RefreshLeft: () => next,
            RefreshRight: () => next,
            RefreshBoth: (e1, b) => Datum.refreshBoth(S.combine(e, e1), b),
            RepleteLeft: () => next,
            RepleteRight: () => next,
            RepleteBoth: (e1, b) => Datum.repleteBoth(S.combine(e, e1), b),
          });
        },
      );
    case DatumTag.Replete:
      return self.value.match(
        (e) => Datum.refreshLeft(e),
        f,
        (e, a) => {
          const next = f(a);
          return next.matchAll({
            Initial: () => next,
            Pending: () => next,
            RefreshLeft: () => next,
            RefreshRight: () => next,
            RefreshBoth: (e1, b) => Datum.refreshBoth(S.combine(e, e1), b),
            RepleteLeft: () => next,
            RepleteRight: () => next,
            RepleteBoth: (e1, b) => Datum.repleteBoth(S.combine(e, e1), b),
          });
        },
      );
  }
}

/**
 * @tsplus fluent fncts.Datum foldLeft
 */
export function foldLeft<E, A, B>(self: Datum<E, A>, b: B, f: (b: B, a: A) => B): B {
  return self.matchAll({
    Initial: () => b,
    Pending: () => b,
    RefreshLeft: () => b,
    RefreshRight: (a) => f(b, a),
    RefreshBoth: (_, a) => f(b, a),
    RepleteLeft: () => b,
    RepleteRight: (a) => f(b, a),
    RepleteBoth: (_, a) => f(b, a),
  });
}

/**
 * @tsplus fluent fncts.Datum foldMap
 */
export function foldMap<E, A, M>(self: Datum<E, A>, f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>): M {
  return self.matchAll({
    Initial: () => M.nat,
    Pending: () => M.nat,
    RefreshLeft: () => M.nat,
    RefreshRight: f,
    RefreshBoth: (_, a) => f(a),
    RepleteLeft: () => M.nat,
    RepleteRight: f,
    RepleteBoth: (_, a) => f(a),
  });
}

/**
 * @tsplus fluent fncts.Datum foldRight
 */
export function foldRight<E, A, B>(self: Datum<E, A>, b: B, f: (a: A, b: B) => B): B {
  return self.matchAll({
    Initial: () => b,
    Pending: () => b,
    RefreshLeft: () => b,
    RefreshRight: (a) => f(a, b),
    RefreshBoth: (_, a) => f(a, b),
    RepleteLeft: () => b,
    RepleteRight: (a) => f(a, b),
    RepleteBoth: (_, a) => f(a, b),
  });
}

/**
 * @tsplus fluent fncts.Datum getOrElse
 */
export function getOrElse<E, A, B>(self: Datum<E, A>, b: Lazy<B>): A | B {
  return self.rightMaybe.match(b, Function.identity);
}

/**
 * @tsplus fluent fncts.Datum matchAll
 */
export function matchAll<E, A, B, C, D, F, G, H, I, J>(
  self: Datum<E, A>,
  cases: {
    Initial: () => B;
    Pending: () => C;
    RefreshLeft: (e: E) => D;
    RefreshRight: (a: A) => F;
    RefreshBoth: (e: E, a: A) => G;
    RepleteLeft: (e: E) => H;
    RepleteRight: (a: A) => I;
    RepleteBoth: (e: E, a: A) => J;
  },
): B | C | D | F | G | H | I | J {
  concrete(self);
  switch (self._tag) {
    case DatumTag.Initial:
      return cases.Initial();
    case DatumTag.Pending:
      return cases.Pending();
    case DatumTag.Refresh:
      switch (self.value._tag) {
        case TheseTag.Left:
          return cases.RefreshLeft(self.value.left);
        case TheseTag.Right:
          return cases.RefreshRight(self.value.right);
        case TheseTag.Both:
          return cases.RefreshBoth(self.value.left, self.value.right);
      }
    case DatumTag.Replete:
      switch (self.value._tag) {
        case TheseTag.Left:
          return cases.RepleteLeft(self.value.left);
        case TheseTag.Right:
          return cases.RepleteRight(self.value.right);
        case TheseTag.Both:
          return cases.RepleteBoth(self.value.left, self.value.right);
      }
  }
}

/**
 * @tsplus fluent fncts.Datum match
 */
export function match<E, A, B, C, D, F>(
  self: Datum<E, A>,
  cases: {
    Initial: () => B;
    Pending: () => C;
    Refresh: (value: These<E, A>) => D;
    Replete: (value: These<E, A>) => F;
  },
): B | C | D | F {
  concrete(self);
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
 * @tsplus fluent fncts.Datum match3
 */
export function match3<E, A, B, C, D>(
  self: Datum<E, A>,
  onEmpty: (isLoading: boolean) => B,
  onLeft: (e: E, isLoading: boolean) => C,
  onRight: (e: Maybe<E>, a: A, isLoading: boolean) => D,
): B | C | D {
  concrete(self);
  switch (self._tag) {
    case DatumTag.Initial:
      return onEmpty(false);
    case DatumTag.Pending:
      return onEmpty(true);
    case DatumTag.Refresh:
      return self.value.match2(
        (e) => onLeft(e, true),
        (e, a) => onRight(e, a, true),
      );
    case DatumTag.Replete:
      return self.value.match2(
        (e) => onLeft(e, false),
        (e, a) => onRight(e, a, false),
      );
  }
}

/**
 * @tsplus fluent fncts.Datum map
 */
export function map<E, A, B>(self: Datum<E, A>, f: (a: A) => B): Datum<E, B> {
  concrete(self);
  switch (self._tag) {
    case DatumTag.Initial:
    case DatumTag.Pending:
      return self;
    case DatumTag.Refresh:
      return Refresh(self.value.map(f));
    case DatumTag.Replete:
      return Replete(self.value.map(f));
  }
}

/**
 * @tsplus fluent fncts.Datum orElse
 */
export function orElse<E, A, E1, B>(self: Datum<E, A>, that: Lazy<Datum<E1, B>>): Datum<E | E1, A | B> {
  return self.matchAll({
    Initial: that,
    Pending: that,
    RefreshLeft: () => that(),
    RefreshRight: () => self,
    RefreshBoth: () => self,
    RepleteLeft: () => that(),
    RepleteRight: () => self,
    RepleteBoth: () => self,
  });
}

/**
 * @tsplus fluent fncts.Datum partition
 */
export function partition<E, A, B extends A>(self: Datum<E, A>, p: Refinement<A, B>): [Datum<E, A>, Datum<E, B>];
export function partition<E, A>(self: Datum<E, A>, p: Predicate<A>): [Datum<E, A>, Datum<E, A>];
export function partition<E, A>(self: Datum<E, A>, p: Predicate<A>): [Datum<E, A>, Datum<E, A>] {
  return [self.filter(p.invert), self.filter(p)];
}

/**
 * @tsplus fluent fncts.Datum partitionMap
 */
export function partitionMap<E, A, B, C>(self: Datum<E, A>, f: (a: A) => Either<B, C>): [Datum<E, B>, Datum<E, C>] {
  return self.match({
    Initial: () => [Initial(), Initial()],
    Pending: () => [Pending(), Pending()],
    Refresh: (a) =>
      a.match2(
        (e) => [Datum.refreshLeft(e), Datum.refreshLeft(e)],
        (e, a) =>
          f(a).match(
            (b) => [Refresh(These.rightOrBoth(e, b)), Initial()],
            (c) => [Initial(), Refresh(These.rightOrBoth(e, c))],
          ),
      ),
    Replete: (a) =>
      a.match2(
        (e) => [Datum.repleteLeft(e), Datum.repleteLeft(e)],
        (e, a) =>
          f(a).match(
            (b) => [Replete(These.rightOrBoth(e, b)), Initial()],
            (c) => [Initial(), Replete(These.rightOrBoth(e, c))],
          ),
      ),
  });
}

/**
 * @tsplus getter fncts.Datum toLoading
 */
export function toLoading<E, A>(self: Datum<E, A>): Datum<E, A> {
  return self.match({
    Initial: () => Pending(),
    Pending: () => Pending(),
    Refresh: () => self,
    Replete: Datum.refresh,
  });
}

/**
 * @tsplus fluent fncts.Datum traverse
 */
export const traverse: P.Traversable<DatumF>["traverse"] = (self, f, A) =>
  self.match({
    Initial: () => A.pure(Initial()),
    Pending: () => A.pure(Pending()),
    Refresh: (value) =>
      value.match2(
        (e) => A.pure(Datum.refreshLeft(e)),
        (e, a) => f(a).map((b) => Refresh(These.rightOrBoth(e, b))),
      ),
    Replete: (value) =>
      value.match2(
        (e) => A.pure(Datum.refreshLeft(e)),
        (e, a) => f(a).map((b) => Replete(These.rightOrBoth(e, b))),
      ),
  });

/**
 * @tsplus fluent fncts.Datum zip 1
 */
export function zip<E, A, E1, B>(self: Datum<E, A>, that: Datum<E1, B>): Datum<E | E1, Zipped.Make<A, B>> {
  return self.zipWith(that, (a, b) => Zipped(a, b));
}

/**
 * @tsplus fluent fncts.Datum zip
 */
export function zipCombine<E, A, B>(
  self: Datum<E, A>,
  that: Datum<E, B>,
  /** @tsplus auto */ S: P.Semigroup<E>,
): Datum<E, Zipped.Make<A, B>> {
  return self.zipWith(that, (a, b) => Zipped(a, b));
}

/**
 * @tsplus fluent fncts.Datum zipWith 1
 */
export function zipWith<E, A, E1, B, C>(self: Datum<E, A>, that: Datum<E1, B>, f: (a: A, b: B) => C): Datum<E | E1, C> {
  concrete(self);
  concrete(that);
  if (self.isEmpty()) {
    return self;
  }
  if (that.isEmpty()) {
    return that;
  }
  const c = (self.value as These<E | E1, A>).zipWith(that.value, f, { combine: (_, y) => y });
  return self.isRefresh() || that.isRefresh() ? Refresh(c) : Replete(c);
}

/**
 * @tsplus fluent fncts.Datum zipWith
 */
export function zipWithCombine<E, A, B, C>(
  self: Datum<E, A>,
  that: Datum<E, B>,
  f: (a: A, b: B) => C,
  /** @tsplus auto */ S: P.Semigroup<E>,
): Datum<E, C> {
  concrete(self);
  concrete(that);
  if (self.isEmpty()) {
    return self;
  }
  if (that.isEmpty()) {
    return that;
  }
  const c = self.value.zipWith(that.value, f);
  return self.isRefresh() || that.isRefresh() ? Refresh(c) : Replete(c);
}
