import type { POptional } from "@fncts/base/optics/Optional"
import type { PPrism, PPrismPartiallyApplied } from "@fncts/base/optics/Prism";

/**
 * @tsplus fluent global focus
 */
export function focus<S, T, A, B>(self: S, prism: PPrism<S, T, A, B>): PPrismPartiallyApplied<T, A, B> {
  return {
    ...self.focus(prism as POptional<S, T, A, B>),
    reverseGet: prism.reverseGet,
  };
}
