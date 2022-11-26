export const enum EitherTag {
  Left = "Left",
  Right = "Right",
}

export const EitherVariance = Symbol.for("fncts.Either.Variance");
export type EitherVariance = typeof EitherVariance;

export const EitherTypeId = Symbol.for("fncts.data.Either");
export type EitherTypeId = typeof EitherTypeId;

export interface EitherF extends HKT {
  type: Either<this["E"], this["A"]>;
  variance: {
    E: "+";
    A: "+";
  };
}

/**
 * @tsplus type fncts.Either
 * @tsplus companion fncts.EitherOps
 */
export class Either<E, A> {
  readonly [EitherTypeId]: EitherTypeId = EitherTypeId;
  declare [EitherVariance]: {
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };
}

/**
 * @tsplus type fncts.Either.Left
 * @tsplus companion fncts.Either.LeftOps
 */
export class Left<E> extends Either<E, never> {
  readonly _tag = EitherTag.Left;
  constructor(readonly left: E) {
    super();
  }
}

/**
 * @tsplus type fncts.Either.Right
 * @tsplus companion fncts.Either.RightOps
 */
export class Right<A> extends Either<never, A> {
  readonly _tag = EitherTag.Right;
  constructor(readonly right: A) {
    super();
  }
}

/**
 * @tsplus unify fncts.Either
 */
export function unifyEither<X extends Either<any, any>>(
  self: X,
): Either<[X] extends [Either<infer E, any>] ? E : never, [X] extends [Either<any, infer A>] ? A : never> {
  return self;
}

/**
 * @tsplus fluent fncts.Either concrete
 * @tsplus static fncts.EitherOps concrete
 * @tsplus macro remove
 */
export function concrete<E, A>(self: Either<E, A>): asserts self is Left<E> | Right<A> {
  //
}
