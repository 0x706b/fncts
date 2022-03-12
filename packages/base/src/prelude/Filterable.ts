import type { Either } from "../data/Either.js";
import type { Maybe } from "../data/Maybe.js";
import type { Predicate } from "../data/Predicate.js";
import type { Refinement } from "../data/Refinement.js";
import type { FunctorMin } from "./Functor.js";

import { Functor } from "./Functor.js";
import { HKT } from "./HKT.js";

/**
 * @tsplus type fncts.Filterable
 */
export interface Filterable<F extends HKT, FC = HKT.None> extends Functor<F, FC> {
  readonly filter_: filter_<F, FC>;
  readonly filter: filter<F, FC>;
  readonly filterMap_: filterMap_<F, FC>;
  readonly filterMap: filterMap<F, FC>;
  readonly partition_: partition_<F, FC>;
  readonly partition: partition<F, FC>;
  readonly partitionMap_: partitionMap_<F, FC>;
  readonly partitionMap: partitionMap<F, FC>;
}

/**
 * @tsplus type fncts.FilterableOps
 */
export interface FilterableOps {}

export const Filterable: FilterableOps = {};

export type FilterableMin<F extends HKT, FC = HKT.None> = FunctorMin<F, FC> & {
  readonly filter_: filter_<F, FC>;
  readonly filterMap_: filterMap_<F, FC>;
  readonly partition_: partition_<F, FC>;
  readonly partitionMap_: partitionMap_<F, FC>;
};

/**
 * @tsplus static fncts.FilterableOps __call
 */
export function mkFilterable<F extends HKT, FC = HKT.None>(
  F: FilterableMin<F, FC>,
): Filterable<F, FC>;
export function mkFilterable<F>(F: FilterableMin<HKT.F<F>>): Filterable<HKT.F<F>> {
  return HKT.instance<Filterable<HKT.F<F>>>({
    ...Functor(F),
    filter_: F.filter_,
    filter:
      <A>(p: Predicate<A>) =>
      <K, Q, W, X, I, S, R, E>(fa: HKT.FK<F, K, Q, W, X, I, S, R, E, A>) =>
        F.filter_(fa, p),
    partition_: F.partition_,
    partition:
      <A>(p: Predicate<A>) =>
      <K, Q, W, X, I, S, R, E>(fa: HKT.FK<F, K, Q, W, X, I, S, R, E, A>) =>
        F.partition_(fa, p),
    filterMap_: F.filterMap_,
    filterMap: (f) => (fa) => F.filterMap_(fa, f),
    partitionMap_: F.partitionMap_,
    partitionMap: (f) => (fa) => F.partitionMap_(fa, f),
  });
}

export interface filter_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B extends A>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    refinement: Refinement<A, B>,
  ): HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>;
  <K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    predicate: Predicate<A>,
  ): HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>;
}

export interface filter<F extends HKT, C = HKT.None> {
  <A, B extends A>(refinement: Refinement<A, B>): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>;
  <A>(predicate: Predicate<A>): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>;
}

export interface filterMap_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => Maybe<B>,
  ): HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>;
}

export interface filterMap<F extends HKT, C = HKT.None> {
  <A, B>(f: (a: A) => Maybe<B>): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>;
}

export interface partition_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B extends A>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    refinement: Refinement<A, B>,
  ): readonly [
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>,
  ];
  <K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    predicate: Predicate<A>,
  ): readonly [
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
  ];
}

export interface partition<F extends HKT, C = HKT.None> {
  <A, B extends A>(refinement: Refinement<A, B>): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
  ) => readonly [
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>,
  ];
  <A>(predicate: Predicate<A>): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
  ) => readonly [
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
  ];
}

export interface partitionMap_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B, B1>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => Either<B, B1>,
  ): readonly [
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>,
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B1>,
  ];
}

export interface partitionMap<F extends HKT, C = HKT.None> {
  <A, B, B1>(f: (a: A) => Either<B, B1>): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
  ) => readonly [
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B>,
    HKT.Kind<F, C, K, Q, W, X, I, S, R, E, B1>,
  ];
}
