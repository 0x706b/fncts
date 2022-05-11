export interface Semimonoidal<F extends HKT> extends HKT.Typeclass<F> {
  zip<K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
    fa: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    fb: HKT.Kind<
      F,
      HKT.Intro<"K", K1, K2>,
      HKT.Intro<"Q", Q1, Q2>,
      HKT.Intro<"W", W1, W2>,
      HKT.Intro<"X", X1, X2>,
      HKT.Intro<"I", I1, I2>,
      HKT.Intro<"S", S1, S2>,
      HKT.Intro<"R", R1, R2>,
      HKT.Intro<"E", E1, E2>,
      B
    >,
  ): HKT.Kind<
    F,
    HKT.Mix<"K", [K1, K2]>,
    HKT.Mix<"Q", [Q1, Q2]>,
    HKT.Mix<"W", [W1, W2]>,
    HKT.Mix<"X", [X1, X2]>,
    HKT.Mix<"I", [I1, I2]>,
    HKT.Mix<"S", [S1, S2]>,
    HKT.Mix<"R", [R1, R2]>,
    HKT.Mix<"E", [E1, E2]>,
    readonly [A, B]
  >;
}

/**
 * @tsplus type fncts.SemimonoidalOps
 */
export interface SemimonoidalOps {}

export const Semimonoidal: SemimonoidalOps = {};

/**
 * @tsplus fluent fncts.Kind zip
 */
export function zip<F extends HKT, C, K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
  fa: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
  fb: HKT.Kind<
    F,
    HKT.Intro<"K", K1, K2>,
    HKT.Intro<"Q", Q1, Q2>,
    HKT.Intro<"W", W1, W2>,
    HKT.Intro<"X", X1, X2>,
    HKT.Intro<"I", I1, I2>,
    HKT.Intro<"S", S1, S2>,
    HKT.Intro<"R", R1, R2>,
    HKT.Intro<"E", E1, E2>,
    B
  >,
  /** @tsplus auto */ F: Semimonoidal<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K1, K2]>,
  HKT.Mix<"Q", [Q1, Q2]>,
  HKT.Mix<"W", [W1, W2]>,
  HKT.Mix<"X", [X1, X2]>,
  HKT.Mix<"I", [I1, I2]>,
  HKT.Mix<"S", [S1, S2]>,
  HKT.Mix<"R", [R1, R2]>,
  HKT.Mix<"E", [E1, E2]>,
  readonly [A, B]
> {
  return F.zip(fa, fb);
}
