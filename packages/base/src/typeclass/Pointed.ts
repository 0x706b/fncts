export interface Pointed<F extends HKT> extends HKT.Typeclass<F> {
  pure<
    A,
    K = HKT.Low<"K">,
    Q = HKT.Low<"Q">,
    W = HKT.Low<"W">,
    X = HKT.Low<"X">,
    I = HKT.Low<"I">,
    S = HKT.Low<"S">,
    R = HKT.Low<"R">,
    E = HKT.Low<"E">,
  >(
    a: A,
  ): HKT.Kind<F, K, Q, W, X, I, S, R, E, A>;
}

/**
 * @tsplus type fncts.PointedOps
 */
export interface PointedOps {}

export const Pointed: PointedOps = {};

/**
 * @tsplus static fncts.PointedOps pure
 */
export function pure<
  F extends HKT,
  C,
  A,
  K = HKT.Low<"K">,
  Q = HKT.Low<"Q">,
  W = HKT.Low<"W">,
  X = HKT.Low<"X">,
  I = HKT.Low<"I">,
  S = HKT.Low<"S">,
  R = HKT.Low<"R">,
  E = HKT.Low<"E">,
>(a: A, /** @tsplus auto */ F: Pointed<F>): HKT.Kind<F, K, Q, W, X, I, S, R, E, A> {
  return F.pure(a);
}
