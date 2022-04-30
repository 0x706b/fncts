/**
 * @tsplus static fncts.builtin.SymbolOps hash
 */
export const hashSymbol: unique symbol = Symbol.for("fncts.Hashable");

/**
 * @tsplus type fncts.Hashable
 */
export interface Hashable {
  [hashSymbol]: number;
}

export function isHashable(u: unknown): u is Hashable {
  return isObject(u) && Symbol.hash in u;
}

/**
 * @tsplus type fncts.HashableOps
 */
export interface HashableOps {}

export const Hashable: HashableOps = {};
