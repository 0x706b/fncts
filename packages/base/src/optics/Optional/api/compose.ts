import { identity } from "@fncts/base/data/function";
import { POptional } from "@fncts/base/optics/Optional/definition";

/**
 * @tsplus fluent fncts.optics.POptional compose 3
 */
export function compose_<S, T, A, B, C, D>(
  self: POptional<S, T, A, B>,
  that: POptional<A, B, C, D>,
): POptional<S, T, C, D> {
  return POptional({
    getOrModify: (s) => self.getOrModify(s).chain((a) => that.getOrModify(a).bimap((b) => self.set_(s, b), identity)),
    replace_: (s, d) => self.modify_(s, that.set(d)),
  });
}
