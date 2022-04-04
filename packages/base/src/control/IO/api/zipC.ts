import { tuple } from "../../../data/function.js";

/**
 * @tsplus fluent fncts.control.IO zipC
 */
export function zipC_<R, E, A, R1, E1, B>(
  self: IO<R, E, A>,
  that: IO<R1, E1, B>,
): IO<R & R1, E | E1, readonly [A, B]> {
  return self.zipWithC(that, tuple);
}
