import type { Either } from "../../../data/Either";
import type { PRef } from "../definition";

import { concrete } from "../definition";

/**
 * Folds over the error and value types of the `Ref`, allowing access to
 * the state in transforming the `set` value. This is a more powerful version
 * of `match` but requires unifying the error types.
 *
 * @tsplus fluent fncts.control.Ref matchAll
 * @tsplus fluent fncts.control.Ref.Synchronized matchAll
 */
export function matchAll_<RA, RB, EA, EB, A, B, EC, ED, C, D>(
  ref: PRef<RA, RB, EA, EB, A, B>,
  ea: (_: EA) => EC,
  eb: (_: EB) => ED,
  ec: (_: EB) => EC,
  ca: (_: C) => (_: B) => Either<EC, A>,
  bd: (_: B) => Either<ED, D>,
): PRef<RA, RB, EC, ED, C, D> {
  concrete(ref);
  return ref.matchAll(ea, eb, ec, ca as any, bd as any);
}
