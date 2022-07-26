import type { Functor } from "@fncts/base/typeclass/Functor";

/**
 * @tsplus type fncts.Filterable
 */
export interface Filterable<F extends HKT, FC = HKT.None> extends Functor<F, FC> {
  filter<K, Q, W, X, I, S, R, E, A, B extends A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    refinement: Refinement<A, B>,
  ): HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
  filter<K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    predicate: Predicate<A>,
  ): HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>;
  filterMap<K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => Maybe<B>,
  ): HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
  partition<K, Q, W, X, I, S, R, E, A, B extends A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    refinement: Refinement<A, B>,
  ): readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>];
  partition<K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    predicate: Predicate<A>,
  ): readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>];
  partitionMap<K, Q, W, X, I, S, R, E, A, B, B1>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => Either<B, B1>,
  ): readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B1>];
}

/**
 * @tsplus type fncts.FilterableOps
 */
export interface FilterableOps {}

export const Filterable: FilterableOps = {};
