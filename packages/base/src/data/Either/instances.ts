import type { Either1F, EitherF } from "@fncts/base/data/Either/definition.js";

import { map_ } from "@fncts/base/data/Either/api";
import { concrete, Either, EitherTag, Right } from "@fncts/base/data/Either/definition";
import { EitherJson } from "@fncts/base/json/EitherJson";

import * as P from "../../typeclass.js";

/**
 * @tsplus implicit
 */
export const Functor: P.Functor<EitherF> = {
  map: map_,
};

/**
 * @tsplus static fncts.EitherOps getEq
 */
export function getEq<E, A>(EE: P.Eq<E>, EA: P.Eq<A>): P.Eq<Either<E, A>> {
  return P.Eq({
    equals: (x, y) =>
      x === y ||
      x.match(
        (e1) =>
          y.match(
            (e2) => EE.equals(e1, e2),
            () => false,
          ),
        (a1) =>
          y.match(
            () => false,
            (a2) => EA.equals(a1, a2),
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
export function getFilerable<E>(/** @tsplus auto */ ME: P.Monoid<E>): P.Filterable<Either1F<E>> {
  return <P.Filterable<Either1F<E>>>{
    ...Functor,
    partitionMap: (fa, f) => {
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
    filter: <A>(fa: Either<E, A>, p: Predicate<A>) => {
      concrete(fa);
      switch (fa._tag) {
        case EitherTag.Left:
          return fa;
        case EitherTag.Right:
          return p(fa.right) ? fa : Either.left(ME.nat);
      }
    },
    filterMap: (fa, f) => {
      concrete(fa);
      if (fa._tag === EitherTag.Left) {
        return fa;
      }
      return f(fa.right).match(
        () => Either.left(ME.nat),
        (b) => Either.right(b),
      );
    },
    partition: <A>(fa: Either<E, A>, p: Predicate<A>): readonly [Either<E, A>, Either<E, A>] => {
      concrete(fa);
      if (fa._tag === EitherTag.Left) {
        return [fa, fa];
      }
      return p(fa.right) ? [Either.left(ME.nat), fa] : [fa, Either.left(ME.nat)];
    },
  };
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

/**
 * @tsplus derive fncts.Decoder[fncts.Either]<_> 10
 */
export function deriveDecoder<A extends Either<any, any>>(
  ...[left, right]: [A] extends [Either<infer E, infer A>] ? [left: Decoder<E>, right: Decoder<A>] : never
): Decoder<A> {
  const jsonDecoder = EitherJson.getDecoder(left, right);
  return Decoder(
    (u) =>
      jsonDecoder
        .decode(u)
        .map((result) =>
          result._tag === "Left" ? (Either.left(result.left) as A) : (Either.right(result.right) as A),
        ),
    `Either<${left.label}, ${right.label}>`,
  );
}
