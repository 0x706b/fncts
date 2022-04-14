import type { Queue } from "./definition.js";

/**
 * @tsplus getter fncts.ImmutableQueue isEmpty
 */
export function isEmpty<A>(queue: Queue<A>): boolean {
  return queue._in.isEmpty() && queue._out.isEmpty();
}
