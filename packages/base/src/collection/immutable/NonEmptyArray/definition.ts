import type { HKT } from "../../../prelude";
import type { Array, MutableArray } from "../Array/definition";

/**
 * @tsplus type fncts.collection.immutable.NonEmptyArray
 */
export interface NonEmptyArray<A> extends Array<A> {
  readonly 0: A;
}

/**
 * @tsplus type fncts.collection.immutable.NonEmptyArray
 */
export interface MutableNonEmptyArray<A> extends MutableArray<A> {
  0: A;
}

/**
 * @tsplus type fncts.collection.immutable.NonEmptyArrayOps
 */
export interface NonEmptyArrayOps {}

export const NonEmptyArray: NonEmptyArrayOps = {};

export interface NonEmptyArrayF extends HKT {
  readonly type: NonEmptyArray<this["A"]>;
  readonly variance: {
    readonly A: "+";
  };
  readonly index: number;
}
