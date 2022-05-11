/**
 * @tsplus type fncts.Newtype
 */
export interface Newtype<URI, A> {
  readonly _URI: URI;
  readonly [HKT.A]: A;
}

export declare namespace Newtype {
  export type Iso<N extends NewtypeHKT> = NewtypeIso<N>;
}

/**
 * @tsplus type fncts.NewtypeOps
 */
export interface NewtypeOps {}

export const Newtype: NewtypeOps = {};

export interface NewtypeHKT extends HKT {
  readonly [HKT.T]: Newtype<any, any>;
}

export interface NewtypeIso<N extends NewtypeHKT> {
  /**
   * @tsplus macro identity
   */
  get: <K, Q, W, X, I, S, R, E, A>(
    _: HKT.Kind<N, K, Q, W, X, I, S, R, E, A>[HKT.A],
  ) => HKT.Kind<N, K, Q, W, X, I, S, R, E, A>;
  /**
   * @tsplus macro identity
   */
  reverseGet: <K, Q, W, X, I, S, R, E, A>(
    _: HKT.Kind<N, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<N, K, Q, W, X, I, S, R, E, A>[HKT.A];
}

/**
 * @tsplus static fncts.NewtypeOps __call
 */
export const newtype = <N extends NewtypeHKT>(): NewtypeIso<N> => ({
  get: unsafeCoerce,
  reverseGet: unsafeCoerce,
});
