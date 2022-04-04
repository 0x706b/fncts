import type { ApplicativeMin } from "@fncts/base/prelude/Applicative";
import type { ChainMin } from "@fncts/base/prelude/Chain";

import { Applicative } from "@fncts/base/prelude/Applicative";
import { Chain } from "@fncts/base/prelude/Chain";

export interface Monad<F extends HKT, FC = HKT.None> extends Applicative<F, FC>, Chain<F, FC> {}

/**
 * @tsplus type fncts.MonadOps
 */
export interface MonadOps {}

export const Monad: MonadOps = {};

export type MonadMin<F extends HKT, FC = HKT.None> = ApplicativeMin<F, FC> & ChainMin<F, FC>;

/**
 * @tsplus static fncts.MonadOps __call
 */
export function mkMonad<F extends HKT, FC = HKT.None>(F: MonadMin<F, FC>): Monad<F, FC> {
  return HKT.instance<Monad<F, FC>>({
    ...Applicative(F),
    ...Chain(F),
  });
}
