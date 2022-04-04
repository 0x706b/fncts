export const hashable = Symbol.for("fncts.prelude.Hashable");

/**
 * @tsplus static fncts.prelude.builtin.SymbolOps hashable
 */
export const _hashable: typeof hashable = hashable;

export interface Hashable {
  [hashable]: number;
}

export function isHashable(u: unknown): u is Hashable {
  return isObject(u) && Symbol.hashable in u;
}

/**
 * @tsplus type fncts.prelude.HashableOps
 */
export interface HashableOps {}

export const Hashable: HashableOps = {};
