export const hashable = Symbol.for("fncts.Hashable");

/**
 * @tsplus static fncts.builtin.SymbolOps hashable
 */
export const _hashable: typeof hashable = hashable;

export interface Hashable {
  [hashable]: number;
}

export function isHashable(u: unknown): u is Hashable {
  return isObject(u) && Symbol.hashable in u;
}

/**
 * @tsplus type fncts.HashableOps
 */
export interface HashableOps {}

export const Hashable: HashableOps = {};
