import type { FunctorMin } from "@fncts/base/typeclass/Functor";

import { identity } from "@fncts/base/data/function";
import { Functor } from "@fncts/base/typeclass/Functor";

export interface FlatMap<F extends HKT, FC = HKT.None> extends Functor<F, FC> {
  readonly flatMap_: flatMap_<F, FC>;
  readonly flatMap: flatMap<F, FC>;
  readonly flatten: flatten<F, FC>;
  readonly tap_: tap_<F, FC>;
  readonly tap: tap<F, FC>;
}

/**
 * @tsplus type fncts.FlatMapOps
 */
export interface FlatMapOps {}

export const FlatMap: FlatMapOps = {};

export type ChainMin<F extends HKT, FC = HKT.None> = {
  readonly flatMap_: flatMap_<F, FC>;
} & FunctorMin<F, FC>;

/**
 * @tsplus static fncts.FlatMapOps __call
 */
export function mkFlatMap<F extends HKT, FC = HKT.None>(F: ChainMin<F, FC>): FlatMap<F, FC>;
export function mkFlatMap<F>(F: ChainMin<HKT.F<F>>): FlatMap<HKT.F<F>> {
  const tap_: tap_<HKT.F<F>>       = (ma, f) => F.flatMap_(ma, (a) => F.map_(f(a), () => a));
  const flatten: flatten<HKT.F<F>> = (mma) => F.flatMap_(mma, identity);
  return HKT.instance<FlatMap<HKT.F<F>>>({
    ...Functor(F),
    flatMap_: F.flatMap_,
    flatMap: (f) => (ma) => F.flatMap_(ma, f),
    flatten,
    tap_,
    tap: (f) => (ma) => tap_(ma, f),
  });
}

export interface flatMap_<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
    ma: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    f: (
      a: A,
    ) => HKT.Kind<
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
  ): HKT.Kind<
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
    B
  >;
}

export interface flatMap<F extends HKT, TC = HKT.None> {
  <K2, Q2, W2, X2, I2, S2, R2, E2, B, A>(f: (a: A) => HKT.Kind<F, TC, K2, Q2, W2, X2, I2, S2, R2, E2, B>): <
    K1,
    Q1,
    W1,
    X1,
    I1,
    S1,
    R1,
    E1,
  >(
    ma: HKT.Kind<
      F,
      TC,
      HKT.Intro<F, "K", K2, K1>,
      HKT.Intro<F, "Q", Q2, Q1>,
      HKT.Intro<F, "W", W2, W1>,
      HKT.Intro<F, "X", X2, X1>,
      HKT.Intro<F, "I", I2, I1>,
      HKT.Intro<F, "S", S2, S1>,
      HKT.Intro<F, "R", R2, R1>,
      HKT.Intro<F, "E", E2, E1>,
      A
    >,
  ) => HKT.Kind<
    F,
    TC,
    HKT.Mix<F, "K", [K2, K1]>,
    HKT.Mix<F, "Q", [Q2, Q1]>,
    HKT.Mix<F, "W", [W2, W1]>,
    HKT.Mix<F, "X", [X2, X1]>,
    HKT.Mix<F, "I", [I2, I1]>,
    HKT.Mix<F, "S", [S2, S1]>,
    HKT.Mix<F, "R", [R2, R1]>,
    HKT.Mix<F, "E", [E2, E1]>,
    B
  >;
}

export interface flatten<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2>(
    mma: HKT.Kind<
      F,
      FC,
      K2,
      Q2,
      W2,
      X2,
      I2,
      S2,
      R2,
      E2,
      HKT.Kind<
        F,
        FC,
        HKT.Intro<F, "K", K2, K1>,
        HKT.Intro<F, "Q", Q2, Q1>,
        HKT.Intro<F, "W", W2, W1>,
        HKT.Intro<F, "X", X2, X1>,
        HKT.Intro<F, "I", I2, I1>,
        HKT.Intro<F, "S", S2, S1>,
        HKT.Intro<F, "R", R2, R1>,
        HKT.Intro<F, "E", E2, E1>,
        A
      >
    >,
  ): HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K2, K1]>,
    HKT.Mix<F, "Q", [Q2, Q1]>,
    HKT.Mix<F, "W", [W2, W1]>,
    HKT.Mix<F, "X", [X2, X1]>,
    HKT.Mix<F, "I", [I2, I1]>,
    HKT.Mix<F, "S", [S2, S1]>,
    HKT.Mix<F, "R", [R2, R1]>,
    HKT.Mix<F, "E", [E2, E1]>,
    A
  >;
}

export interface tap_<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
    ma: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    f: (
      a: A,
    ) => HKT.Kind<
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
  ): HKT.Kind<
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
    A
  >;
}

export interface tap<F extends HKT, TC = HKT.None> {
  <K2, Q2, W2, X2, I2, S2, R2, E2, B, A>(f: (a: A) => HKT.Kind<F, TC, K2, Q2, W2, X2, I2, S2, R2, E2, B>): <
    K1,
    Q1,
    W1,
    X1,
    I1,
    S1,
    R1,
    E1,
  >(
    ma: HKT.Kind<
      F,
      TC,
      HKT.Intro<F, "K", K2, K1>,
      HKT.Intro<F, "Q", Q2, Q1>,
      HKT.Intro<F, "W", W2, W1>,
      HKT.Intro<F, "X", X2, X1>,
      HKT.Intro<F, "I", I2, I1>,
      HKT.Intro<F, "S", S2, S1>,
      HKT.Intro<F, "R", R2, R1>,
      HKT.Intro<F, "E", E2, E1>,
      A
    >,
  ) => HKT.Kind<
    F,
    TC,
    HKT.Mix<F, "K", [K2, K1]>,
    HKT.Mix<F, "Q", [Q2, Q1]>,
    HKT.Mix<F, "W", [W2, W1]>,
    HKT.Mix<F, "X", [X2, X1]>,
    HKT.Mix<F, "I", [I2, I1]>,
    HKT.Mix<F, "S", [S2, S1]>,
    HKT.Mix<F, "R", [R2, R1]>,
    HKT.Mix<F, "E", [E2, E1]>,
    A
  >;
}
