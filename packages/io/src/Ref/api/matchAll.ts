import type { PRef } from "../definition.js";

import { concrete } from "../definition.js";

/**
 * Folds over the error and value types of the `Ref`, allowing access to
 * the state in transforming the `set` value. This is a more powerful version
 * of `match` but requires unifying the error types.
 *
 * @tsplus fluent fncts.io.Ref matchAll
 * @tsplus fluent fncts.io.Ref.Synchronized matchAll
 */
export function matchAll<EA, EB, A, B, EC, ED, C, D>(
  ea: (_: EA) => EC,
  eb: (_: EB) => ED,
  ec: (_: EB) => EC,
  ca: (_: C) => (_: B) => Either<EC, A>,
  bd: (_: B) => Either<ED, D>,
) {
  return <RA, RB>(ref: PRef<RA, RB, EA, EB, A, B>): PRef<RA | RB, RB, EC, ED, C, D> => {
    concrete(ref);
    return ref.matchAll(ea, eb, ec, ca, bd);
  };
}
