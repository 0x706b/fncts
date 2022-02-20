import type { IO } from "../../IO";
import type { PRef } from "../definition";

import { concrete } from "../definition";

/**
 * Writes a new value to the `Ref`, with a guarantee of immediate
 * consistency (at some cost to performance).
 *
 * @tsplus fluent fncts.control.Ref set
 */
export function set_<RA, RB, EA, EB, A, B>(
  self: PRef<RA, RB, EA, EB, A, B>,
  a: A
): IO<RA & RB, EA | EB, void> {
  concrete(self);
  return self.set(a);
}
