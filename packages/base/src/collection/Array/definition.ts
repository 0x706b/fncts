import type { HKT } from "../../prelude.js";

declare global {
  /**
   * @tsplus type fncts.collection.immutable.Array
   */
  export interface ReadonlyArray<T> {}

  /**
   * @tsplus type fncts.collection.mutable.Array
   */
  export interface Array<T> {}

  /**
   * @tsplus type fncts.collection.mutable.ArrayOps
   */
  export interface ArrayConstructor {}
}

/**
 * @tsplus type fncts.collection.immutable.ArrayOps
 */
export interface ReadonlyArrayOps {}

export const ReadonlyArray: ReadonlyArrayOps = {};

/**
 * @tsplus type fncts.collection.immutable.Array
 */
export interface ReadonlyNonEmptyArray<A> extends ReadonlyArray<A> {
  readonly 0: A;
}

export interface ArrayF extends HKT {
  readonly type: ReadonlyArray<this["A"]>;
  readonly variance: {
    readonly A: "+";
  };
  readonly index: number;
}
