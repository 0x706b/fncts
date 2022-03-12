import type { Conc } from "../definition.js";

import { Empty } from "../definition.js";

/**
 * @tsplus static fncts.collection.immutable.ConcOps empty
 */
export function empty<B>(): Conc<B> {
  return new Empty();
}
