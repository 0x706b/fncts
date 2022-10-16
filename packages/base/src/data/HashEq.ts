import type { Hash } from "./Hash.js";

import { Eq } from "@fncts/base/data/Eq";

/**
 * @tsplus type fncts.HashEq
 */
export interface HashEq<A> extends Hash<A>, Eq<A> {}

/**
 * @tsplus type fncts.HashEqOps
 */
export interface HashEqOps {}

export const HashEq: HashEqOps = {};

/**
 * @tsplus static fncts.HashEqOps __call
 */
export function makeHashEq<A>(F: HashEq<A>): HashEq<A> {
  return {
    ...Eq(F),
    hash: F.hash,
  };
}

/**
 * @tsplus static fncts.HashEqOps StructuralStrict
 */
export const StructuralStrict = HashEq({
  hash: Hashable.unknown,
  equals: (y) => (x) => Equatable.strictEquals(x, y),
});

/**
 * @tsplus static fncts.HashEqOps StructuralDeep
 */
export const StructuralDeep = HashEq({
  hash: Hashable.unknown,
  equals: (y) => (x) => Equatable.deepEquals(x, y),
});
