import type { Fold, FoldPartiallyApplied } from "@fncts/base/optics/Fold";

/**
 * @tsplus pipeable global focus 4
 */
export function focus<S, A>(fold: Fold<S, A>) {
  return (self: S): FoldPartiallyApplied<A> => {
    return {
      foldMap: (M) => (f) => fold.foldMap(M)(f)(self),
    };
  };
}
