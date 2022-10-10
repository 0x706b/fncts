import { ImmutableArray } from "@fncts/base/collection/immutable/ImmutableArray/definition";
export interface ImmutableNonEmptyArrayF extends HKT {
  type: ImmutableNonEmptyArray<this["A"]>;
  variance: {
    A: "+";
  };
  index: number;
}

/**
 * @tsplus type fncts.ImmutableNonEmptyArray
 * @tsplus companion fncts.ImmutableNonEmptyArrayOps
 */
export class ImmutableNonEmptyArray<A> extends ImmutableArray<A> {
  readonly _A!: () => A;
  constructor(readonly _array: ReadonlyNonEmptyArray<A>) {
    super(_array);
  }
}

/**
 * @tsplus type fncts.NonEmptyArray
 */
export interface NonEmptyArray<T> extends Array<T> {
  0: T;
}

/**
 * @tsplus type fncts.ReadonlyNonEmptyArray
 */
export interface ReadonlyNonEmptyArray<T> extends ReadonlyArray<T> {
  readonly 0: T;
}

/**
 * @tsplus getter fncts.ImmutableArray length
 */
export function length<A>(self: ImmutableArray<A>): number {
  return self._array.length;
}

/**
 * @tsplus fluent fncts.ImmutableArray isNonEmpty
 */
export function isNonEmpty<A>(self: ImmutableArray<A>): self is ImmutableNonEmptyArray<A> {
  return self.length > 0;
}
