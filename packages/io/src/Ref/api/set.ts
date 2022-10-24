import type { PRef } from "../definition.js";

import { concrete } from "../definition.js";

/**
 * Writes a new value to the `Ref`, with a guarantee of immediate
 * consistency (at some cost to performance).
 *
 * @tsplus pipeable fncts.io.Ref set
 * @tsplus pipeable fncts.io.Ref.Synchronized set
 */
export function set<A>(a: A, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(self: PRef<RA, RB, EA, EB, A, B>): IO<RA, EA, void> => {
    concrete(self);
    return self.set(a);
  };
}
