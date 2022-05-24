import { ImmutableArray } from "@fncts/base/collection/immutable/ImmutableArray/definition";

export interface ImmutableNonEmptyArrayF extends ImmutableNonEmptyArray<any> {}

/**
 * @tsplus type fncts.ImmutableNonEmptyArray
 * @tsplus companion fncts.ImmutableNonEmptyArrayOps
 */
export class ImmutableNonEmptyArray<A> extends ImmutableArray<A> {
  [HKT.F]!: ImmutableNonEmptyArrayF;
  [HKT.T]!: ImmutableNonEmptyArray<HKT._A<this>>;
  constructor(readonly _array: ReadonlyNonEmptyArray<A>) {
    super(_array);
  }
}

/**
 * @tsplus type fncts.base.NonEmptyArray
 */
export interface NonEmptyArray<T> extends Array<T> {
  0: T;
}

/**
 * @tsplus type fncts.base.ReadonlyNonEmptyArray
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
