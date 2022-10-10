import type { Monoid } from "@fncts/base/typeclass";
export interface foldMap<S, A> {
  <M>(M: Monoid<M>): (f: (a: A) => M) => (s: S) => M;
}

/**
 * @tsplus type fncts.optics.Fold
 */
export interface Fold<S, A> {
  readonly foldMap: foldMap<S, A>;
}

/**
 * @tsplus type fncts.optics.FoldOps
 */
export interface FoldOps {}

export const Fold: FoldOps = {};

export interface FoldMin<S, A> {
  readonly foldMap: foldMap<S, A>;
}

/**
 * @tsplus static fncts.optics.FoldOps __call
 */
export function makeFold<S, A>(F: FoldMin<S, A>): Fold<S, A> {
  return {
    foldMap: F.foldMap,
  };
}
