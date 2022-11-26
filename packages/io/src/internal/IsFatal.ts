export const enum IsFatalTag {
  Single,
  Empty,
  Both,
}

export const IsFatalTypeId = Symbol.for("fncts.io.IsFatal");
export type IsFatalTypeId = typeof IsFatalTypeId;

/**
 * @tsplus type fncts.io.IsFatal
 * @tsplus companion fncts.io.IsFatalOps
 */
export abstract class IsFatal {
  readonly [IsFatalTypeId]: IsFatalTypeId = IsFatalTypeId;

  apply(t: unknown): boolean {
    concrete(this);
    switch (this._tag) {
      case IsFatalTag.Single:
        return this.predicate(t);
      case IsFatalTag.Empty:
        return false;
      case IsFatalTag.Both:
        return this.left.apply(t) || this.right.apply(t);
    }
  }
}

export class Single extends IsFatal {
  readonly _tag = IsFatalTag.Single;
  constructor(readonly predicate: Predicate<unknown>) {
    super();
  }
}

export class Empty extends IsFatal {
  readonly _tag = IsFatalTag.Empty;
}

export class Both extends IsFatal {
  readonly _tag = IsFatalTag.Both;
  constructor(readonly left: IsFatal, readonly right: IsFatal) {
    super();
  }
}

function concrete(u: IsFatal): asserts u is Single | Empty | Both {
  //
}

/**
 * @tsplus static fncts.io.IsFatalOps empty
 */
export const empty: IsFatal = new Empty();

/**
 * @tsplus static fncts.io.IsFatalOps __call
 */
export function makeIsFatal(predicate: Predicate<unknown>): IsFatal {
  return new Single(predicate);
}

/**
 * @tsplus static fncts.io.IsFatalOps both
 * @tsplus pipeable fncts.io.IsFatal both
 * @tsplus pipeable-operator fncts.io.IsFatal |
 */
export function both(right: IsFatal) {
  return (left: IsFatal): IsFatal => {
    concrete(left);
    concrete(right);
    if (left._tag === IsFatalTag.Empty) {
      return right;
    }
    if (right._tag === IsFatalTag.Empty) {
      return left;
    }
    return new Both(left, right);
  };
}
