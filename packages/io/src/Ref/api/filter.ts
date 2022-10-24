import type { PRef } from "../definition.js";

import { identity } from "@fncts/base/data/function";

/**
 * Filters the `set` value of the `Ref` with the specified predicate,
 * returning a `Ref` with a `set` value that succeeds if the predicate is
 * satisfied or else fails with `None`.
 *
 * @tsplus pipeable fncts.io.Ref filterInput
 * @tsplus pipeable fncts.io.Ref.Synchronized filterInput
 */
export function filterInput<A, A1 extends A>(p: Predicate<A1>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(self: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, Maybe<EA>, EB, A1, B> => {
    return self.match(Maybe.just, identity, (a) => (p(a) ? Either.right(a) : Either.left(Nothing())), Either.right);
  };
}

/**
 * Filters the `get` value of the `Ref` with the specified predicate,
 * returning a `Ref` with a `get` value that succeeds if the predicate is
 * satisfied or else fails with `None`.
 *
 * @tsplus pipeable fncts.io.Ref filterOutput
 * @tsplus pipeable fncts.io.Ref.Synchronized filterOutput
 */
export function filterOutput<RA, RB, EA, EB, A, B>(p: Predicate<B>, __tsplusTrace?: string) {
  return (self: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EA, Maybe<EB>, A, B> => {
    return self.match(identity, Maybe.just, Either.right, (b) => (p(b) ? Either.right(b) : Either.left(Nothing())));
  };
}
