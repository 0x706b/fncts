import type { DatumF } from "@fncts/base/data/Datum/definition";
import type { Eq } from "@fncts/base/data/Eq";
import type * as P from "@fncts/base/typeclass";

import { DatumTag, Initial, Pending, Refresh, Replete } from "@fncts/base/data/Datum/definition";
import { Zipped } from "@fncts/base/data/Zipped";

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
 * @tsplus pipeable fncts.Datum elem
 */
export function elem<A>(a: A, /** @tsplus auto */ E: Eq<A>) {
  return (self: Datum<A>): boolean => {
    return self.match({
      Initial: () => false,
      Pending: () => false,
      Refresh: (value) => E.equals(value)(a),
      Replete: (value) => E.equals(value)(a),
    });
  };
}

/**
 * @tsplus pipeable fncts.Datum some
 */
export function some<A>(p: Predicate<A>) {
  return (self: Datum<A>): boolean => {
    return self.match({
      Initial: () => false,
      Pending: () => false,
      Refresh: p,
      Replete: p,
    });
  };
}

/**
 * @tsplus pipeable fncts.Datum extend
 */
export function extend<A, B>(f: (wa: Datum<A>) => B) {
  return (self: Datum<A>): Datum<B> => {
    return Replete(f(self));
  };
}

/**
 * @tsplus pipeable fncts.Datum filter
 */
export function filter<A, B extends A>(p: Refinement<A, B>): (self: Datum<A>) => Datum<B>;
export function filter<A>(p: Predicate<A>): (self: Datum<A>) => Datum<A>;
export function filter<A>(p: Predicate<A>) {
  return (self: Datum<A>): Datum<A> => {
    return self.match({
      Initial: () => self,
      Pending: () => self,
      Refresh: (a) => (p(a) ? self : Initial()),
      Replete: (a) => (p(a) ? self : Initial()),
    });
  };
}

/**
 * @tsplus pipeable fncts.Datum filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: Datum<A>): Datum<B> => {
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
  };
}

/**
 * @tsplus pipeable fncts.Datum flatMap
 */
export function flatMap<A, B>(f: (a: A) => Datum<B>) {
  return (self: Datum<A>): Datum<B> => {
    if (self.isEmpty()) {
      return self;
    }
    const that = f(self.value);
    if (that.isEmpty()) {
      return that;
    }
    return self.isRefresh() || that.isRefresh() ? Refresh(that.value!) : Replete(that.value!);
  };
}

/**
 * @tsplus pipeable fncts.Datum foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: Datum<A>): B => {
    return self.match({
      Initial: () => b,
      Pending: () => b,
      Refresh: (a) => f(b, a),
      Replete: (a) => f(b, a),
    });
  };
}

/**
 * @tsplus pipeable fncts.Datum foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>) {
  return (self: Datum<A>): M => {
    return self.match({
      Initial: () => M.nat,
      Pending: () => M.nat,
      Refresh: f,
      Replete: f,
    });
  };
}

/**
 * @tsplus pipeable fncts.Datum foldRight
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: Datum<A>): B => {
    return self.match({
      Initial: () => b,
      Pending: () => b,
      Refresh: (a) => f(a, b),
      Replete: (a) => f(a, b),
    });
  };
}

/**
 * @tsplus pipeable fncts.Datum getOrElse
 */
export function getOrElse<B>(b: Lazy<B>) {
  return <A>(self: Datum<A>): A | B => {
    return self.match({
      Initial: b,
      Pending: b,
      Refresh: Function.identity,
      Replete: Function.identity,
    });
  };
}

/**
 * @tsplus pipeable fncts.Datum match
 */
export function match<A, B, C, D, E>(cases: {
  Initial: () => B;
  Pending: () => C;
  Refresh: (a: A) => D;
  Replete: (a: A) => E;
}) {
  return (self: Datum<A>): B | C | D | E => {
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
  };
}

/**
 * @tsplus pipeable fncts.Datum match2
 */
export function match2<A, B, C>(onEmpty: (isLoading: boolean) => B, onValue: (a: A, isLoading: boolean) => C) {
  return (self: Datum<A>): B | C => {
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
  };
}

/**
 * @tsplus pipeable fncts.Datum map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Datum<A>): Datum<B> => {
    switch (self._tag) {
      case DatumTag.Initial:
      case DatumTag.Pending:
        return self;
      case DatumTag.Refresh:
        return Refresh(f(self.value));
      case DatumTag.Replete:
        return Replete(f(self.value));
    }
  };
}

/**
 * @tsplus pipeable fncts.Datum orElse
 */
export function orElse<B>(that: Lazy<Datum<B>>) {
  return <A>(self: Datum<A>): Datum<A | B> => {
    return self.match({
      Initial: that,
      Pending: that,
      Refresh: () => self,
      Replete: () => self,
    });
  };
}

/**
 * @tsplus pipeable fncts.Datum partition
 */
export function partition<A, B extends A>(p: Refinement<A, B>): (self: Datum<A>) => [Datum<A>, Datum<B>];
export function partition<A>(p: Predicate<A>): (self: Datum<A>) => [Datum<A>, Datum<A>];
export function partition<A>(p: Predicate<A>) {
  return (self: Datum<A>): [Datum<A>, Datum<A>] => {
    return [self.filter(p.invert), self.filter(p)];
  };
}

/**
 * @tsplus pipeable fncts.Datum partitionMap
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: Datum<A>): [Datum<B>, Datum<C>] => {
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
  };
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
 * @tsplus getter fncts.Datum traverse
 */
export function _traverse<A>(self: Datum<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E1, B>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E1, B>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E1, Datum<B>> =>
      self.match({
        Initial: () => G.pure(Initial()),
        Pending: () => G.pure(Pending()),
        Refresh: (a) => f(a).pipe(G.map((b) => Refresh(b))),
        Replete: (a) => f(a).pipe(G.map((b) => Replete(b))),
      });
}

export const traverse: P.Traversable<DatumF>["traverse"] = (G) => (f) => (self) => self.traverse(G)(f);

/**
 * @tsplus pipeable fncts.Datum zip
 */
export function zip<B>(that: Datum<B>) {
  return <A>(self: Datum<A>): Datum<Zipped.Make<A, B>> => {
    return self.zipWith(that, (a, b) => Zipped(a, b));
  };
}
/**
 * @tsplus pipeable fncts.Datum zipWith
 */
export function zipWith<A, B, C>(that: Datum<B>, f: (a: A, b: B) => C) {
  return (self: Datum<A>): Datum<C> => {
    if (self.isEmpty()) {
      return self;
    }
    if (that.isEmpty()) {
      return that;
    }
    const c = f(self.value, that.value);
    return self.isRefresh() || that.isRefresh() ? Refresh(c) : Replete(c);
  };
}
