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
