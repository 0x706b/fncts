/**
 * @tsplus static fncts.builtin.SymbolOps equals
 */
export const equalsSymbol: unique symbol = Symbol.for("fncts.Equatable");
/**
 * @tsplus type fncts.Equatable
 */
export interface Equatable {
  [equalsSymbol](that: unknown): boolean;
}
export function isEquatable(u: unknown): u is Equatable {
  return isObject(u) && Symbol.equals in u;
}
/**
 * @tsplus type fncts.EquatableOps
 */
export interface EquatableOps {}
export const Equatable: EquatableOps = {};
