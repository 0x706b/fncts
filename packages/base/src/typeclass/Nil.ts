/**
 * @tsplus type fncts.Nil
 */
export interface Nil<F extends HKT> extends HKT.Typeclass<F> {
  nil<
    K = HKT.Low<"K">,
    Q = HKT.Low<"Q">,
    W = HKT.Low<"W">,
    X = HKT.Low<"X">,
    I = HKT.Low<"I">,
    S = HKT.Low<"S">,
    R = HKT.Low<"R">,
    E = HKT.Low<"E">,
  >(): HKT.Kind<F, K, Q, W, X, I, S, R, E, never>;
}

/**
 * @tsplus fluent fncts.Kind nil
 */
export function nil<
  F extends HKT,
  K = HKT.Low<"K">,
  Q = HKT.Low<"Q">,
  W = HKT.Low<"W">,
  X = HKT.Low<"X">,
  I = HKT.Low<"I">,
  S = HKT.Low<"S">,
  R = HKT.Low<"R">,
  E = HKT.Low<"E">,
>(/** @tsplus auto */ F: Nil<F>): HKT.Kind<F, K, Q, W, X, I, S, R, E, never> {
  return F.nil();
}
