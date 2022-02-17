import type { Either } from "../data/Either";
import type { Maybe } from "../data/Maybe";
import type { PredicateWithIndex } from "../data/Predicate";
import type { RefinementWithIndex } from "../data/Refinement";
import type { FilterableMin } from "./Filterable";
import type { FunctorWithIndexMin } from "./FunctorWithIndex";

import { Filterable } from "./Filterable";
import { FunctorWithIndex } from "./FunctorWithIndex";
import { HKT } from "./HKT";

/**
 * @tsplus type fncts.FilterableWithIndex
 */
export interface FilterableWithIndex<F extends HKT, FC = HKT.None>
  extends FunctorWithIndex<F, FC>,
    Filterable<F, FC> {
  readonly filterWithIndex_: filterWithIndex_<F, FC>;
  readonly filterWithIndex: filterWithIndex<F, FC>;
  readonly filterMapWithIndex_: filterMapWithIndex_<F, FC>;
  readonly filterMapWithIndex: filterMapWithIndex<F, FC>;
  readonly partitionWithIndex_: partitionWithIndex_<F, FC>;
  readonly partitionWithIndex: partitionWithIndex<F, FC>;
  readonly partitionMapWithIndex_: partitionMapWithIndex_<F, FC>;
  readonly partitionMapWithIndex: partitionMapWithIndex<F, FC>;
}

/**
 * @tsplus type fncts.FilterableWithIndexOps
 */
export interface FilterableWithIndexOps {}

export const FilterableWithIndex: FilterableWithIndexOps = {};

export type FilterableWithIndexMin<
  F extends HKT,
  FC = HKT.None
> = FunctorWithIndexMin<F, FC> &
  FilterableMin<F, FC> & {
    readonly filterWithIndex_: filterWithIndex_<F, FC>;
    readonly filterMapWithIndex_: filterMapWithIndex_<F, FC>;
    readonly partitionWithIndex_: partitionWithIndex_<F, FC>;
    readonly partitionMapWithIndex_: partitionMapWithIndex_<F, FC>;
  };

/**
 * @tsplus static fncts.FilterableWithIndexOps __call
 */
export function mkFilterableWithIndex<F extends HKT, FC = HKT.None>(
  F: FilterableWithIndexMin<F, FC>
): FilterableWithIndex<F, FC>;
export function mkFilterableWithIndex<F>(
  F: FilterableWithIndexMin<HKT.F<F>>
): FilterableWithIndex<HKT.F<F>> {
  return HKT.instance<FilterableWithIndex<HKT.F<F>>>({
    ...FunctorWithIndex(F),
    ...Filterable(F),
    filterWithIndex_: F.filterWithIndex_,
    filterWithIndex:
      <K, A>(f: PredicateWithIndex<K, A>) =>
      <Q, W, X, I, S, R, E>(fa: HKT.FK<F, K, Q, W, X, I, S, R, E, A>) =>
        F.filterWithIndex_(fa, f),
    partitionWithIndex_: F.partitionWithIndex_,
    partitionWithIndex:
      <K, A>(f: PredicateWithIndex<K, A>) =>
      <Q, W, X, I, S, R, E>(fa: HKT.FK<F, K, Q, W, X, I, S, R, E, A>) =>
        F.partitionWithIndex_(fa, f),
    filterMapWithIndex_: F.filterMapWithIndex_,
    filterMapWithIndex: (f) => (fa) => F.filterMapWithIndex_(fa, f),
    partitionMapWithIndex_: F.partitionMapWithIndex_,
    partitionMapWithIndex: (f) => (fa) => F.partitionMapWithIndex_(fa, f),
  });
}

export interface filterWithIndex_<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B extends A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    refinement: RefinementWithIndex<
      HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>,
      A,
      B
    >
  ): HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
  <K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    predicate: PredicateWithIndex<HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, A>
  ): HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>;
}

export interface filterWithIndex<F extends HKT, FC = HKT.None> {
  <K, A, B extends A>(
    refinement: RefinementWithIndex<
      HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>,
      A,
      B
    >
  ): <Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
  <K, A>(
    predicate: PredicateWithIndex<HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, A>
  ): <Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>;
}

export interface filterMapWithIndex_<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, a: A) => Maybe<B>
  ): HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
}

export interface filterMapWithIndex<F extends HKT, FC = HKT.None> {
  <K, A, B>(f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, a: A) => Maybe<B>): <
    Q,
    W,
    X,
    I,
    S,
    R,
    E
  >(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
}

export interface partitionWithIndex_<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B extends A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    refinement: RefinementWithIndex<
      HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>,
      A,
      B
    >
  ): readonly [
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>
  ];
  <K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    predicate: PredicateWithIndex<HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, A>
  ): readonly [
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>
  ];
}

export interface partitionWithIndex<F extends HKT, FC = HKT.None> {
  <K, A, B extends A>(
    refinement: RefinementWithIndex<
      HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>,
      A,
      B
    >
  ): <Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>
  ) => readonly [
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>
  ];
  <K, A>(
    predicate: PredicateWithIndex<HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, A>
  ): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>
  ) => readonly [
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>
  ];
}

export interface partitionMapWithIndex_<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B, B1>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, a: A) => Either<B, B1>
  ): readonly [
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>,
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B1>
  ];
}

export interface partitionMapWithIndex<F extends HKT, FC = HKT.None> {
  <K, A, B, B1>(
    f: (i: HKT.IndexFor<F, HKT.OrFix<FC, "K", K>>, a: A) => Either<B, B1>
  ): <Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>
  ) => readonly [
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>,
    HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B1>
  ];
}
