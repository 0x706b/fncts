import type { Queue } from "./definition.js";

/**
 * @tsplus getter fncts.ImmutableQueue isEmpty
 */
export function isEmpty<A>(self: Queue<A>): boolean {
  return self._in.isEmpty() && self._out.isEmpty();
}
