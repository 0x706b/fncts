import { POptional } from "../Optional.js";
import { Lens, PLens } from "./definition.js";

/**
 * @tsplus fluent fncts.optics.PLens compose
 */
export function compose_<S, T, A, B, C, D>(
  self: PLens<S, T, A, B>,
  that: PLens<A, B, C, D>,
): PLens<S, T, C, D> {
  return PLens({
    get: self.get.compose(that.get),
    set_: (s, d) => self.modify_(s, that.set(d)),
  });
}
