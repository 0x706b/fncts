import type { Check } from "@fncts/typelevel/Check";

import * as P from "@fncts/base/typeclass";

/**
 * @tsplus static fncts.globalOps Guard
 */
export const Guard: P.Guard<{}> = P.Guard(isObject);

/**
 * @tsplus derive fncts.Guard<_> 10
 */
export function deriveGuard<A extends {}>(
  ..._: Check<Check.IsEqual<A, {}>> extends Check.True ? [] : never
): P.Guard<A> {
  return P.Guard((u): u is A => typeof u === "object" && u !== null);
}
