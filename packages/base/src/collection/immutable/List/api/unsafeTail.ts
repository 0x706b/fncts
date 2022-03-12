import type { List } from "../definition.js";

import { NoSuchElementError } from "../../../../data/exceptions.js";

/**
 * @tsplus getter fncts.List unsafeTail
 */
export function unsafeTail<A>(self: List<A>): List<A> {
  if (self.isEmpty()) {
    throw new NoSuchElementError("unsafeTail on empty List");
  }
  return self.tail;
}
