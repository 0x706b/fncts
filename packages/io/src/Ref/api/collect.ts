import type { PRef } from "../definition.js";

import { identity } from "@fncts/base/data/function";

/**
 * Maps and filters the `get` value of the `Ref` with the specified partial
 * function, returning a `Ref` with a `get` value that succeeds with the
 * result of the partial function if it is defined or else fails with `None`.
 *
 * @tsplus fluent fncts.io.Ref collect
 * @tsplus fluent fncts.io.Ref.Synchronized collect
 */
export function collect_<RA, RB, EA, EB, A, B, C>(
  ref: PRef<RA, RB, EA, EB, A, B>,
  pf: (_: B) => Maybe<C>,
): PRef<RA, RB, EA, Maybe<EB>, A, C> {
  return ref.match(identity, Maybe.just, Either.right, (b) => pf(b).toEither(Nothing()));
}
