import { identity } from "@fncts/base/data/function";
import { PPrism } from "@fncts/base/optics/Prism/definition";

/**
 * @tsplus fluent fncts.optics.PPrism compose
 */
export function compose_<S, T, A, B, C, D>(
  self: PPrism<S, T, A, B>,
  that: PPrism<A, B, C, D>,
): PPrism<S, T, C, D> {
  return PPrism({
    getOrModify: (s) =>
      self.getOrModify(s).chain((a) => that.getOrModify(a).bimap((b) => self.set_(s, b), identity)),
    reverseGet: that.reverseGet.compose(self.reverseGet),
  });
}
