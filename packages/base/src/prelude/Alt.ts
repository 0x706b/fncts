import type { FunctorMin } from "./Functor";

import { Functor } from "./Functor";
import { HKT } from "./HKT";

/**
 * @tsplus type fncts.prelude.Alt
 */
export interface Alt<F extends HKT, FC = HKT.None> extends Functor<F, FC> {
  readonly alt_: alt_<F, FC>;
  readonly alt: alt<F, FC>;
}

/**
 * @tsplus type fncts.prelude.AltOps
 */
export interface AltOps {}

export const Alt: AltOps = {};

export type AltMin<F extends HKT, FC = HKT.None> = FunctorMin<F, FC> & {
  readonly alt_: alt_<F, FC>;
};

/**
 * @tsplus static fncts.prelude.AltOps __call
 */
export function mkAlt<F extends HKT, C = HKT.None>(F: AltMin<F, C>): Alt<F, C>;
export function mkAlt<F>(F: AltMin<HKT.F<F>>): Alt<HKT.F<F>> {
  return HKT.instance<Alt<HKT.F<F>>>({
    ...Functor(F),
    alt_: F.alt_,
    alt: (that) => (fa) => F.alt_(fa, that),
  });
}

export interface alt<F extends HKT, C = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, B>(that: () => HKT.Kind<F, C, K1, Q1, W1, X1, I1, S1, R1, E1, B>): <K, Q, W, X, I, S, R, E, A>(
    fa: HKT.Kind<
      F,
      C,
      HKT.Intro<F, "K", K1, K>,
      HKT.Intro<F, "Q", Q1, Q>,
      HKT.Intro<F, "W", W1, W>,
      HKT.Intro<F, "X", X1, X>,
      HKT.Intro<F, "I", I1, I>,
      HKT.Intro<F, "S", S1, S>,
      HKT.Intro<F, "R", R1, R>,
      HKT.Intro<F, "E", E1, E>,
      HKT.Intro<F, "A", B, A>
    >,
  ) => HKT.Kind<
    F,
    C,
    HKT.Mix<F, "K", [K1, K]>,
    HKT.Mix<F, "Q", [Q1, Q]>,
    HKT.Mix<F, "W", [W1, W]>,
    HKT.Mix<F, "X", [X1, X]>,
    HKT.Mix<F, "I", [I1, I]>,
    HKT.Mix<F, "S", [S1, S]>,
    HKT.Mix<F, "R", [R1, R]>,
    HKT.Mix<F, "E", [E1, E]>,
    HKT.Mix<F, "A", [B, A]>
  >;
}

export interface alt_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    that: () => HKT.Kind<
      F,
      C,
      HKT.Intro<F, "K", K, K1>,
      HKT.Intro<F, "Q", Q, Q1>,
      HKT.Intro<F, "W", W, W1>,
      HKT.Intro<F, "X", X, X1>,
      HKT.Intro<F, "I", I, I1>,
      HKT.Intro<F, "S", S, S1>,
      HKT.Intro<F, "R", R, R1>,
      HKT.Intro<F, "E", E, E1>,
      HKT.Intro<F, "A", A, B>
    >,
  ): HKT.Kind<
    F,
    C,
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
