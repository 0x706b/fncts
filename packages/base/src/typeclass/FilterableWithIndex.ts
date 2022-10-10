import type { Filterable } from "@fncts/base/typeclass/Filterable";
import type { FunctorWithIndex } from "@fncts/base/typeclass/FunctorWithIndex";

/**
 * @tsplus type fncts.FilterableWithIndex
 */
export interface FilterableWithIndex<F extends HKT, FC = HKT.None> extends FunctorWithIndex<F, FC>, Filterable<F, FC> {
  filterWithIndex<K, A, B extends A>(
    refinement: RefinementWithIndex<HKT.IndexFor<F, K>, A, B>,
  ): <Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
  filterWithIndex<K, A>(
    predicate: PredicateWithIndex<HKT.IndexFor<F, K>, A>,
  ): <Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>;
  filterMapWithIndex<K, A, B>(
    f: (i: HKT.IndexFor<F, K>, a: A) => Maybe<B>,
  ): <Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
  partitionWithIndex<K, A, B extends A>(
    refinement: RefinementWithIndex<HKT.IndexFor<F, K>, A, B>,
  ): <Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>];
  partitionWithIndex<K, A>(
    predicate: PredicateWithIndex<HKT.IndexFor<F, K>, A>,
  ): <Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>];
  partitionMapWithIndex<K, A, B, B1>(
    f: (i: HKT.IndexFor<F, K>, a: A) => Either<B, B1>,
  ): <Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B1>];
}

/**
 * @tsplus type fncts.FilterableWithIndexOps
 */
export interface FilterableWithIndexOps {}

export const FilterableWithIndex: FilterableWithIndexOps = {};
