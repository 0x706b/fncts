import type { Queue } from "./definition";

/**
 * @tsplus getter fncts.collection.immutable.Queue isEmpty
 */
export function isEmpty<A>(queue: Queue<A>): boolean {
  return queue._in.isEmpty() && queue._out.isEmpty();
}
