import type { EitherF } from "@fncts/base/data/Either/definition.js";

import { map } from "@fncts/base/data/Either/api";
import { concrete, Either, EitherTag, Right } from "@fncts/base/data/Either/definition";

import * as P from "../../typeclass.js";

/**
 * @tsplus implicit
 */
export const Functor = HKT.instance<P.Functor<EitherF>>({
  map,
});

/**
 * @tsplus static fncts.EitherOps getEq
 */
export function getEq<E, A>(EE: P.Eq<E>, EA: P.Eq<A>): P.Eq<Either<E, A>> {
  return P.Eq({
    equals: (y) => (x) =>
      x === y ||
      x.match(
        (e1) =>
          y.match(
            (e2) => EE.equals(e2)(e1),
            () => false,
          ),
        (a1) =>
          y.match(
            () => false,
            (a2) => EA.equals(a2)(a1),
          ),
      ),
  });
}

/**
 * @tsplus derive fncts.Eq[fncts.Either]<_> 10
 */
export function deriveEq<A extends Either<any, any>>(
  ...[left, right]: [A] extends [Either<infer E, infer A>] ? [left: P.Eq<E>, right: P.Eq<A>] : never
): P.Eq<A> {
  return Either.getEq(left, right);
}

/**
 * @tsplus static fncts.EitherOps getFilterable
 */
export function getFilerable<E>(/** @tsplus auto */ ME: P.Monoid<E>): P.Filterable<EitherF, HKT.Fix<"E", E>> {
  return HKT.instance<P.Filterable<EitherF, HKT.Fix<"E", E>>>({
    ...Functor,
    partitionMap: (f) => (fa) => {
      concrete(fa);
      if (fa._tag === EitherTag.Left) {
        return [fa, fa];
      }
      const fb = f(fa.right);
      concrete(fb);
      switch (fb._tag) {
        case EitherTag.Left:
          return [Right(fb.left), Either.left(ME.nat)];
        case EitherTag.Right:
          return [Either.left(ME.nat), fb];
      }
    },
    filter:
      <A>(p: Predicate<A>) =>
      (fa: Either<E, A>) => {
        concrete(fa);
        switch (fa._tag) {
          case EitherTag.Left:
            return fa;
          case EitherTag.Right:
            return p(fa.right) ? fa : Either.left(ME.nat);
        }
      },
    filterMap: (f) => (fa) => {
      concrete(fa);
      if (fa._tag === EitherTag.Left) {
        return fa;
      }
      return f(fa.right).match(
        () => Either.left(ME.nat),
        (b) => Either.right(b),
      );
    },
    partition:
      <A>(p: Predicate<A>) =>
      (fa: Either<E, A>): readonly [Either<E, A>, Either<E, A>] => {
        concrete(fa);
        if (fa._tag === EitherTag.Left) {
          return [fa, fa];
        }
        return p(fa.right) ? [Either.left(ME.nat), fa] : [fa, Either.left(ME.nat)];
      },
  });
}

/**
 * @tsplus derive fncts.Guard[fncts.Either]<_> 10
 */
export function deriveGuard<A extends Either<any, any>>(
  ...[left, right]: [A] extends [Either<infer E, infer A>] ? [left: Guard<E>, right: Guard<A>] : never
): Guard<A> {
  return Guard((u): u is A => {
    if (Either.isEither(u)) {
      if (u.isLeft()) {
        return left.is(u.left);
      }
      if (u.isRight()) {
        return right.is(u.right);
      }
    }
    return false;
  });
}
