import type { AltMin } from "./Alt.js";
import type { ApplicativeMin } from "./Applicative.js";
import type { Nil, NilMin } from "./Nil.js";

import { Alt } from "./Alt.js";
import { Applicative } from "./Applicative.js";
import { HKT } from "./HKT.js";

/**
 * @tsplus type fncts.prelude.Alternative
 */
export interface Alternative<F extends HKT, FC = HKT.None>
  extends Applicative<F, FC>,
    Nil<F, FC>,
    Alt<F, FC> {}

/**
 * @tsplus type fncts.prelude.AlternativeOps
 */
export interface AlternativeOps {}

export const Alternative: AlternativeOps = {};

export type AlternativeMin<F extends HKT, FC = HKT.None> = ApplicativeMin<F, FC> &
  NilMin<F, FC> &
  AltMin<F, FC>;

/**
 * @tsplus static fncts.prelude.AlternativeOps __call
 */
export function mkAlternative<F extends HKT, C = HKT.None>(
  F: AlternativeMin<F, C>,
): Alternative<F, C> {
  return HKT.instance<Alternative<F, C>>({
    ...Applicative(F),
    ...Alt(F),
    nil: F.nil,
  });
}
