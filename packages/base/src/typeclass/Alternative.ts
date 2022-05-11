import type { Alt } from "@fncts/base/typeclass/Alt";
import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { Nil } from "@fncts/base/typeclass/Nil";

/**
 * @tsplus type fncts.Alternative
 */
export interface Alternative<F extends HKT> extends Applicative<F>, Nil<F>, Alt<F> {}

/**
 * @tsplus type fncts.AlternativeOps
 */
export interface AlternativeOps {}

export const Alternative: AlternativeOps = {};
