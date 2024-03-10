export const enum TheseTag {
  Left = "Left",
  Right = "Right",
  Both = "Both",
}

export const TheseTypeId = Symbol.for("fncts.data.These");
export type TheseTypeId = typeof TheseTypeId;

/**
 * @tsplus type fncts.These.Left
 */
export class Left<E> {
  readonly [TheseTypeId]: TheseTypeId = TheseTypeId;
  readonly _tag = TheseTag.Left;
  constructor(readonly left: E) {}
}

/**
 * @tsplus type fncts.These.Right
 */
export class Right<A> {
  readonly [TheseTypeId]: TheseTypeId = TheseTypeId;
  readonly _tag = TheseTag.Right;
  constructor(readonly right: A) {}
}

/**
 * @tsplus type fncts.These.Both
 */
export class Both<E, A> {
  readonly [TheseTypeId]: TheseTypeId = TheseTypeId;
  readonly _tag = TheseTag.Both;
  constructor(
    readonly left: E,
    readonly right: A,
  ) {}
}

/**
 * @tsplus type fncts.These
 */
export type These<E, A> = Left<E> | Right<A> | Both<E, A>;

/**
 * @tsplus type fncts.TheseOps
 */
export interface TheseOps {}

export const These: TheseOps = {};

/**
 * @tsplus static fncts.TheseOps isThese
 */
export function isThese(u: unknown): u is These<unknown, unknown> {
  return isObject(u) && TheseTypeId in u;
}
