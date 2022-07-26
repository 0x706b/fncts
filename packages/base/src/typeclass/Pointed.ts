export interface Pointed<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  pure: <
    A,
    K = HKT.Low<F, "K">,
    Q = HKT.Low<F, "Q">,
    W = HKT.Low<F, "W">,
    X = HKT.Low<F, "X">,
    I = HKT.Low<F, "I">,
    S = HKT.Low<F, "S">,
    R = HKT.Low<F, "R">,
    E = HKT.Low<F, "E">,
  >(
    a: A,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>;
}

/**
 * @tsplus type fncts.PointedOps
 */
export interface PointedOps {}

export const Pointed: PointedOps = {};
