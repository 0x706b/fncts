import type { Nil, NilMin } from "./Nil.js";
import type { SemialignMin } from "./Semialign.js";

import { HKT } from "./HKT.js";
import { Semialign } from "./Semialign.js";

/**
 * @tsplus type fncts.prelude.Align
 */
export interface Align<F extends HKT, FC = HKT.None> extends Semialign<F, FC>, Nil<F, FC> {}

/**
 * @tsplus type fncts.prelude.AlignOps
 */
export interface AlignOps {}

export const Align: AlignOps = {};

export type AlignMin<F extends HKT, FC = HKT.None> = SemialignMin<F, FC> & NilMin<F, FC>;

/**
 * @tsplus static fncts.prelude.AlignOps __call
 */
export function mkAlign<F extends HKT, FC = HKT.None>(F: AlignMin<F, FC>): Align<F, FC> {
  return HKT.instance<Align<F, FC>>({
    ...Semialign(F),
    nil: F.nil,
  });
}
