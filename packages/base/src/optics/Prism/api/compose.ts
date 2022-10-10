import { identity } from "@fncts/base/data/function";
import { PPrism } from "@fncts/base/optics/Prism/definition";

/**
 * @tsplus pipeable fncts.optics.PPrism compose
 */
export function compose<A, B, C, D>(that: PPrism<A, B, C, D>) {
  return <S, T>(self: PPrism<S, T, A, B>): PPrism<S, T, C, D> => {
    return PPrism({
      getOrModify: (s) =>
        self.getOrModify(s).flatMap((a) => that.getOrModify(a).bimap((b) => s.pipe(self.set(b)), identity)),
      reverseGet: that.reverseGet.compose(self.reverseGet),
    });
  };
}
