import type { Fold, FoldPartiallyApplied } from "@fncts/base/optics/Fold";

/**
 * Focuses a source value so fold operations can be applied directly to it.
 *
 * @tsplus fluent global focus 4
 */
export function focus<S, A>(self: S, fold: Fold<S, A>): FoldPartiallyApplied<A> {
  return {
    foldMap: (M) => (f) => fold.foldMap(M)(f)(self),
  };
}
