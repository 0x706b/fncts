import type { Functor } from "@fncts/base/typeclass/Functor";

/**
 * @tsplus type fncts.Filterable
 */
export interface Filterable<F extends HKT> extends Functor<F> {
  filter<K, Q, W, X, I, S, R, E, A, B extends A>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    refinement: Refinement<A, B>,
  ): HKT.Kind<F, K, Q, W, X, I, S, R, E, B>;
  filter<K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    predicate: Predicate<A>,
  ): HKT.Kind<F, K, Q, W, X, I, S, R, E, A>;
  filterMap<K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => Maybe<B>,
  ): HKT.Kind<F, K, Q, W, X, I, S, R, E, B>;
  partition<K, Q, W, X, I, S, R, E, A, B extends A>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    refinement: Refinement<A, B>,
  ): readonly [HKT.Kind<F, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, K, Q, W, X, I, S, R, E, B>];
  partition<K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    predicate: Predicate<A>,
  ): readonly [HKT.Kind<F, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, K, Q, W, X, I, S, R, E, A>];
  partitionMap<K, Q, W, X, I, S, R, E, A, B, B1>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => Either<B, B1>,
  ): readonly [HKT.Kind<F, K, Q, W, X, I, S, R, E, B>, HKT.Kind<F, K, Q, W, X, I, S, R, E, B1>];
}

/**
 * @tsplus type fncts.FilterableOps
 */
export interface FilterableOps {}

export const Filterable: FilterableOps = {};

/**
 * @tsplus fluent fncts.Kind filter
 */
export function filter<F extends HKT, K, Q, W, X, I, S, R, E, A, B extends A>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  refinement: Refinement<A, B>,
  /** @tsplus auto */ F: Filterable<F>,
): HKT.Kind<F, K, Q, W, X, I, S, R, E, B>;
export function filter<F extends HKT, K, Q, W, X, I, S, R, E, A>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  predicate: Predicate<A>,
  /** @tsplus auto */ F: Filterable<F>,
): HKT.Kind<F, K, Q, W, X, I, S, R, E, A> {
  return F.filter(fa, predicate);
}

/**
 * @tsplus fluent fncts.Kind filterMap
 */
export function filterMap<F extends HKT, K, Q, W, X, I, S, R, E, A, B>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  f: (a: A) => Maybe<B>,
  /** @tsplus auto */ F: Filterable<F>,
): HKT.Kind<F, K, Q, W, X, I, S, R, E, B> {
  return F.filterMap(fa, f);
}

/**
 * @tsplus fluent fncts.Kind partition
 */
export function partition<F extends HKT, K, Q, W, X, I, S, R, E, A, B extends A>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  refinement: Refinement<A, B>,
  /** @tsplus auto */ F: Filterable<F>,
): readonly [HKT.Kind<F, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, K, Q, W, X, I, S, R, E, B>];
export function partition<F extends HKT, K, Q, W, X, I, S, R, E, A>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  predicate: Predicate<A>,
  /** @tsplus auto */ F: Filterable<F>,
): readonly [HKT.Kind<F, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, K, Q, W, X, I, S, R, E, A>] {
  return F.partition(fa, predicate);
}

/**
 * @tsplus fluent fncts.Kind partitionMap
 */
export function partitionMap<F extends HKT, K, Q, W, X, I, S, R, E, A, B, B1>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  f: (a: A) => Either<B, B1>,
  /** @tsplus auto */ F: Filterable<F>,
): readonly [HKT.Kind<F, K, Q, W, X, I, S, R, E, B>, HKT.Kind<F, K, Q, W, X, I, S, R, E, B1>] {
  return F.partitionMap(fa, f);
}
