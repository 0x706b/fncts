/**
 * @tsplus type fncts.Fail
 */
export interface Fail<F extends HKT, TC = HKT.None> extends HKT.Typeclass<F, TC> {
  readonly fail: fail<F, TC>;
}

/**
 * @tsplus type fncts.FailOps
 */
export interface FailOps {}

export type FailMin<F extends HKT, C = HKT.None> = {
  readonly fail: fail<F, C>;
};

/**
 * @tsplus static fncts.FailOps __call
 */
export function mkFail<F extends HKT, C = HKT.None>(F: FailMin<F, C>): Fail<F, C> {
  return HKT.instance({
    fail: F.fail,
  });
}

export interface fail<F extends HKT, C = HKT.None> {
  <
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
    e: HKT.OrFix<C, "E", E>,
  ): HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>;
}
