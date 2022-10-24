import type { PRef } from "../definition.js";

import { concrete } from "../definition.js";

/**
 * Folds over the error and value types of the `Ref`. This is a highly
 * polymorphic method that is capable of arbitrarily transforming the error
 * and value types of the `Ref`. For most use cases one of the more specific
 * combinators implemented in terms of `match` will be more ergonomic but this
 * method is extremely useful for implementing new combinators.
 *
 * @tsplus pipeable fncts.io.Ref match
 * @tsplus pipeable fncts.io.Ref.Synchronized match
 */
export function match<EA, EB, A, B, EC, ED, C, D>(
  ea: (_: EA) => EC,
  eb: (_: EB) => ED,
  ca: (_: C) => Either<EC, A>,
  bd: (_: B) => Either<ED, D>,
) {
  return <RA, RB>(ref: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EC, ED, C, D> => {
    concrete(ref);
    return ref.match(ea, eb, ca, bd as any);
  };
}
