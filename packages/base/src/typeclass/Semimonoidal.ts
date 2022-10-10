export interface Semimonoidal<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  zip: <K1, Q1, W1, X1, I1, S1, R1, E1, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
    fb: HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      B
    >,
  ) => <A>(
    fa: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
  ) => HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    Zipped.Make<A, B>
  >;
}

/**
 * @tsplus type fncts.SemimonoidalOps
 */
export interface SemimonoidalOps {}

export const Semimonoidal: SemimonoidalOps = {};
