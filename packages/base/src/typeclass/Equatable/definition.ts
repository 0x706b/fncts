export const equatable = Symbol.for("fncts.equatable");

/**
 * @tsplus static fncts.builtin.SymbolOps equatable
 */
export const _equatable: typeof equatable = equatable;

/**
 * @tsplus type fncts.Equatable
 */
export interface Equatable {
  [equatable](that: unknown): boolean;
}

export function isEquatable(u: unknown): u is Equatable {
  return isObject(u) && Symbol.equatable in u;
}

/**
 * @tsplus type fncts.EquatableOps
 */
export interface EquatableOps {}

export const Equatable: EquatableOps = {};
