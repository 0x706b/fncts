import type { Functor } from "@fncts/base/typeclass/Functor";

/**
 * @tsplus type fncts.Filterable
 */
export interface Filterable<F extends HKT, FC = HKT.None> extends Functor<F, FC> {
  filter<A, B extends A>(
    refinement: Refinement<A, B>,
  ): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
  filter<A>(
    predicate: Predicate<A>,
  ): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>;
  filterMap<A, B>(
    f: (a: A) => Maybe<B>,
  ): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>;
  partition<A, B extends A>(
    refinement: Refinement<A, B>,
  ): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>];
  partition<A>(
    predicate: Predicate<A>,
  ): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>];
  partitionMap<A, B, B1>(
    f: (a: A) => Either<B, B1>,
  ): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => readonly [HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B>, HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, B1>];
}

/**
 * @tsplus type fncts.FilterableOps
 */
export interface FilterableOps {}

export const Filterable: FilterableOps = {};
