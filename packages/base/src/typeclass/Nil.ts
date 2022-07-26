/**
 * @tsplus type fncts.Nil
 */
export interface Nil<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  nil<
    K = HKT.Low<F, "K">,
    Q = HKT.Low<F, "Q">,
    W = HKT.Low<F, "W">,
    X = HKT.Low<F, "X">,
    I = HKT.Low<F, "I">,
    S = HKT.Low<F, "S">,
    R = HKT.Low<F, "R">,
    E = HKT.Low<F, "E">,
  >(): HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, never>;
}
