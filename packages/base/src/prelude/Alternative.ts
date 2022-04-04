import type { AltMin } from "@fncts/base/prelude/Alt";
import type { ApplicativeMin } from "@fncts/base/prelude/Applicative";
import type { Nil, NilMin } from "@fncts/base/prelude/Nil";

import { Alt } from "@fncts/base/prelude/Alt";
import { Applicative } from "@fncts/base/prelude/Applicative";

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
