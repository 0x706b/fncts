import type { Apply } from "@fncts/base/typeclass/Apply";
import type { Pointed } from "@fncts/base/typeclass/Pointed";

export interface Applicative<F extends HKT> extends Apply<F>, Pointed<F> {}

/**
 * @tsplus type fncts.ApplicativeOps
 */
export interface ApplicativeOps {}

export const Applicative: ApplicativeOps = {};
