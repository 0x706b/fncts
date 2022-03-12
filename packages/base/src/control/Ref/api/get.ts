import type { IO } from "../../IO.js";
import type { PRef } from "../definition.js";

import { concrete } from "../definition.js";

/**
 * Reads the value from the `Ref`.
 *
 * @tsplus getter fncts.control.Ref get
 * @tsplus getter fncts.control.Ref.Synchronized get
 */
export function get<RA, RB, EA, EB, A, B>(
  self: PRef<RA, RB, EA, EB, A, B>,
): IO<RA & RB, EA | EB, B> {
  concrete(self);
  return self.get as IO<RA & RB, EA | EB, B>;
}
