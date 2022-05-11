import type { Nil } from "@fncts/base/typeclass/Nil";
import type { Semialign } from "@fncts/base/typeclass/Semialign";

/**
 * @tsplus type fncts.Align
 */
export interface Align<F extends HKT> extends Semialign<F>, Nil<F> {}

/**
 * @tsplus type fncts.AlignOps
 */
export interface AlignOps {}

export const Align: AlignOps = {};