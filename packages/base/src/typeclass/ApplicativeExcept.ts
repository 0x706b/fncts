import type { Applicative } from "@fncts/base/typeclass/Applicative";
import type { Fail } from "@fncts/base/typeclass/Fail";

import { identity } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.ApplicativeExcept
 */
export interface ApplicativeExcept<F extends HKT> extends Applicative<F>, Fail<F> {
  catchAll<K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, A1>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    f: (
      e: E,
    ) => HKT.Kind<
      F,
      HKT.Intro<"K", K, K1>,
      HKT.Intro<"Q", Q, Q1>,
      HKT.Intro<"W", W, W1>,
      HKT.Intro<"X", X, X1>,
      HKT.Intro<"I", I, I1>,
      HKT.Intro<"S", S, S1>,
      HKT.Intro<"R", R, R1>,
      HKT.Intro<"E", E, E1>,
      A1
    >,
  ): HKT.Kind<
    F,
    HKT.Mix<"K", [K, K1]>,
    HKT.Mix<"Q", [Q, Q1]>,
    HKT.Mix<"W", [W, W1]>,
    HKT.Mix<"X", [X, X1]>,
    HKT.Mix<"I", [I, I1]>,
    HKT.Mix<"S", [S, S1]>,
    HKT.Mix<"R", [R, R1]>,
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
 * @tsplus fluent fncts.Kind catchAll
 */
export function catchAll<F extends HKT, K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, A1>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  f: (
    e: E,
  ) => HKT.Kind<
    F,
    HKT.Intro<"K", K, K1>,
    HKT.Intro<"Q", Q, Q1>,
    HKT.Intro<"W", W, W1>,
    HKT.Intro<"X", X, X1>,
    HKT.Intro<"I", I, I1>,
    HKT.Intro<"S", S, S1>,
    HKT.Intro<"R", R, R1>,
    HKT.Intro<"E", E, E1>,
    A1
  >,
  /** @tsplus auto */ F: ApplicativeExcept<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K, K1]>,
  HKT.Mix<"Q", [Q, Q1]>,
  HKT.Mix<"W", [W, W1]>,
  HKT.Mix<"X", [X, X1]>,
  HKT.Mix<"I", [I, I1]>,
  HKT.Mix<"S", [S, S1]>,
  HKT.Mix<"R", [R, R1]>,
  E1,
  A | A1
> {
  return F.catchAll(fa, f);
}

/**
 * @tsplus fluent fncts.Kind catchJust
 */
export function catchJust<F extends HKT, K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, A1>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  f: (
    e: E,
  ) => Maybe<
    HKT.Kind<
      F,
      HKT.Intro<"K", K, K1>,
      HKT.Intro<"Q", Q, Q1>,
      HKT.Intro<"W", W, W1>,
      HKT.Intro<"X", X, X1>,
      HKT.Intro<"I", I, I1>,
      HKT.Intro<"S", S, S1>,
      HKT.Intro<"R", R, R1>,
      HKT.Intro<"E", E, E1>,
      A1
    >
  >,
  /**
   * @tsplus auto
   * @tsplus implicit local
   */
  F: ApplicativeExcept<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K, K1]>,
  HKT.Mix<"Q", [Q, Q1]>,
  HKT.Mix<"W", [W, W1]>,
  HKT.Mix<"X", [X, X1]>,
  HKT.Mix<"I", [I, I1]>,
  HKT.Mix<"S", [S, S1]>,
  HKT.Mix<"R", [R, R1]>,
  HKT.Mix<"E", [E, E1]>,
  A | A1
> {
  return fa.catchAll((e) => f(e).match(() => F.fail(e), identity) as HKT.Kind<F, K, Q1, W1, X1, I, S, R1, E1, A1>);
}

/**
 * @tsplus fluent fncts.Kind either
 */
export function either<F extends HKT, K, Q, W, X, I, S, R, E, A>(
  self: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  /**
   * @tsplus auto
   * @tsplus implicit local
   */
  F: ApplicativeExcept<F>,
): HKT.Kind<F, K, Q, W, X, I, S, R, never, Either<E, A>> {
  return self.map(Either.right, F).catchAll((e) => F.pure(Either.left(e)));
}
