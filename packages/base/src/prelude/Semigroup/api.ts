import type { Ord } from "../Ord.js";

import { Semigroup } from "./definition.js";

/**
 * @tsplus static fncts.SemigroupOps min
 */
export function min<A>(O: Ord<A>): Semigroup<A> {
  return Semigroup({
    combine_: O.min,
  });
}

/**
 * @tsplus static fncts.SemigroupOps max
 */
export function max<A>(O: Ord<A>): Semigroup<A> {
  return Semigroup({
    combine_: O.max,
  });
}
