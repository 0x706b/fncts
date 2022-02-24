import type { HKT } from "../prelude";

import { unsafeCoerce } from "./function";

/**
 * @tsplus type fncts.data.Newtype
 */
export interface Newtype<URI, A, C = HKT.None> {
  readonly _URI: URI;
  readonly _A: A;
  readonly _C: C;
}

export declare namespace Newtype {
  export type Iso<N extends NewtypeHKT, C = N["type"]["_C"]> = NewtypeIso<N, C>;
}

/**
 * @tsplus type fncts.data.NewtypeOps
 */
export interface NewtypeOps {}

export const Newtype: NewtypeOps = {};

export interface NewtypeHKT extends HKT {
  readonly type: Newtype<any, any>;
}

export interface NewtypeIso<N extends NewtypeHKT, C = N["type"]["_C"]> {
  /**
   * @tsplus macro identity
   */
  get: <
    K extends HKT.GetExtends<C, "K", any>,
    Q extends HKT.GetExtends<C, "Q", any>,
    W extends HKT.GetExtends<C, "W", any>,
    X extends HKT.GetExtends<C, "X", any>,
    I extends HKT.GetExtends<C, "I", any>,
    S extends HKT.GetExtends<C, "S", any>,
    R extends HKT.GetExtends<C, "E", any>,
    E extends HKT.GetExtends<C, "E", any>,
    A extends HKT.GetExtends<C, "A", any>,
  >(
    _: HKT.Kind<N, N["type"]["_C"], K, Q, W, X, I, S, R, E, A>["_A"],
  ) => HKT.Kind<N, HKT.None, K, Q, W, X, I, S, R, E, A>;
  /**
   * @tsplus macro identity
   */
  reverseGet: <
    K extends HKT.GetExtends<C, "K", any>,
    Q extends HKT.GetExtends<C, "Q", any>,
    W extends HKT.GetExtends<C, "W", any>,
    X extends HKT.GetExtends<C, "X", any>,
    I extends HKT.GetExtends<C, "I", any>,
    S extends HKT.GetExtends<C, "S", any>,
    R extends HKT.GetExtends<C, "E", any>,
    E extends HKT.GetExtends<C, "E", any>,
    A extends HKT.GetExtends<C, "A", any>,
  >(
    _: HKT.Kind<N, HKT.None, K, Q, W, X, I, S, R, E, A>,
  ) => HKT.Kind<N, HKT.None, K, Q, W, X, I, S, R, E, A>["_A"];
}

/**
 * @tsplus static fncts.data.NewtypeOps __call
 */
export const newtype = <N extends NewtypeHKT>(): NewtypeIso<N> => ({
  get: unsafeCoerce,
  reverseGet: unsafeCoerce,
});
