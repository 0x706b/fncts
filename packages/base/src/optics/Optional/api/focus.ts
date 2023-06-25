import type { POptional, POptionalPartiallyApplied } from "@fncts/base/optics/Optional";
import type { PTraversal } from "@fncts/base/optics/Traversal";

/**
 * @tsplus fluent global focus 1
 */
export function focus<S, T, A, B>(self: S, optional: POptional<S, T, A, B>): POptionalPartiallyApplied<T, A, B> {
  return {
    ...self.focus(optional as PTraversal<S, T, A, B>),
    getMaybe: () => optional.getMaybe(self),
    modifyMaybe: (f) => optional.modifyMaybe(f)(self),
    getOrModify: () => optional.getOrModify(self),
  };
}
