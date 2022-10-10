import type { Nil } from "@fncts/base/typeclass/Nil";
import type { Semialign } from "@fncts/base/typeclass/Semialign";
/**
 * @tsplus type fncts.Align
 */
export interface Align<F extends HKT, FC = HKT.None> extends Semialign<F, FC>, Nil<F, FC> {}
/**
 * @tsplus type fncts.AlignOps
 */
export interface AlignOps {}
export const Align: AlignOps = {};
