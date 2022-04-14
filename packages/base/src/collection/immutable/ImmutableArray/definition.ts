
export const ImmutableArrayTypeId = Symbol.for("fncts.ImmutableArray");
export type ImmutableArrayTypeId = typeof ImmutableArrayTypeId;

/**
 * @tsplus type fncts.ImmutableArray
 * @tsplus companion fncts.ImmutableArrayOps
 */
export class ImmutableArray<A> implements Equatable, Hashable, Iterable<A> {
  readonly _typeId: ImmutableArrayTypeId = ImmutableArrayTypeId;
  constructor(readonly _array: ReadonlyArray<A>) {}

  [Symbol.equatable](that: unknown): boolean {
    return (
      isImmutableArray(that) &&
      this._array.length === that._array.length &&
      this._array.every((a, i) => Equatable.strictEquals(a, that._array[i]))
    );
  }

  get [Symbol.hashable]() {
    return Hashable.hashArray(this._array);
  }

  [Symbol.iterator]() {
    return this._array[Symbol.iterator]();
  }
}

export function isImmutableArray(u: unknown): u is ImmutableArray<unknown> {
  return hasTypeId(u, ImmutableArrayTypeId);
}

export interface ImmutableArrayF extends HKT {
  readonly type: ImmutableArray<this["A"]>;
  readonly variance: {
    readonly A: "+";
  };
  readonly index: number;
}
