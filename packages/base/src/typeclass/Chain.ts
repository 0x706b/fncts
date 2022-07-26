import { identity } from "@fncts/base/data/function";
import { Functor } from "@fncts/base/typeclass/Functor";

export interface FlatMap<F extends HKT, FC = HKT.None> extends Functor<F, FC> {
  flatMap: <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
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
    B
  >;
}

/**
 * @tsplus type fncts.FlatMapOps
 */
export interface FlatMapOps {}

export const FlatMap: FlatMapOps = {};

/**
 * @tsplus fluent fncts.Kind flatten
 */
export function flatten<F extends HKT, FC = HKT.None>(
  F: FlatMap<F, FC>,
): <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2>(
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
) => HKT.Kind<
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
> {
  return (mma) => F.flatMap(mma, identity);
}

/**
 * @tsplus fluent fncts.Kind tap
 */
export function tap<F extends HKT, FC = HKT.None>(
  F: FlatMap<F, FC>,
): <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
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
  A
> {
  return (ma, f) => F.flatMap(ma, (a) => Functor.as(F)(f(a), a));
}
