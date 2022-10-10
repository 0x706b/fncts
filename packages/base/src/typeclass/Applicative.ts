import type { Apply } from "@fncts/base/typeclass/Apply";
import type { Pointed } from "@fncts/base/typeclass/Pointed";
export interface Applicative<F extends HKT, FC = HKT.None> extends Apply<F, FC>, Pointed<F, FC> {}

/**
 * @tsplus type fncts.ApplicativeOps
 */
export interface ApplicativeOps {}

export const Applicative: ApplicativeOps = {};

export type CompatibleApplicative<F extends HKT, FC, A> = Applicative<F, FC> &
  ([A] extends [HKT.Kind<F, any, any, any, any, any, any, any, any, any, any>]
    ? unknown
    : ["invalid Applicative instance for", A]);
