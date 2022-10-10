import { identity } from "@fncts/base/data/function";
import { POptional } from "@fncts/base/optics/Optional/definition";

/**
 * @tsplus pipeable fncts.optics.POptional compose 3
 */
export function compose<A, B, C, D>(that: POptional<A, B, C, D>) {
  return <S, T>(self: POptional<S, T, A, B>): POptional<S, T, C, D> => {
    return POptional({
      getOrModify: (s) =>
        self.getOrModify(s).flatMap((a) => that.getOrModify(a).bimap((b) => s.pipe(self.set(b)), identity)),
      set: (d) => self.modify(that.set(d)),
    });
  };
}
