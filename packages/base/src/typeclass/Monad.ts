import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { FlatMap } from "@fncts/base/typeclass/Chain";

export interface Monad<F extends HKT, FC = HKT.None> extends Applicative<F, FC>, FlatMap<F, FC> {}

/**
 * @tsplus type fncts.MonadOps
 */
export interface MonadOps {}

export const Monad: MonadOps = {};
