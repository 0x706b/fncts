/**
 * @tsplus type fncts.prelude.Nil
 */
export interface Nil<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  readonly nil: nil<F, FC>;
}

export type NilMin<F extends HKT, FC = HKT.None> = {
  readonly nil: nil<F, FC>;
};

export interface nil<F extends HKT, FC = HKT.None> {
  <
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
