export interface Semimonoidal<F extends HKT, C = HKT.None> extends HKT.Typeclass<F, C> {
  readonly zip_: zip_<F, C>;
  readonly zip: zip<F, C>;
}

export type SemimonoidalMin<F extends HKT, C = HKT.None> = {
  readonly zip_: zip_<F, C>;
};

/**
 * @tsplus type fncts.SemimonoidalOps
 */
export interface SemimonoidalOps {}

export const Semimonoidal: SemimonoidalOps = {};

/**
 * @tsplus static fncts.SemimonoidalOps __call
 */
export function mkSemimonoidal<F extends HKT, C = HKT.None>(F: SemimonoidalMin<F, C>): Semimonoidal<F, C>;
export function mkSemimonoidal<F>(F: SemimonoidalMin<HKT.F<F>>): Semimonoidal<HKT.F<F>> {
  return HKT.instance<Semimonoidal<HKT.F<F>>>({
    zip_: F.zip_,
    zip: (fb) => (fa) => F.zip_(fa, fb),
  });
}

export interface zip_<F extends HKT, C = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
    fa: HKT.Kind<F, C, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    fb: HKT.Kind<
      F,
      C,
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
  ): HKT.Kind<
    F,
    C,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    readonly [A, B]
  >;
}

export interface zip<F extends HKT, C = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, B>(fb: HKT.Kind<F, C, K1, Q1, W1, X1, I1, S1, R1, E1, B>): <
    K2,
    Q2,
    W2,
    X2,
    I2,
    S2,
    R2,
    E2,
    A,
  >(
    fa: HKT.Kind<
      F,
      C,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      A
    >,
  ) => HKT.Kind<
    F,
    C,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    readonly [A, B]
  >;
}
