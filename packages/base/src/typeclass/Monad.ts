import type { ApplicativeMin } from "@fncts/base/typeclass/Applicative";
import type { ChainMin } from "@fncts/base/typeclass/Chain";

import { Applicative } from "@fncts/base/typeclass/Applicative";
import { FlatMap } from "@fncts/base/typeclass/Chain";

export interface Monad<F extends HKT, FC = HKT.None> extends Applicative<F, FC>, FlatMap<F, FC> {}

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
    ...FlatMap(F),
  });
}
