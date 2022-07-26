import type { Alt } from "@fncts/base/typeclass/Alt";
import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { Nil } from "@fncts/base/typeclass/Nil";

/**
 * @tsplus type fncts.Alternative
 */
export interface Alternative<F extends HKT, FC = HKT.None> extends Applicative<F, FC>, Nil<F, FC>, Alt<F, FC> {}

/**
 * @tsplus type fncts.AlternativeOps
 */
export interface AlternativeOps {}

export const Alternative: AlternativeOps = {};
