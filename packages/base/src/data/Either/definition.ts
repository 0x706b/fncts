export const enum EitherTag {
  Left = "Left",
  Right = "Right",
}

export const EitherTypeId = Symbol.for("fncts.base.data.Either");
export type EitherTypeId = typeof EitherTypeId;

/**
 * @tsplus type fncts.data.Either.Left
 * @tsplus companion fncts.data.Either.LeftOps
 */
export class Left<E> {
  readonly _typeId: EitherTypeId = EitherTypeId;
  readonly _tag                  = EitherTag.Left;
  constructor(readonly left: E) {}
}

/**
 * @tsplus type fncts.data.Either.Right
 * @tsplus companion fncts.data.Either.RightOps
 */
export class Right<A> {
  readonly _typeId: EitherTypeId = EitherTypeId;
  readonly _tag                  = EitherTag.Right;
  constructor(readonly right: A) {}
}

/**
 * @tsplus type fncts.data.Either
 */
export type Either<E, A> = Left<E> | Right<A>;

/**
 * @tsplus type fncts.data.EitherOps
 */
export interface EitherOps {}

export const Either: EitherOps = {};

/**
 * @tsplus unify fncts.data.Either
 */
export function unifyEither<X extends Either<any, any>>(
  self: X,
): Either<[X] extends [Either<infer E, any>] ? E : never, [X] extends [Either<any, infer A>] ? A : never> {
  return self;
}
