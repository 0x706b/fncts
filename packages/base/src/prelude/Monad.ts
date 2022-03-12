import type { ApplicativeMin } from "./Applicative.js";
import type { ChainMin } from "./Chain.js";

import { Applicative } from "./Applicative.js";
import { Chain } from "./Chain.js";
import { HKT } from "./HKT.js";

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
