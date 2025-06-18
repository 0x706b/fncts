export interface ReadonlyNonEmptyArrayF extends HKT {
  type: ReadonlyNonEmptyArray<this["A"]>;
  variance: {
    A: "+";
  };
  index: number;
}

/**
 * @tsplus type fncts.NonEmptyArray
 */
export interface NonEmptyArray<T> extends Array<T> {
  0: T;
}

/**
 * @tsplus type fncts.ReadonlyNonEmptyArray
 * @tsplus companion fncts.ReadonlyNonEmptyArrayOps
 */
export interface ReadonlyNonEmptyArray<T> extends ReadonlyArray<T> {
  readonly 0: T;
}
