import type { Either } from "../data/Either";
import type { ApplicativeExceptMin } from "./ApplicativeExcept";
import type { MonadMin } from "./Monad";

import { ApplicativeExcept } from "./ApplicativeExcept";
import { HKT } from "./HKT";
import { Monad } from "./Monad";

/**
 * @tsplus type fncts.prelude.MonadExcept
 */
export interface MonadExcept<F extends HKT.CovariantE, FC = HKT.None>
  extends Monad<F, FC>,
    ApplicativeExcept<F, FC> {
  readonly absolve: absolve<F, FC>;
}

/**
 * @tsplus type fncts.prelude.MonadExceptOps
 */
export interface MonadExceptOps {}

export const MonadExcept: MonadExceptOps = {};

export type MonadExceptMin<F extends HKT.CovariantE, FC = HKT.None> = MonadMin<F, FC> &
  ApplicativeExceptMin<F, FC>;

/**
 * @tsplus static fncts.prelude.MonadExceptOps __call
 */
export function mkMonadExcept<F extends HKT.CovariantE, FC = HKT.None>(
  F: MonadExceptMin<F, FC>,
): MonadExcept<F, FC>;
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
 * @tsplus static fncts.prelude.MonadExceptOps absolveF
 */
export function absolveF<F extends HKT.CovariantE, FC = HKT.None>(
  F: MonadExceptMin<F, FC>,
): absolve<F, FC>;
export function absolveF<F>(F: MonadExceptMin<HKT.FCoE<F>>): absolve<HKT.FCoE<F>> {
  return (fa) => F.chain_(fa, (r) => r.match(F.fail, F.pure));
}
