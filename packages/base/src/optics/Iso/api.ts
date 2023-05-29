import type { PIsoPartiallyApplied } from "@fncts/base/optics/Iso/definition";
import type { PLens } from "@fncts/base/optics/Lens";
import type { PPrism } from "@fncts/base/optics/Prism";

import { PIso } from "@fncts/base/optics/Iso/definition";

/**
 * @tsplus pipeable fncts.optics.PIso compose
 */
export function compose<A, B, C, D>(that: PIso<A, B, C, D>) {
  return <S, T>(self: PIso<S, T, A, B>): PIso<S, T, C, D> => {
    return PIso({
      get: self.get.compose(that.get),
      reverseGet: that.reverseGet.compose(self.reverseGet),
    });
  };
}

/**
 * @tsplus pipeable global focus
 */
export function focus<S, T, A, B>(iso: PIso<S, T, A, B>) {
  return (self: S): PIsoPartiallyApplied<T, A, B> => {
    return {
      ...self.focus(iso as PLens<S, T, A, B>),
      ...self.focus(iso as PPrism<S, T, A, B>),
    };
  };
}
