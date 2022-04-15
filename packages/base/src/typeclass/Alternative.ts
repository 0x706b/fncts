import type { AltMin } from "@fncts/base/typeclass/Alt";
import type { ApplicativeMin } from "@fncts/base/typeclass/Applicative";
import type { Nil, NilMin } from "@fncts/base/typeclass/Nil";

import { Alt } from "@fncts/base/typeclass/Alt";
import { Applicative } from "@fncts/base/typeclass/Applicative";

/**
 * @tsplus type fncts.Alternative
 */
export interface Alternative<F extends HKT, FC = HKT.None> extends Applicative<F, FC>, Nil<F, FC>, Alt<F, FC> {}

/**
 * @tsplus type fncts.AlternativeOps
 */
export interface AlternativeOps {}

export const Alternative: AlternativeOps = {};

export type AlternativeMin<F extends HKT, FC = HKT.None> = ApplicativeMin<F, FC> & NilMin<F, FC> & AltMin<F, FC>;

/**
 * @tsplus static fncts.AlternativeOps __call
 */
export function mkAlternative<F extends HKT, C = HKT.None>(F: AlternativeMin<F, C>): Alternative<F, C> {
  return HKT.instance<Alternative<F, C>>({
    ...Applicative(F),
    ...Alt(F),
    nil: F.nil,
  });
}
