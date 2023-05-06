export interface PureF extends HKT {
  type: Pure<this["W"], this["S"], this["S"], this["R"], this["E"], this["A"]>;
  variance: {
    W: "+";
    S: "_";
    R: "-";
    E: "+";
    A: "+";
  };
}

export const PureVariance = Symbol.for("fncts.Pure.Variance");
export type PureVariance = typeof PureVariance;

export const PureTypeId = Symbol.for("fncts.Pure");
export type PureTypeId = typeof PureTypeId;

/**
 * `Pure<W, S1, S2, R, E, A>` is a purely functional description of a synchronous computation
 * that requires an environment `R` and an initial state `S1` and may either
 * fail with an `E` or succeed with an updated state `S2` and an `A`. Because
 * of its polymorphism `Z` can be used to model a variety of effects
 * including context, state, failure, and logging.
 *
 * @tsplus type fncts.control.Pure
 * @tsplus companion fncts.control.PureOps
 */
export abstract class Pure<W, S1, S2, R, E, A> {
  readonly [PureTypeId]: PureTypeId = PureTypeId;
  declare [PureVariance]: {
    readonly _W: (_: never) => W;
    readonly _S1: (_: S1) => void;
    readonly _S2: (_: never) => S2;
    readonly _R: (_: never) => R;
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };
}

/**
 * @tsplus unify fncts.control.Pure
 */
export function unifyPure<X extends Pure<any, any, any, any, any, any>>(
  _: X,
): Pure<
  [X] extends [Pure<infer W, any, any, any, any, any>] ? W : never,
  [X] extends [Pure<any, infer S1, any, any, any, any>] ? S1 : never,
  [X] extends [Pure<any, any, infer S2, any, any, any>] ? S2 : never,
  [X] extends [Pure<any, any, any, infer R, any, any>] ? R : never,
  [X] extends [Pure<any, any, any, any, infer E, any>] ? E : never,
  [X] extends [Pure<any, any, any, any, any, infer A>] ? A : never
> {
  return _;
}

export class PurePrimitive {
  readonly [PureTypeId]: PureTypeId = PureTypeId;
  declare [PureVariance]: {
    readonly _W: (_: never) => never;
    readonly _S1: (_: unknown) => void;
    readonly _S2: (_: never) => never;
    readonly _R: (_: never) => never;
    readonly _E: (_: never) => never;
    readonly _A: (_: never) => never;
  };
  constructor(readonly _tag: unknown) {}
  readonly i0: unknown = undefined;
  readonly i1: unknown = undefined;
  readonly i2: unknown = undefined;
}

/**
 * @tsplus static fncts.control.PureOps isPure
 */
export function isPure(u: unknown): u is Pure<unknown, unknown, unknown, unknown, unknown, unknown> {
  return isObject(u) && PureTypeId in u;
}

export const enum PureTag {
  SucceedNow,
  Succeed,
  Defer,
  Fail,
  Modify,
  Chain,
  Match,
  Access,
  Provide,
  Tell,
  Listen,
  MapLog,
}

export type PureOp<Tag extends number, Body = {}> = PurePrimitive &
  Body & {
    _tag: Tag;
  };

export interface SucceedNow
  extends PureOp<
    PureTag.SucceedNow,
    {
      readonly i0: any;
    }
  > {}

export interface Succeed
  extends PureOp<
    PureTag.Succeed,
    {
      readonly i0: () => any;
    }
  > {}

export interface Defer
  extends PureOp<
    PureTag.Defer,
    {
      readonly i0: () => Primitive;
    }
  > {}

export interface Fail
  extends PureOp<
    PureTag.Fail,
    {
      readonly i0: Cause<unknown>;
    }
  > {}

export interface Modify
  extends PureOp<
    PureTag.Modify,
    {
      readonly i0: (s1: any) => readonly [any, any];
    }
  > {}

export interface FlatMap
  extends PureOp<
    PureTag.Chain,
    {
      readonly i0: Primitive;
      readonly i1: (a: any) => Primitive;
    }
  > {}

export interface Match
  extends PureOp<
    PureTag.Match,
    {
      readonly i0: Primitive;
      readonly i1: (ws: Conc<any>, e: Cause<unknown>) => Primitive;
      readonly i2: (ws: Conc<any>, a: any) => Primitive;
    }
  > {}

export interface Access
  extends PureOp<
    PureTag.Access,
    {
      readonly i0: (r: Environment<any>) => Primitive;
    }
  > {}

export interface Provide
  extends PureOp<
    PureTag.Provide,
    {
      readonly i0: Primitive;
      readonly i1: Environment<any>;
    }
  > {}

export interface Tell
  extends PureOp<
    PureTag.Tell,
    {
      readonly i0: Conc<any>;
    }
  > {}

export interface MapLog
  extends PureOp<
    PureTag.MapLog,
    {
      readonly i0: Primitive;
      readonly i1: (ws: Conc<any>) => Conc<any>;
    }
  > {}

export type Primitive =
  | SucceedNow
  | Fail
  | Modify
  | FlatMap
  | Match
  | Access
  | Provide
  | Defer
  | Succeed
  | Tell
  | MapLog;

/**
 * @tsplus static fncts.control.PureOps concrete
 */
export function concrete(_: Pure<any, any, any, any, any, any>): asserts _ is Primitive {
  //
}

export const PureErrorTypeId = Symbol.for("fncts.Pure.ZError");
export type PureErrorTypeId = typeof PureErrorTypeId;

export class PureError<E> {
  readonly [PureErrorTypeId]: PureErrorTypeId = PureErrorTypeId;
  constructor(readonly cause: Cause<E>) {}
}

export function isPureError(u: unknown): u is PureError<unknown> {
  return isObject(u) && PureErrorTypeId in u;
}
