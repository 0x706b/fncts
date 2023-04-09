/**
 * @tsplus static fncts.builtin.SymbolOps equals
 */
export const equalsSymbol: unique symbol = Symbol.for("fncts.Equatable");

export interface EqualsContext {
  comparator: (a: unknown, b: unknown) => boolean;
}

/**
 * @tsplus type fncts.Equatable
 */
export interface Equatable {
  [equalsSymbol](that: unknown, context: EqualsContext): boolean;
}

export function isEquatable(u: unknown): u is Equatable {
  return isObject(u) && typeof u[Symbol.equals] === "function";
}

/**
 * @tsplus type fncts.EquatableOps
 */
export interface EquatableOps {}

export const Equatable: EquatableOps = {};
