import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { Fail } from "@fncts/base/typeclass/Fail";

import { identity } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.ApplicativeExcept
 */
export interface ApplicativeExcept<F extends HKT, FC = HKT.None> extends Applicative<F, FC>, Fail<F, FC> {
  catchAll: <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, A1>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    f: (
      e: E,
    ) => HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K, K1>,
      HKT.Intro<F, "Q", Q, Q1>,
      HKT.Intro<F, "W", W, W1>,
      HKT.Intro<F, "X", X, X1>,
      HKT.Intro<F, "I", I, I1>,
      HKT.Intro<F, "S", S, S1>,
      HKT.Intro<F, "R", R, R1>,
      HKT.Intro<F, "E", E, E1>,
      A1
    >,
  ) => HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K, K1]>,
    HKT.Mix<F, "Q", [Q, Q1]>,
    HKT.Mix<F, "W", [W, W1]>,
    HKT.Mix<F, "X", [X, X1]>,
    HKT.Mix<F, "I", [I, I1]>,
    HKT.Mix<F, "S", [S, S1]>,
    HKT.Mix<F, "R", [R, R1]>,
    E1,
    A | A1
  >;
}

/**
 * @tsplus type fncts.ApplicativeExceptOps
 */
export interface ApplicativeExceptOps {}

export const ApplicativeExcept: ApplicativeExceptOps = {};

/**
 * @tsplus fluent fncts.Kind catchJust
 */
export function catchJust<F extends HKT, FC = HKT.None>(
  F: ApplicativeExcept<F, FC>,
): <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, A1>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  f: (
    e: E,
  ) => Maybe<
    HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K, K1>,
      HKT.Intro<F, "Q", Q, Q1>,
      HKT.Intro<F, "W", W, W1>,
      HKT.Intro<F, "X", X, X1>,
      HKT.Intro<F, "I", I, I1>,
      HKT.Intro<F, "S", S, S1>,
      HKT.Intro<F, "R", R, R1>,
      HKT.Intro<F, "E", E, E1>,
      A1
    >
  >,
) => HKT.Kind<
  F,
  FC,
  HKT.Mix<F, "K", [K, K1]>,
  HKT.Mix<F, "Q", [Q, Q1]>,
  HKT.Mix<F, "W", [W, W1]>,
  HKT.Mix<F, "X", [X, X1]>,
  HKT.Mix<F, "I", [I, I1]>,
  HKT.Mix<F, "S", [S, S1]>,
  HKT.Mix<F, "R", [R, R1]>,
  HKT.Mix<F, "E", [E, E1]>,
  A | A1
> {
  return (fa, f) => F.catchAll(fa, (e) => unsafeCoerce(f(e).match(() => F.fail(e), identity)));
}

/**
 * @tsplus static fncts.ApplicativeExceptOps either
 */
export function either<F extends HKT, FC = HKT.None>(
  F: ApplicativeExcept<F, FC>,
): <K, Q, W, X, I, S, R, E, A>(
  self: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, never, Either<E, A>>;
export function either<F>(
  F: ApplicativeExcept<HKT.FCoE<F>>,
): <E, A>(self: HKT.FK2<F, E, A>) => HKT.FK2<F, never, Either<E, A>> {
  return (self) => F.catchAll(F.map(self, Either.right), (e) => F.pure(Either.left(e)));
}
