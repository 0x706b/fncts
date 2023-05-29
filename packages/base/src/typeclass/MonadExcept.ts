import type { ApplicativeExcept } from "@fncts/base/typeclass/ApplicativeExcept";
import type { Monad } from "@fncts/base/typeclass/Monad";

/**
 * @tsplus type fncts.MonadExcept
 */
export interface MonadExcept<F extends HKT, FC = HKT.None> extends Monad<F, FC>, ApplicativeExcept<F, FC> {}

/**
 * @tsplus type fncts.MonadExceptOps
 */
export interface MonadExceptOps {}

export const MonadExcept: MonadExceptOps = {};

/**
 * @tsplus static fncts.MonadExceptOps absolve
 */
export function absolve<F extends HKT, FC = HKT.None>(
  F: MonadExcept<F, FC>,
): <K, Q, W, X, I, S, R, E, E1, A>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, Either<E1, A>>,
) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, HKT.Mix<F, "E", [E, E1]>, A>;
export function absolve<F>(
  F: MonadExcept<HKT.F<F>>,
): <E, A, E1>(fa: HKT.FK2<F, E, Either<E1, A>>) => HKT.FK2<F, HKT.Mix<HKT.F<F>, "E", [E, E1]>, A> {
  return F.flatMap((r) => r.match({ Left: F.fail, Right: F.pure }));
}
