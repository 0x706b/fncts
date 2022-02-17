export const enum TheseTag {
  Left = "Left",
  Right = "Right",
  Both = "Both",
}

export const TheseTypeId = Symbol.for("fncts.base.data.These");
export type TheseTypeId = typeof TheseTypeId;

/**
 * @tsplus type fncts.data.These.Left
 */
export class Left<E> {
  readonly _typeId: TheseTypeId = TheseTypeId;
  readonly _tag                 = TheseTag.Left;
  constructor(readonly left: E) {}
}

/**
 * @tsplus type fncts.data.These.Right
 */
export class Right<A> {
  readonly _typeId: TheseTypeId = TheseTypeId;
  readonly _tag                 = TheseTag.Right;
  constructor(readonly right: A) {}
}

/**
 * @tsplus type fncts.data.These.Both
 */
export class Both<E, A> {
  readonly _typeId: TheseTypeId = TheseTypeId;
  readonly _tag                 = TheseTag.Both;
  constructor(readonly left: E, readonly right: A) {}
}

/**
 * @tsplus type fncts.data.These
 */
export type These<E, A> = Left<E> | Right<A> | Both<E, A>;

/**
 * @tsplus type fncts.data.TheseOps
 */
export interface TheseOps {}

export const These: TheseOps = {};
