/**
 * @tsplus type fncts.Fail
 */
export interface Fail<F extends HKT> extends HKT.Typeclass<F> {
  fail<
    E,
    K = HKT.Low<"K">,
    Q = HKT.Low<"Q">,
    W = HKT.Low<"W">,
    X = HKT.Low<"X">,
    I = HKT.Low<"I">,
    S = HKT.Low<"S">,
    R = HKT.Low<"R">,
    A = never,
  >(
    e: E,
  ): HKT.Kind<F, K, Q, W, X, I, S, R, E, A>;
}

/**
 * @tsplus type fncts.FailOps
 */
export interface FailOps {}

/**
 * @tsplus static fncts.FailOps fail
 */
export function fail<
  F extends HKT,
  E,
  K = HKT.Low<"K">,
  Q = HKT.Low<"Q">,
  W = HKT.Low<"W">,
  X = HKT.Low<"X">,
  I = HKT.Low<"I">,
  S = HKT.Low<"S">,
  R = HKT.Low<"R">,
  A = never,
>(e: E, /** @tsplus auto */ F: Fail<F>): HKT.Kind<F, K, Q, W, X, I, S, R, E, A> {
  return F.fail(e);
}
