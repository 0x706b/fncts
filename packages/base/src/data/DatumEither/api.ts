import type { DatumEitherF } from "@fncts/base/data/DatumEither/definition";
import type * as P from "@fncts/base/typeclass";

import * as _ from "@fncts/base/data/Datum/api";
import { DatumTag } from "@fncts/base/data/Datum/definition";
import { EitherTag } from "@fncts/base/data/Either";

import { EitherT } from "../EitherT/definition.js";

const _Initial: DatumEither<never, never> = Datum.initial();

/**
 * @tsplus static fncts.DatumEitherOps initial
 */
export function initial<E = never, A = never>(): DatumEither<E, A> {
  return _Initial;
}

const _Pending: DatumEither<never, never> = Datum.pending();

/**
 * @tsplus static fncts.DatumEitherOps pending
 */
export function pending<E = never, A = never>(): DatumEither<E, A> {
  return _Pending;
}

/**
 * @tsplus static fncts.DatumEitherOps refreshLeft
 */
export function refreshLeft<E, A = never>(e: E): DatumEither<E, A> {
  return Datum.refresh(Either.left(e));
}

/**
 * @tsplus static fncts.DatumEitherOps refreshRight
 */
export function refreshRight<E = never, A = never>(a: A): DatumEither<E, A> {
  return Datum.replete(Either.right(a));
}

/**
 * @tsplus static fncts.DatumEitherOps repleteLeft
 */
export function repleteLeft<E, A = never>(e: E): DatumEither<E, A> {
  return Datum.replete(Either.left(e));
}

/**
 * @tsplus static fncts.DatumEitherOps repleteRight
 */
export function repleteRight<E = never, A = never>(a: A): DatumEither<E, A> {
  return Datum.replete(Either.right(a));
}

/**
 * @tsplus fluent fncts.DatumEither bimap
 */
export const bimap: <E, A, E1, B>(self: DatumEither<E, A>, f: (e: E) => E1, g: (a: A) => B) => DatumEither<E1, B> =
  EitherT.bimap(Datum.Functor);

/**
 * @tsplus fluent fncts.DatumEither exists
 */
export function exists<E, A, B extends A>(self: DatumEither<E, A>, p: Refinement<A, B>): self is DatumEither<E, B>;
export function exists<E, A>(self: DatumEither<E, A>, p: Predicate<A>): boolean;
export function exists<E, A>(self: DatumEither<E, A>, p: Predicate<A>): boolean {
  return self.match3(
    () => false,
    () => false,
    p,
  );
}

/**
 * @tsplus fluent fncts.DatumEither filter
 */
export function filter<E, A, B extends A>(self: DatumEither<E, A>, p: Refinement<A, B>): DatumEither<E, B>;
export function filter<E, A>(self: DatumEither<E, A>, p: Predicate<A>): DatumEither<E, A>;
export function filter<E, A>(self: DatumEither<E, A>, p: Predicate<A>): DatumEither<E, A> {
  return self.matchAll({
    Initial: () => self,
    Pending: () => self,
    RefreshLeft: () => self,
    RefreshRight: (a) => (p(a) ? self : DatumEither.initial()),
    RepleteLeft: () => self,
    RepleteRight: (a) => (p(a) ? self : DatumEither.initial()),
  });
}

/**
 * @tsplus fluent fncts.DatumEither filterMap
 */
export function filterMap<E, A, B>(self: DatumEither<E, A>, f: (a: A) => Maybe<B>): DatumEither<E, B> {
  return self.matchAll({
    Initial: () => self.unsafeCoerce(),
    Pending: () => self.unsafeCoerce(),
    RefreshLeft: () => self.unsafeCoerce(),
    RefreshRight: (a) =>
      f(a).match(
        () => DatumEither.initial(),
        (b) => DatumEither.refreshRight(b),
      ),
    RepleteLeft: () => self.unsafeCoerce(),
    RepleteRight: (a) =>
      f(a).match(
        () => DatumEither.initial(),
        (b) => DatumEither.repleteRight(b),
      ),
  });
}

/**
 * @tsplus fluent fncts.DatumEither flatMap
 */
export const flatMap: <E, A, E1, B>(
  self: DatumEither<E, A>,
  f: (a: A) => DatumEither<E1, B>,
) => DatumEither<E | E1, B> = EitherT.flatMap(Datum.Monad);

/**
 * @tsplus fluent fncts.DatumEither foldLeft
 */
export function foldLeft<E, A, B>(self: DatumEither<E, A>, b: B, f: (b: B, a: A) => B): B {
  return self.match3(
    () => b,
    () => b,
    (a) => f(b, a),
  );
}

/**
 * @tsplus fluent fncts.DatumEither foldMap
 */
export function foldMap<E, A, M>(self: DatumEither<E, A>, f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>): M {
  return self.match3(
    () => M.nat,
    () => M.nat,
    f,
  );
}

/**
 * @tsplus fluent fncts.DatumEither foldRight
 */
export function foldRight<E, A, B>(self: DatumEither<E, A>, b: B, f: (a: A, b: B) => B): B {
  return self.match3(
    () => b,
    () => b,
    (a) => f(a, b),
  );
}

/**
 * @tsplus fluent fncts.DatumEither getOrElse
 */
export function getOrElse<E, A, B, C>(self: DatumEither<E, A>, onEmpty: () => B, onLeft: (e: E) => C): A | B | C {
  return self.match3(onEmpty, onLeft, Function.identity);
}

/**
 * @tsplus fluent fncts.DatumEither map
 */
export const map: <E, A, B>(self: DatumEither<E, A>, f: (a: A) => B) => DatumEither<E, B> = EitherT.map(Datum.Functor);

/**
 * @tsplus fluent fncts.DatumEither mapLeft
 */
export const mapLeft: <E, A, E1>(self: DatumEither<E, A>, f: (e: E) => E1) => DatumEither<E1, A> = EitherT.mapLeft(
  Datum.Functor,
);

/**
 * @tsplus fluent fncts.DatumEither match
 */
export function match<E, A, B, C, D, F>(
  self: DatumEither<E, A>,
  onInitial: () => B,
  onPending: () => C,
  onLeft: (e: E, isLoading: boolean) => D,
  onRight: (a: A, isLoading: boolean) => F,
): B | C | D | F {
  return self.matchAll({
    Initial: onInitial,
    Pending: onPending,
    RefreshLeft: (e) => onLeft(e, true),
    RefreshRight: (a) => onRight(a, true),
    RepleteLeft: (e) => onLeft(e, false),
    RepleteRight: (a) => onRight(a, false),
  });
}

/**
 * @tsplus fluent fncts.DatumEither match3
 */
export function match3<E, A, B, C, D>(
  self: DatumEither<E, A>,
  onEmpty: (loading: boolean) => B,
  onLeft: (e: E, loading: boolean) => C,
  onRight: (a: A, loading: boolean) => D,
): B | C | D {
  return self.matchAll({
    Initial: () => onEmpty(false),
    Pending: () => onEmpty(true),
    RefreshLeft: (e) => onLeft(e, true),
    RefreshRight: (a) => onRight(a, true),
    RepleteLeft: (e) => onLeft(e, false),
    RepleteRight: (a) => onRight(a, false),
  });
}

/**
 * @tsplus fluent fncts.DatumEither matchAll
 */
export function matchAll<E, A, B, C, D, F, G, H>(
  self: DatumEither<E, A>,
  cases: {
    Initial: () => B;
    Pending: () => C;
    RefreshLeft: (e: E) => D;
    RefreshRight: (a: A) => F;
    RepleteLeft: (e: E) => G;
    RepleteRight: (a: A) => H;
  },
): B | C | D | F | G | H {
  switch (self._tag) {
    case DatumTag.Initial:
      return cases.Initial();
    case DatumTag.Pending:
      return cases.Pending();
    case DatumTag.Refresh:
      Either.concrete(self.value);
      switch (self.value._tag) {
        case EitherTag.Left:
          return cases.RefreshLeft(self.value.left);
        case EitherTag.Right:
          return cases.RefreshRight(self.value.right);
      }
    case DatumTag.Replete:
      Either.concrete(self.value);
      switch (self.value._tag) {
        case EitherTag.Left:
          return cases.RepleteLeft(self.value.left);
        case EitherTag.Right:
          return cases.RepleteRight(self.value.right);
      }
  }
}

/**
 * @tsplus fluent fncts.DatumEither matchEither
 */
export const matchEither: <E, A, B, C, D, F>(
  self: DatumEither<E, A>,
  cases: {
    Initial: () => B;
    Pending: () => C;
    Refresh: (value: Either<E, A>) => D;
    Replete: (value: Either<E, A>) => F;
  },
) => B | C | D | F = _.match;

/**
 * @tsplus fluent fncts.DatumEither orElse
 */
export const orElse: <E, A, E1, B>(
  self: DatumEither<E, A>,
  that: Lazy<DatumEither<E1, B>>,
) => DatumEither<E | E1, A | B> = EitherT.orElse(Datum.Monad);

/**
 * @tsplus fluent fncts.DatumEither partition
 */
export function partition<E, A, B extends A>(
  self: DatumEither<E, A>,
  p: Refinement<A, B>,
): [DatumEither<E, A>, DatumEither<E, B>];
export function partition<E, A>(self: DatumEither<E, A>, p: Predicate<A>): [DatumEither<E, A>, DatumEither<E, A>];
export function partition<E, A>(self: DatumEither<E, A>, p: Predicate<A>): [DatumEither<E, A>, DatumEither<E, A>] {
  return [self.filter(p.invert), self.filter(p)];
}

/**
 * @tsplus fluent fncts.DatumEither partitionMap
 */
export function partitionMap<E, A, B, C>(
  self: DatumEither<E, A>,
  f: (a: A) => Either<B, C>,
): [DatumEither<E, B>, DatumEither<E, C>] {
  return self.matchAll({
    Initial: () => [self.unsafeCoerce(), self.unsafeCoerce()],
    Pending: () => [self.unsafeCoerce(), self.unsafeCoerce()],
    RefreshLeft: () => [self.unsafeCoerce(), self.unsafeCoerce()],
    RefreshRight: (a) =>
      f(a).match(
        (b) => [DatumEither.refreshRight(b), DatumEither.initial()],
        (c) => [DatumEither.initial(), DatumEither.refreshRight(c)],
      ),
    RepleteLeft: () => [self.unsafeCoerce(), self.unsafeCoerce()],
    RepleteRight: (a) =>
      f(a).match(
        (b) => [DatumEither.repleteRight(b), DatumEither.initial()],
        (c) => [DatumEither.initial(), DatumEither.repleteRight(c)],
      ),
  });
}

/**
 * @tsplus getter fncts.DatumEither toPending
 */
export const toPending: <E, A>(self: DatumEither<E, A>) => DatumEither<E, A> = _.toPending;

/**
 * @tsplus getter fncts.DatumEither toReplete
 */
export const toReplete: <E, A>(self: DatumEither<E, A>) => DatumEither<E, A> = _.toReplete;

/**
 * @tsplus fluent fncts.DatumEither traverse
 */
export const traverse: P.Traversable<DatumEitherF>["traverse"] = (self) => (G) => (f) =>
  self.matchAll({
    Initial: () => G.pure(self.unsafeCoerce()),
    Pending: () => G.pure(self.unsafeCoerce()),
    RefreshLeft: () => G.pure(self.unsafeCoerce()),
    RefreshRight: (a) => G.map(f(a), (b) => DatumEither.refreshRight(b)),
    RepleteLeft: () => G.pure(self.unsafeCoerce()),
    RepleteRight: (a) => G.map(f(a), (b) => DatumEither.repleteRight(b)),
  });

/**
 * @tsplus fluent fncts.DatumEither zipWith
 */
export const zipWith: <E, A, E1, B, C>(
  self: DatumEither<E, A>,
  that: DatumEither<E1, B>,
  f: (a: A, b: B) => C,
) => DatumEither<E | E1, C> = EitherT.zipWith(Datum.Apply);

/**
 * @tsplus fluent fncts.DatumEither zip
 */
export function zip<E, A, E1, B>(
  self: DatumEither<E, A>,
  that: DatumEither<E1, B>,
): DatumEither<E | E1, Zipped.Make<A, B>> {
  return self.zipWith(that, (a, b) => Zipped(a, b));
}
