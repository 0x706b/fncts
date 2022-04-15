import { PIso } from "@fncts/base/optics/Iso/definition";

/**
 * @tsplus fluent fncts.optics.PIso compose
 */
export function compose_<S, T, A, B, C, D>(self: PIso<S, T, A, B>, that: PIso<A, B, C, D>): PIso<S, T, C, D> {
  return PIso({
    get: self.get.compose(that.get),
    reverseGet: that.reverseGet.compose(self.reverseGet),
  });
}
