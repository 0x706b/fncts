import type { IO } from "../../IO";
import type { PRef } from "../definition";

import { concrete } from "../definition";

/**
 * Reads the value from the `Ref`.
 *
 * @tsplus getter fncts.control.Ref get
 * @tsplus getter fncts.control.Ref.Synchronized get
 */
export function get<RA, RB, EA, EB, A, B>(
  self: PRef<RA, RB, EA, EB, A, B>
): IO<RA & RB, EA | EB, B> {
  concrete(self);
  return self.get as IO<RA & RB, EA | EB, B>;
}
