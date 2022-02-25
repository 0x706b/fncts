import type { Predicate } from "../Predicate";
import type { Either } from "./definition";

import * as P from "../../prelude";
import { map_ } from "./api";
import { EitherTag, Left, Right } from "./definition";

export interface EitherF extends P.HKT {
  readonly type: Either<this["E"], this["A"]>;
  readonly variance: {
    E: "+";
    A: "+";
  };
}

/**
 * @tsplus static fncts.data.EitherOps getEq
 */
export function getEq<E, A>(EE: P.Eq<E>, EA: P.Eq<A>): P.Eq<Either<E, A>> {
  return P.Eq({
    equals_: (x, y) =>
      x === y ||
      x.match(
        (e1) =>
          y.match(
            (e2) => EE.equals_(e1, e2),
            () => false,
          ),
        (a1) =>
          y.match(
            () => false,
            (a2) => EA.equals_(a1, a2),
          ),
      ),
  });
}

/**
 * @tsplus static fncts.data.EitherOps getEq
 */
export function getFilerable<E>(ME: P.Monoid<E>) {
  type FixE = P.HKT.Fix<"E", E>;

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

  const partition_: P.partition_<EitherF, FixE> = <A>(fa: Either<E, A>, p: Predicate<A>): readonly [Either<E, A>, Either<E, A>] =>
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
