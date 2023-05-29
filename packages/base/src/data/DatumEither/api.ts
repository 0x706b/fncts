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
 * @tsplus pipeable fncts.DatumEither bimap
 */
export const bimap: <E, A, E1, B>(f: (e: E) => E1, g: (a: A) => B) => (self: DatumEither<E, A>) => DatumEither<E1, B> =
  EitherT.bimap(Datum.Functor);

/**
 * @tsplus pipeable fncts.DatumEither exists
 */
export function exists<A, B extends A>(p: Refinement<A, B>): <E>(self: DatumEither<E, A>) => self is DatumEither<E, B>;
export function exists<A>(p: Predicate<A>): <E>(self: DatumEither<E, A>) => boolean;
export function exists<A>(p: Predicate<A>) {
  return <E>(self: DatumEither<E, A>): boolean => {
    return self.match3(
      () => false,
      () => false,
      p,
    );
  };
}

/**
 * @tsplus pipeable fncts.DatumEither filter
 */
export function filter<A, B extends A>(p: Refinement<A, B>): <E>(self: DatumEither<E, A>) => DatumEither<E, B>;
export function filter<A>(p: Predicate<A>): <E>(self: DatumEither<E, A>) => DatumEither<E, A>;
export function filter<A>(p: Predicate<A>) {
  return <E>(self: DatumEither<E, A>): DatumEither<E, A> => {
    return self.matchAll({
      Initial: () => self,
      Pending: () => self,
      RefreshLeft: () => self,
      RefreshRight: (a) => (p(a) ? self : DatumEither.initial()),
      RepleteLeft: () => self,
      RepleteRight: (a) => (p(a) ? self : DatumEither.initial()),
    });
  };
}

/**
 * @tsplus pipeable fncts.DatumEither filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return <E>(self: DatumEither<E, A>): DatumEither<E, B> => {
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
  };
}

/**
 * @tsplus pipeable fncts.DatumEither flatMap
 */
export const flatMap: <A, E1, B>(
  f: (a: A) => DatumEither<E1, B>,
) => <E>(self: DatumEither<E, A>) => DatumEither<E | E1, B> = EitherT.flatMap(Datum.Monad);

/**
 * @tsplus pipeable fncts.DatumEither foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return <E>(self: DatumEither<E, A>): B => {
    return self.match3(
      () => b,
      () => b,
      (a) => f(b, a),
    );
  };
}

/**
 * @tsplus pipeable fncts.DatumEither foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>) {
  return <E>(self: DatumEither<E, A>): M => {
    return self.match3(
      () => M.nat,
      () => M.nat,
      f,
    );
  };
}

/**
 * @tsplus pipeable fncts.DatumEither foldRight
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return <E>(self: DatumEither<E, A>): B => {
    return self.match3(
      () => b,
      () => b,
      (a) => f(a, b),
    );
  };
}

/**
 * @tsplus pipeable fncts.DatumEither getOrElse
 */
export function getOrElse<E, B, C>(onEmpty: () => B, onLeft: (e: E) => C) {
  return <A>(self: DatumEither<E, A>): A | B | C => {
    return self.match3(onEmpty, onLeft, Function.identity);
  };
}

/**
 * @tsplus pipeable fncts.DatumEither map
 */
export const map: <E, A, B>(f: (a: A) => B) => (self: DatumEither<E, A>) => DatumEither<E, B> = EitherT.map(
  Datum.Functor,
);

/**
 * @tsplus pipeable fncts.DatumEither mapLeft
 */
export const mapLeft: <E, E1>(f: (e: E) => E1) => <A>(self: DatumEither<E, A>) => DatumEither<E1, A> = EitherT.mapLeft(
  Datum.Functor,
);

/**
 * @tsplus pipeable fncts.DatumEither match
 */
export function match<E, A, B, C, D, F>(
  onInitial: () => B,
  onPending: () => C,
  onLeft: (e: E, isLoading: boolean) => D,
  onRight: (a: A, isLoading: boolean) => F,
) {
  return (self: DatumEither<E, A>): B | C | D | F => {
    return self.matchAll({
      Initial: onInitial,
      Pending: onPending,
      RefreshLeft: (e) => onLeft(e, true),
      RefreshRight: (a) => onRight(a, true),
      RepleteLeft: (e) => onLeft(e, false),
      RepleteRight: (a) => onRight(a, false),
    });
  };
}

/**
 * @tsplus pipeable fncts.DatumEither match3
 */
export function match3<E, A, B, C, D>(
  onEmpty: (loading: boolean) => B,
  onLeft: (e: E, loading: boolean) => C,
  onRight: (a: A, loading: boolean) => D,
) {
  return (self: DatumEither<E, A>): B | C | D => {
    return self.matchAll({
      Initial: () => onEmpty(false),
      Pending: () => onEmpty(true),
      RefreshLeft: (e) => onLeft(e, true),
      RefreshRight: (a) => onRight(a, true),
      RepleteLeft: (e) => onLeft(e, false),
      RepleteRight: (a) => onRight(a, false),
    });
  };
}

/**
 * @tsplus pipeable fncts.DatumEither matchAll
 */
export function matchAll<E, A, B, C, D, F, G, H>(cases: {
  Initial: () => B;
  Pending: () => C;
  RefreshLeft: (e: E) => D;
  RefreshRight: (a: A) => F;
  RepleteLeft: (e: E) => G;
  RepleteRight: (a: A) => H;
}) {
  return (self: DatumEither<E, A>): B | C | D | F | G | H => {
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
  };
}

/**
 * @tsplus pipeable fncts.DatumEither matchEither
 */
export const matchEither: <E, A, B, C, D, F>(cases: {
  Initial: () => B;
  Pending: () => C;
  Refresh: (value: Either<E, A>) => D;
  Replete: (value: Either<E, A>) => F;
}) => (self: DatumEither<E, A>) => B | C | D | F = _.match;

/**
 * @tsplus pipeable fncts.DatumEither orElse
 */
export const orElse: <E1, B>(
  that: Lazy<DatumEither<E1, B>>,
) => <E, A>(self: DatumEither<E, A>) => DatumEither<E | E1, A | B> = EitherT.orElse(Datum.Monad);

/**
 * @tsplus pipeable fncts.DatumEither partition
 */
export function partition<A, B extends A>(
  p: Refinement<A, B>,
): <E>(self: DatumEither<E, A>) => [DatumEither<E, A>, DatumEither<E, B>];
export function partition<A>(p: Predicate<A>): <E>(self: DatumEither<E, A>) => [DatumEither<E, A>, DatumEither<E, A>];
export function partition<A>(p: Predicate<A>) {
  return <E>(self: DatumEither<E, A>): [DatumEither<E, A>, DatumEither<E, A>] => {
    return [self.filter(p.invert), self.filter(p)];
  };
}

/**
 * @tsplus pipeable fncts.DatumEither partitionMap
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return <E>(self: DatumEither<E, A>): [DatumEither<E, B>, DatumEither<E, C>] => {
    return self.matchAll({
      Initial: () => [self.unsafeCoerce(), self.unsafeCoerce()],
      Pending: () => [self.unsafeCoerce(), self.unsafeCoerce()],
      RefreshLeft: () => [self.unsafeCoerce(), self.unsafeCoerce()],
      RefreshRight: (a) =>
        f(a).match({
          Left: (b) => [DatumEither.refreshRight(b), DatumEither.initial()],
          Right: (c) => [DatumEither.initial(), DatumEither.refreshRight(c)],
        }),
      RepleteLeft: () => [self.unsafeCoerce(), self.unsafeCoerce()],
      RepleteRight: (a) =>
        f(a).match({
          Left: (b) => [DatumEither.repleteRight(b), DatumEither.initial()],
          Right: (c) => [DatumEither.initial(), DatumEither.repleteRight(c)],
        }),
    });
  };
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
 * @tsplus getter fncts.DatumEither traverse
 */
export function _traverse<E, A>(self: DatumEither<E, A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E1, B>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E1, B>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E1, DatumEither<E, B>> =>
      self.matchAll({
        Initial: () => G.pure(self.unsafeCoerce()),
        Pending: () => G.pure(self.unsafeCoerce()),
        RefreshLeft: () => G.pure(self.unsafeCoerce()),
        RefreshRight: (a) => f(a).pipe(G.map((b) => DatumEither.refreshRight(b))),
        RepleteLeft: () => G.pure(self.unsafeCoerce()),
        RepleteRight: (a) => f(a).pipe(G.map((b) => DatumEither.repleteRight(b))),
      });
}

export const traverse: P.Traversable<DatumEitherF>["traverse"] = (G) => (f) => (self) => self.traverse(G)(f);

/**
 * @tsplus pipeable fncts.DatumEither zipWith
 */
export const zipWith: <A, E1, B, C>(
  that: DatumEither<E1, B>,
  f: (a: A, b: B) => C,
) => <E>(self: DatumEither<E, A>) => DatumEither<E | E1, C> = EitherT.zipWith(Datum.Apply);

/**
 * @tsplus pipeable fncts.DatumEither zip
 */
export function zip<E1, B>(that: DatumEither<E1, B>) {
  return <E, A>(self: DatumEither<E, A>): DatumEither<E | E1, Zipped.Make<A, B>> => {
    return self.zipWith(that, (a, b) => Zipped(a, b));
  };
}
