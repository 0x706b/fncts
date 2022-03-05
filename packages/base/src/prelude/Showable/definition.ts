import type { ShowComputationExternal } from "./show";

import { isObject } from "../../util/predicates";

export const showable = Symbol("fncts.prelude.Showable");

/**
 * @tsplus static fncts.prelude.builtin.SymbolOps showable
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
