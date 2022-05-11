import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { FlatMap } from "@fncts/base/typeclass/Chain";

export interface Monad<F extends HKT> extends Applicative<F>, FlatMap<F> {}

/**
 * @tsplus type fncts.MonadOps
 */
export interface MonadOps {}

export const Monad: MonadOps = {};
