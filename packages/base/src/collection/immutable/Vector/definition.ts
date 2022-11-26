/* eslint-disable prefer-const */
/* eslint-disable no-var */
import type { Node } from "@fncts/base/collection/immutable/Vector/internal";

import { foldLeftCb } from "@fncts/base/collection/immutable/Vector/internal";
import { ForwardVectorIterator } from "@fncts/base/collection/immutable/Vector/internal";

export const VectorVariance = Symbol.for("fncts.Vector.Variance");
export type VectorVariance = typeof VectorVariance;

export const VectorTypeId = Symbol.for("fncts.Vector");
export type VectorTypeId = typeof VectorTypeId;

export interface VectorF extends HKT {
  type: Vector<this["A"]>;
  variance: {
    A: "+";
  };
  index: number;
}

/**
 * Represents a Vector of elements.
 *
 * @tsplus type fncts.Vector
 * @tsplus companion fncts.VectorOps
 */
export class Vector<A> implements Iterable<A> {
  readonly [VectorTypeId]: VectorTypeId = VectorTypeId;
  declare [VectorVariance]: {
    readonly _A: (_: never) => A;
  };
  constructor(
    /** @private */
    readonly bits: number,
    /** @private */
    readonly offset: number,
    readonly length: number,
    /** @private */
    readonly prefix: A[],
    /** @private */
    readonly root: Node | undefined,
    /** @private */
    readonly suffix: A[],
  ) {}
  [Symbol.iterator](): Iterator<A> {
    return new ForwardVectorIterator(this);
  }
  get [Symbol.hash](): number {
    return Hashable.iterator(this[Symbol.iterator]());
  }
  [Symbol.equals](that: unknown): boolean {
    return isVector(that) && (this as Vector<A>).corresponds(that, Equatable.strictEquals);
  }
}

/**
 * @tsplus type fncts.MutableVector
 */
export interface MutableVector<A> {
  readonly [VectorTypeId]: VectorTypeId;
  readonly [VectorVariance]: {
    readonly _A: (_: never) => A;
  };
  bits: number;
  offset: number;
  length: number;
  prefix: A[];
  root: Node | undefined;
  suffix: A[];
  [Symbol.iterator]: () => Iterator<A>;
  [Symbol.hash]: number;
  [Symbol.equals](that: unknown): boolean;
  /**
   * This property doesn't exist at run-time. It exists to prevent a
   * MutableVector from being assignable to a Vector.
   */
  "@@mutable": true;
}

export function isVector(u: unknown): u is Vector<unknown> {
  return isObject(u) && VectorTypeId in u;
}

/**
 * Returns true if the two Vectors are equivalent when comparing each
 * pair of elements with the given comparison function.
 *
 * @complexity O(n)
 * @tsplus pipeable fncts.Vector corresponds
 */
export function corresponds<A, B>(bs: Vector<B>, f: (a: A, b: B) => boolean) {
  return (as: Vector<A>): boolean => {
    if (as.length !== bs.length) {
      return false;
    } else {
      const s = { iterator: bs[Symbol.iterator](), equals: true, f };
      return foldLeftCb<A, EqualsState<A, B>>(equalsCb, s, as).equals;
    }
  };
}

type EqualsState<A, B> = {
  iterator: Iterator<B>;
  f: (a: A, b: B) => boolean;
  equals: boolean;
};

function equalsCb<A, B>(a: A, state: EqualsState<A, B>): boolean {
  const { value } = state.iterator.next();
  return (state.equals = state.f(a, value));
}
