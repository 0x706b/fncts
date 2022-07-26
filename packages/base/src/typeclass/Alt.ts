import type { Functor } from "@fncts/base/typeclass/Functor";

/**
 * @tsplus type fncts.Alt
 */
export interface Alt<F extends HKT, FC = HKT.None> extends Functor<F, FC> {
  alt: <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    that: Lazy<
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
        HKT.Intro<F, "A", A, B>
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
    HKT.Mix<F, "A", [A, B]>
  >;
}

/**
 * @tsplus type fncts.AltOps
 */
export interface AltOps {}

export const Alt: AltOps = {};
