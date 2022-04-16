import type { ApplicativeExceptMin } from "@fncts/base/typeclass/ApplicativeExcept";
import type { MonadMin } from "@fncts/base/typeclass/Monad";

import { ApplicativeExcept } from "@fncts/base/typeclass/ApplicativeExcept";
import { Monad } from "@fncts/base/typeclass/Monad";

/**
 * @tsplus type fncts.MonadExcept
 */
export interface MonadExcept<F extends HKT.CovariantE, FC = HKT.None> extends Monad<F, FC>, ApplicativeExcept<F, FC> {
  readonly absolve: absolve<F, FC>;
}

/**
 * @tsplus type fncts.MonadExceptOps
 */
export interface MonadExceptOps {}

export const MonadExcept: MonadExceptOps = {};

export type MonadExceptMin<F extends HKT.CovariantE, FC = HKT.None> = MonadMin<F, FC> & ApplicativeExceptMin<F, FC>;

/**
 * @tsplus static fncts.MonadExceptOps __call
 */
export function mkMonadExcept<F extends HKT.CovariantE, FC = HKT.None>(F: MonadExceptMin<F, FC>): MonadExcept<F, FC>;
export function mkMonadExcept<F>(F: MonadExceptMin<HKT.FCoE<F>>): MonadExcept<HKT.FCoE<F>> {
  return HKT.instance<MonadExcept<HKT.FCoE<F>>>({
    ...Monad(F),
    ...ApplicativeExcept(F),
    absolve: absolveF(F),
  });
}

export interface absolve<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, E1, A>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, Either<HKT.OrFix<FC, "E", E1>, A>>,
  ): HKT.Kind<F, FC, K, Q, W, X, I, S, R, HKT.Mix<F, "E", [E, E1]>, A>;
}

/**
 * @tsplus static fncts.MonadExceptOps absolveF
 */
export function absolveF<F extends HKT.CovariantE, FC = HKT.None>(F: MonadExceptMin<F, FC>): absolve<F, FC>;
export function absolveF<F>(F: MonadExceptMin<HKT.FCoE<F>>): absolve<HKT.FCoE<F>> {
  return (fa) => F.flatMap_(fa, (r) => r.match(F.fail, F.pure));
}
