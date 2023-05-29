import type { POptional } from "@fncts/base/optics/Optional";
import type { PPrism, PPrismPartiallyApplied } from "@fncts/base/optics/Prism";

/**
 * @tsplus pipeable global focus
 */
export function focus<S, T, A, B>(prism: PPrism<S, T, A, B>) {
  return (self: S): PPrismPartiallyApplied<T, A, B> => {
    return {
      ...self.focus(prism as POptional<S, T, A, B>),
      reverseGet: prism.reverseGet,
    };
  };
}
