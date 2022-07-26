import type { Filterable } from "@fncts/base/typeclass/Filterable";
import type { FunctorWithIndex } from "@fncts/base/typeclass/FunctorWithIndex";

/**
 * @tsplus type fncts.FilterableWithIndex
 */
export interface FilterableWithIndex<F extends HKT, FC = HKT.None> extends FunctorWithIndex<F, FC>, Filterable<F, FC> {
  filterWithIndex<K, Q, W, X, I, S, R, E, A, B extends A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    refinement: RefinementWithIndex<HKT.IndexFor<F, K>, A, B>,
  ): HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
  filterWithIndex<K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    predicate: PredicateWithIndex<HKT.IndexFor<F, K>, A>,
  ): HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>;
  filterMapWithIndex<K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    f: (i: HKT.IndexFor<F, K>, a: A) => Maybe<B>,
  ): HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
  partitionWithIndex<K, Q, W, X, I, S, R, E, A, B extends A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    refinement: RefinementWithIndex<HKT.IndexFor<F, K>, A, B>,
  ): readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>];
  partitionWithIndex<K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    predicate: PredicateWithIndex<HKT.IndexFor<F, K>, A>,
  ): readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>];
  partitionMapWithIndex<K, Q, W, X, I, S, R, E, A, B, B1>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    f: (i: HKT.IndexFor<F, K>, a: A) => Either<B, B1>,
  ): readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B1>];
}

/**
 * @tsplus type fncts.FilterableWithIndexOps
 */
export interface FilterableWithIndexOps {}

export const FilterableWithIndex: FilterableWithIndexOps = {};
