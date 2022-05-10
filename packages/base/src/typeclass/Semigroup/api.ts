import type { Ord } from "@fncts/base/typeclass/Ord";

import { Semigroup } from "@fncts/base/typeclass/Semigroup/definition";

/**
 * @tsplus static fncts.SemigroupOps min
 */
export function min<A>(O: Ord<A>): Semigroup<A> {
  return Semigroup({
    combine: O.min,
  });
}

/**
 * @tsplus static fncts.SemigroupOps max
 */
export function max<A>(O: Ord<A>): Semigroup<A> {
  return Semigroup({
    combine: O.max,
  });
}
