import type { ShowComputationExternal } from "@fncts/base/typeclass/Showable/show";
export const showable = Symbol("fncts.Showable");
/**
 * @tsplus static fncts.builtin.SymbolOps showable
 */
export const _showable: typeof showable = showable;
export interface Showable {
  [showable]: ShowComputationExternal;
}
export function isShowable(value: unknown): value is Showable {
  return isObject(value) && Symbol.showable in value;
}
/**
 * @tsplus type ShowableOps
 */
export interface ShowableOps {}
export const Showable: ShowableOps = {};
