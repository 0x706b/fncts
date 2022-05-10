import * as P from "../../typeclass.js";
import { map_ } from "./api.js";
import { EitherTag, Left, Right } from "./definition.js";

export interface EitherF extends HKT {
  readonly type: Either<this["E"], this["A"]>;
  readonly variance: {
    E: "+";
    A: "+";
  };
}

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
export function getFilerable<E>(/** @tsplus auto */ ME: P.Monoid<E>): P.Filterable<EitherF, HKT.Fix<"E", E>> {
  type FixE = HKT.Fix<"E", E>;

  const empty = Left(ME.nat);

  const partitionMap_: P.partitionMap_<EitherF, FixE> = (fa, f) => {
    if (fa._tag === EitherTag.Left) {
      return [fa, fa];
    }
    const fb = f(fa.right);
    switch (fb._tag) {
      case EitherTag.Left:
        return [Right(fb.left), empty];
      case EitherTag.Right:
        return [empty, fb];
    }
  };

  const partition_: P.partition_<EitherF, FixE> = <A>(
    fa: Either<E, A>,
    p: Predicate<A>,
  ): readonly [Either<E, A>, Either<E, A>] =>
    fa._tag === EitherTag.Left ? [fa, fa] : p(fa.right) ? [empty, fa] : [fa, empty];

  const filterMap_: P.filterMap_<EitherF, FixE> = (fa, f) =>
    fa._tag === EitherTag.Left
      ? fa
      : f(fa.right).match(
          () => empty,
          (b) => Right(b),
        );

  const filter_: P.filter_<EitherF, FixE> = <A>(fa: Either<E, A>, p: Predicate<A>): Either<E, A> =>
    fa._tag === EitherTag.Left ? fa : p(fa.right) ? fa : empty;

  return P.Filterable<EitherF, FixE>({
    map_,
    filter_,
    filterMap_,
    partition_,
    partitionMap_,
  });
}
