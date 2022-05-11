import type { Functor } from "@fncts/base/typeclass/Functor";

/**
 * @tsplus type fncts.Alt
 */
export interface Alt<F extends HKT> extends Functor<F> {
  alt<K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    that: Lazy<
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
        HKT.Intro<"A", A, B>
      >
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
    HKT.Mix<"E", [E, E1]>,
    HKT.Mix<"A", [A, B]>
  >;
}

/**
 * @tsplus type fncts.AltOps
 */
export interface AltOps {}

export const Alt: AltOps = {};

export function alt<F extends HKT, K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
  self: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  that: Lazy<
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
      HKT.Intro<"A", A, B>
    >
  >,
  /** @tsplus auto */ F: Alt<F>,
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
  HKT.Mix<"A", [A, B]>
> {
  return F.alt(self, that);
}
