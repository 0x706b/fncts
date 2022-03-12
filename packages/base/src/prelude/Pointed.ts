import { HKT } from "./HKT.js";

export interface Pointed<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  readonly pure: pure<F, FC>;
}

export type PointedMin<F extends HKT, FC = HKT.None> = {
  readonly pure: pure<F, FC>;
};

/**
 * @tsplus type fncts.PointedOps
 */
export interface PointedOps {}

export const Pointed: PointedOps = {};

/**
 * @tsplus static fncts.PointedOps __call
 */
export function mkPointed<F extends HKT, FC = HKT.None>(F: PointedMin<F, FC>): Pointed<F, FC> {
  return HKT.instance<Pointed<F, FC>>(F);
}

export interface pure<F extends HKT, C = HKT.None> {
  <
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
  ): HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>;
}
