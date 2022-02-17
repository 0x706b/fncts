import type { HKT } from "../../../prelude";

declare global {
  /**
   * @tsplus type fncts.collection.immutable.Array
   */
  export interface Array<T> {}

  /**
   * @tsplus type fncts.collection.immutable.Array
   */
  export interface ReadonlyArray<T> {}
}

/**
 * @tsplus type fncts.collection.immutable.Array
 */
export interface Array<A> extends globalThis.ReadonlyArray<A> {}

/**
 * @tsplus type fncts.collection.immutable.Array
 */
export interface MutableArray<A> extends globalThis.Array<A> {}

/**
 * @tsplus type fncts.collection.immutable.ArrayOps
 */
export interface ArrayOps {}

export const Array: ArrayOps = {};

export interface ArrayF extends HKT {
  readonly type: Array<this["A"]>;
  readonly variance: {
    readonly A: "+";
  };
  readonly index: number;
}
