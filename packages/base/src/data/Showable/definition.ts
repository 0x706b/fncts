import type { ShowComputationExternal } from "@fncts/base/data/Showable/show";

export const showableSymbol = Symbol("fncts.Showable");

/**
 * @tsplus static fncts.builtin.SymbolOps showable
 */
export const _showable: typeof showableSymbol = showableSymbol;

export interface Showable {
  [showableSymbol]: ShowComputationExternal;
}

export function isShowable(value: unknown): value is Showable {
  return isObject(value) && Symbol.showable in value;
}

/**
 * @tsplus type ShowableOps
 */
export interface ShowableOps {}

export const Showable: ShowableOps = {};
