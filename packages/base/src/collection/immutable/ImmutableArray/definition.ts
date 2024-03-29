export const ImmutableArrayVariance = Symbol.for("fncts.ImmutableArray.Variance");
export type ImmutableArrayVariance = typeof ImmutableArrayVariance;

export const ImmutableArrayTypeId = Symbol.for("fncts.ImmutableArray");
export type ImmutableArrayTypeId = typeof ImmutableArrayTypeId;

export interface ImmutableArrayF extends HKT {
  type: ImmutableArray<this["A"]>;
  variance: {
    A: "+";
  };
  index: number;
}

/**
 * @tsplus type fncts.ImmutableArray
 * @tsplus companion fncts.ImmutableArrayOps
 */
export class ImmutableArray<A> implements Equatable, Hashable, Iterable<A> {
  readonly [ImmutableArrayTypeId]: ImmutableArrayTypeId = ImmutableArrayTypeId;
  declare [ImmutableArrayVariance]: {
    readonly _A: (_: never) => A;
  };
  constructor(readonly _array: ReadonlyArray<A>) {}

  [Symbol.equals](that: unknown): boolean {
    return (
      isImmutableArray(that) &&
      this._array.length === that._array.length &&
      this._array.every((a, i) => Equatable.strictEquals(a, that._array[i]))
    );
  }

  get [Symbol.hash]() {
    return Hashable.array(this._array);
  }

  [Symbol.iterator]() {
    return this._array[Symbol.iterator]();
  }
}

/**
 * @tsplus static fncts.ImmutableArrayOps is
 */
export function isImmutableArray(u: unknown): u is ImmutableArray<unknown> {
  return isObject(u) && ImmutableArrayTypeId in u;
}
