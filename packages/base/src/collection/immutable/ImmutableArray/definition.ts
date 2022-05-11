export const ImmutableArrayTypeId = Symbol.for("fncts.ImmutableArray");
export type ImmutableArrayTypeId = typeof ImmutableArrayTypeId;

export interface ImmutableArrayF extends ImmutableArray<any> {}

/**
 * @tsplus type fncts.ImmutableArray
 * @tsplus companion fncts.ImmutableArrayOps
 */
export class ImmutableArray<A> implements Equatable, Hashable, Iterable<A> {
  readonly _typeId: ImmutableArrayTypeId = ImmutableArrayTypeId;
  [HKT.F]?: ImmutableArrayF;
  [HKT.A]?: () => A;
  [HKT.T]?: ImmutableArray<HKT._A<this>>;
  [HKT.Ix]?: number;
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

export function isImmutableArray(u: unknown): u is ImmutableArray<unknown> {
  return hasTypeId(u, ImmutableArrayTypeId);
}
