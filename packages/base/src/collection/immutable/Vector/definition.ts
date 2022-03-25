/* eslint-disable prefer-const */
/* eslint-disable no-var */
import type { Predicate } from "../../../data/Predicate.js";
import type { Node } from "./internal.js";

import { Equatable, Hashable } from "../../../prelude.js";
import { hasTypeId } from "../../../util/predicates.js";
import { foldLeftCb } from "./internal.js";
import { ForwardVectorIterator } from "./internal.js";

export const VectorTypeId = Symbol.for("fncts.collection.immutable.Vector");
export type VectorTypeId = typeof VectorTypeId;

/**
 * Represents a Vector of elements.
 *
 * @tsplus type fncts.collection.immutable.Vector
 * @tsplus companion fncts.collection.immutable.VectorOps
 */
export class Vector<A> implements Iterable<A> {
  readonly _typeId: VectorTypeId = VectorTypeId;
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

  get [Symbol.hashable](): number {
    return Hashable.hashIterator(this[Symbol.iterator]());
  }

  [Symbol.equatable](that: unknown): boolean {
    return isVector(that) && corresponds_(this, that, Equatable.strictEquals);
  }
}

/**
 * @tsplus type fncts.collection.immutable.MutableVector
 */
export interface MutableVector<A> {
  readonly _typeId: VectorTypeId;
  bits: number;
  offset: number;
  length: number;
  prefix: A[];
  root: Node | undefined;
  suffix: A[];
  [Symbol.iterator]: () => Iterator<A>;
  [Symbol.hashable]: number;
  [Symbol.equatable](that: unknown): boolean;
  /**
   * This property doesn't exist at run-time. It exists to prevent a
   * MutableVector from being assignable to a Vector.
   */
  "@@mutable": true;
}

export function isVector(u: unknown): u is Vector<unknown> {
  return hasTypeId(u, VectorTypeId);
}

/**
 * Returns true if the two Vectors are equivalent when comparing each
 * pair of elements with the given comparison function.
 *
 * @complexity O(n)
 * @tsplus fluent fncts.collection.immutable.Vector corresponds
 */
export function corresponds_<A, B>(
  as: Vector<A>,
  bs: Vector<B>,
  f: (a: A, b: B) => boolean,
): boolean {
  if (as.length !== bs.length) {
    return false;
  } else {
    const s = { iterator: bs[Symbol.iterator](), equals: true, f };
    return foldLeftCb<A, EqualsState<A, B>>(equalsCb, s, as).equals;
  }
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