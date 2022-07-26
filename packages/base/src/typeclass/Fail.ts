/**
 * @tsplus type fncts.Fail
 */
export interface Fail<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  fail: <
    E,
    K = HKT.Low<F, "K">,
    Q = HKT.Low<F, "Q">,
    W = HKT.Low<F, "W">,
    X = HKT.Low<F, "X">,
    I = HKT.Low<F, "I">,
    S = HKT.Low<F, "S">,
    R = HKT.Low<F, "R">,
    A = never,
  >(
    e: E,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>;
}

/**
 * @tsplus type fncts.FailOps
 */
export interface FailOps {}
