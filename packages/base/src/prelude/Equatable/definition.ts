import { isObject } from "../../util/predicates";

export const equatable = Symbol.for("fncts.prelude.equatable");

/**
 * @tsplus static fncts.prelude.builtin.SymbolOps equatable
 */
export const _equatable: typeof equatable = equatable;

/**
 * @tsplus type fncts.prelude.structural.Equatable
 */
export interface Equatable {
  [equatable](that: unknown): boolean;
}

export function isEquatable(u: unknown): u is Equatable {
  return isObject(u) && Symbol.equatable in u;
}

/**
 * @tsplus type fncts.prelude.structural.EquatableOps
 */
export interface EquatableOps {}

export const Equatable: EquatableOps = {};
