import type { Functor } from "@fncts/base/typeclass/Functor";

import { identity } from "@fncts/base/data/function";

export interface FlatMap<F extends HKT> extends Functor<F> {
  flatMap<K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
    ma: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    f: (
      a: A,
    ) => HKT.Kind<
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
    B
  >;
}

/**
 * @tsplus type fncts.FlatMapOps
 */
export interface FlatMapOps {}

export const FlatMap: FlatMapOps = {};

/**
 * @tsplus fluent fncts.Kind flatMap
 */
export function flatMap<F extends HKT, K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
  ma: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
  f: (
    a: A,
  ) => HKT.Kind<
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
  /** @tsplus auto */ F: FlatMap<F>,
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
  B
> {
  return F.flatMap(ma, f);
}

/**
 * @tsplus fluent fncts.Kind flatten
 */
export function flatten<F extends HKT, K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2>(
  mma: HKT.Kind<
    F,
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
      HKT.Intro<"K", K2, K1>,
      HKT.Intro<"Q", Q2, Q1>,
      HKT.Intro<"W", W2, W1>,
      HKT.Intro<"X", X2, X1>,
      HKT.Intro<"I", I2, I1>,
      HKT.Intro<"S", S2, S1>,
      HKT.Intro<"R", R2, R1>,
      HKT.Intro<"E", E2, E1>,
      A
    >
  >,
  /** @tsplus auto */ F: FlatMap<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K2, K1]>,
  HKT.Mix<"Q", [Q2, Q1]>,
  HKT.Mix<"W", [W2, W1]>,
  HKT.Mix<"X", [X2, X1]>,
  HKT.Mix<"I", [I2, I1]>,
  HKT.Mix<"S", [S2, S1]>,
  HKT.Mix<"R", [R2, R1]>,
  HKT.Mix<"E", [E2, E1]>,
  A
> {
  return mma.flatMap(identity);
}

/**
 * @tsplus fluent fncts.Kind tap
 */
export function tap<F extends HKT, K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
  ma: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
  f: (
    a: A,
  ) => HKT.Kind<
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
  /** @tsplus auto */ F: FlatMap<F>,
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
  A
> {
  return ma.flatMap((a) => f(a).as(a, F));
}
