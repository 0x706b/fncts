import type { Fold } from "@fncts/base/optics/Fold";
import type { PSetter } from "@fncts/base/optics/Setter";
import type { PTraversal, PTraversalPartiallyApplied } from "@fncts/base/optics/Traversal";

/**
 * @tsplus fluent global focus 2
 */
export function focus<S, T, A, B>(self: S, traversal: PTraversal<S, T, A, B>): PTraversalPartiallyApplied<T, A, B> {
  return {
    ...self.focus(traversal as PSetter<S, T, A, B>),
    ...self.focus(traversal as Fold<S, A>),
    modifyA: (F) => (f) => traversal.modifyA(F)(f)(self),
  };
}
