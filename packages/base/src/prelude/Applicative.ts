import type { ApplyMin } from "./Apply.js";
import type { PointedMin } from "./Pointed.js";

import { Apply } from "./Apply.js";
import { HKT } from "./HKT.js";
import { Pointed } from "./Pointed.js";

export interface Applicative<F extends HKT, FC = HKT.None> extends Apply<F, FC>, Pointed<F, FC> {}

/**
 * @tsplus type fncts.ApplicativeOps
 */
export interface ApplicativeOps {}

export const Applicative: ApplicativeOps = {};

export type ApplicativeMin<F extends HKT, FC = HKT.None> = ApplyMin<F, FC> & PointedMin<F, FC>;

/**
 * @tsplus static fncts.ApplicativeOps __call
 */
export function mkApplicative<F extends HKT, FC = HKT.None>(
  F: ApplicativeMin<F, FC>,
): Applicative<F, FC> {
  return HKT.instance<Applicative<F, FC>>({
    ...Pointed(F),
    ...Apply(F),
  });
}

export type CompatibleApplicative<F extends HKT, C, A> = Applicative<F, C> &
  ([A] extends [HKT.Kind<F, any, any, any, any, any, any, any, any, any, any>]
    ? unknown
    : ["invalid Applicative instance for", A]);
