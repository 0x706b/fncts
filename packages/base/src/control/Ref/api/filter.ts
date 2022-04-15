import type { PRef } from "../definition.js";

import { identity } from "../../../data/function.js";

/**
 * Filters the `set` value of the `Ref` with the specified predicate,
 * returning a `Ref` with a `set` value that succeeds if the predicate is
 * satisfied or else fails with `None`.
 *
 * @tsplus fluent fncts.control.Ref filterInput
 * @tsplus fluent fncts.control.Ref.Synchronized filterInput
 */
export function filterInput_<RA, RB, EA, EB, B, A, A1 extends A>(
  ref: PRef<RA, RB, EA, EB, A, B>,
  f: (_: A1) => boolean,
): PRef<RA, RB, Maybe<EA>, EB, A1, B> {
  return ref.match(Maybe.just, identity, (a) => (f(a) ? Either.right(a) : Either.left(Nothing())), Either.right);
}

/**
 * Filters the `get` value of the `Ref` with the specified predicate,
 * returning a `Ref` with a `get` value that succeeds if the predicate is
 * satisfied or else fails with `None`.
 *
 * @tsplus fluent fncts.control.Ref filterOutput
 * @tsplus fluent fncts.control.Ref.Synchronized filterOutput
 */
export function filterOutput_<RA, RB, EA, EB, A, B>(
  ref: PRef<RA, RB, EA, EB, A, B>,
  f: (_: B) => boolean,
): PRef<RA, RB, EA, Maybe<EB>, A, B> {
  return ref.match(identity, Maybe.just, Either.right, (b) => (f(b) ? Either.right(b) : Either.left(Nothing())));
}
