import type { ApplicativeExcept } from "@fncts/base/typeclass/ApplicativeExcept";
import type { Monad } from "@fncts/base/typeclass/Monad";

/**
 * @tsplus type fncts.MonadExcept
 */
export interface MonadExcept<F extends HKT> extends Monad<F>, ApplicativeExcept<F> {}

/**
 * @tsplus type fncts.MonadExceptOps
 */
export interface MonadExceptOps {}

export const MonadExcept: MonadExceptOps = {};

/**
 * @tsplus fluent fncts.Kind absolve
 */
export function absolve<F extends HKT, K, Q, W, X, I, S, R, E, E1, A>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, Either<E1, A>>,
  /** @tsplus auto */ F: MonadExcept<F>,
): HKT.Kind<F, K, Q, W, X, I, S, R, HKT.Mix<"E", [E, E1]>, A> {
  return fa.flatMap((r) => r.match(F.fail, F.pure), F);
}
