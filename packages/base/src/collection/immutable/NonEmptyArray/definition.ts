import type { HKT } from "../../../prelude.js";

/**
 * @tsplus type fncts.collection.immutable.NonEmptyArray
 */
export interface ReadonlyNonEmptyArray<A> extends ReadonlyArray<A> {
  readonly 0: A;
}

/**
 * @tsplus type fncts.collection.immutable.NonEmptyArray
 */
export interface NonEmptyArray<A> extends Array<A> {
  0: A;
}

/**
 * @tsplus type fncts.collection.immutable.NonEmptyArrayOps
 */
export interface NonEmptyArrayOps {}

export const NonEmptyArray: NonEmptyArrayOps = {};

export interface NonEmptyArrayF extends HKT {
  readonly type: ReadonlyNonEmptyArray<this["A"]>;
  readonly variance: {
    readonly A: "+";
  };
  readonly index: number;
}
