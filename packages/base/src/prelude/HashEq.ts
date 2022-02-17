import type { EqMin } from "./Eq";
import type { Hash } from "./Hash";

import { Eq } from "./Eq";
import { Equatable } from "./Equatable";
import { Hashable } from "./Hashable";

/**
 * @tsplus type fncts.prelude.HashEq
 */
export interface HashEq<A> extends Hash<A>, Eq<A> {}

/**
 * @tsplus type fncts.prelude.HashEqOps
 */
export interface HashEqOps {}

export const HashEq: HashEqOps = {};

export type HashEqMin<A> = Hash<A> & EqMin<A>;

/**
 * @tsplus static fncts.prelude.HashEqOps __call
 */
export function mkHashEq<A>(F: HashEqMin<A>): HashEq<A> {
  return {
    ...Eq(F),
    hash: F.hash,
  };
}

/**
 * @tsplus static fncts.prelude.HashEqOps StructuralStrict
 */
export const StructuralStrict = HashEq({
  hash: Hashable.hash,
  equals_: Equatable.strictEquals,
});

/**
 * @tsplus static fncts.prelude.HashEqOps StructuralDeep
 */
export const StructuralDeep = HashEq({
  hash: Hashable.hash,
  equals_: Equatable.deepEquals,
});
