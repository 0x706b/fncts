import type { EqMin } from "./Eq.js";
import type { Hash } from "./Hash.js";

import { Eq } from "./Eq.js";

/**
 * @tsplus type fncts.HashEq
 */
export interface HashEq<A> extends Hash<A>, Eq<A> {}

/**
 * @tsplus type fncts.HashEqOps
 */
export interface HashEqOps {}

export const HashEq: HashEqOps = {};

export type HashEqMin<A> = Hash<A> & EqMin<A>;

/**
 * @tsplus static fncts.HashEqOps __call
 */
export function mkHashEq<A>(F: HashEqMin<A>): HashEq<A> {
  return {
    ...Eq(F),
    hash: F.hash,
  };
}

/**
 * @tsplus static fncts.HashEqOps StructuralStrict
 */
export const StructuralStrict = HashEq({
  hash: Hashable.hash,
  equals_: Equatable.strictEquals,
});

/**
 * @tsplus static fncts.HashEqOps StructuralDeep
 */
export const StructuralDeep = HashEq({
  hash: Hashable.hash,
  equals_: Equatable.deepEquals,
});
