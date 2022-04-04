import { zipChunks } from "../internal/util.js";

/**
 * @tsplus fluent fncts.control.Stream zipWith
 */
export function zipWith_<R, E, A, R1, E1, B, C>(
  self: Stream<R, E, A>,
  that: Stream<R1, E1, B>,
  f: (a: A, b: B) => C,
): Stream<R & R1, E | E1, C> {
  return self.zipWithChunks(that, (as, bs) => zipChunks(as, bs, f));
}
