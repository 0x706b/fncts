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
