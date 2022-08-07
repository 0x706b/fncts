import type { PRef } from "../definition.js";

import { concrete } from "../definition.js";

/**
 * Writes a new value to the `Ref`, with a guarantee of immediate
 * consistency (at some cost to performance).
 *
 * @tsplus fluent fncts.io.Ref set
 * @tsplus fluent fncts.io.Ref.Synchronized set
 */
export function set_<RA, RB, EA, EB, A, B>(
  self: PRef<RA, RB, EA, EB, A, B>,
  a: A,
  __tsplusTrace?: string,
): IO<RA | RB, EA | EB, void> {
  concrete(self);
  return self.set(a);
}
