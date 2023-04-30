export interface ZF extends HKT {
  type: Z<this["W"], this["S"], this["S"], this["R"], this["E"], this["A"]>;
  variance: {
    W: "+";
    S: "_";
    R: "-";
    E: "+";
    A: "+";
  };
}

export const ZVariance = Symbol.for("fncts.Z.Variance");
export type ZVariance = typeof ZVariance;

export const ZTypeId = Symbol.for("fncts.Z");
export type ZTypeId = typeof ZTypeId;

/**
 * `Z<W, S1, S2, R, E, A>` is a purely functional description of a synchronous computation
 * that requires an environment `R` and an initial state `S1` and may either
 * fail with an `E` or succeed with an updated state `S2` and an `A`. Because
 * of its polymorphism `Z` can be used to model a variety of effects
 * including context, state, failure, and logging.
 *
 * @note named `Z` in honor of `ZIO` and because it is, surely, the last synchronous effect type
 * one will ever need
 *
 * @tsplus type fncts.control.Z
 * @tsplus companion fncts.control.ZOps
 */
export abstract class Z<W, S1, S2, R, E, A> {
  readonly [ZTypeId]: ZTypeId = ZTypeId;
  declare [ZVariance]: {
    readonly _W: (_: never) => W;
    readonly _S1: (_: S1) => void;
    readonly _S2: (_: never) => S2;
    readonly _R: (_: never) => R;
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };
}

/**
 * @tsplus unify fncts.control.Z
 */
export function unifyZ<X extends Z<any, any, any, any, any, any>>(
  _: X,
): Z<
  [X] extends [Z<infer W, any, any, any, any, any>] ? W : never,
  [X] extends [Z<any, infer S1, any, any, any, any>] ? S1 : never,
  [X] extends [Z<any, any, infer S2, any, any, any>] ? S2 : never,
  [X] extends [Z<any, any, any, infer R, any, any>] ? R : never,
  [X] extends [Z<any, any, any, any, infer E, any>] ? E : never,
  [X] extends [Z<any, any, any, any, any, infer A>] ? A : never
> {
  return _;
}

export class ZPrimitive {
  readonly [ZTypeId]: ZTypeId = ZTypeId;
  declare [ZVariance]: {
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
 * @tsplus static fncts.control.ZOps isZ
 */
export function isZ(u: unknown): u is Z<unknown, unknown, unknown, unknown, unknown, unknown> {
  return isObject(u) && ZTypeId in u;
}

export const enum ZTag {
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

export type ZOp<Tag extends number, Body = {}> = ZPrimitive &
  Body & {
    _tag: Tag;
  };

export interface SucceedNow
  extends ZOp<
    ZTag.SucceedNow,
    {
      readonly i0: any;
    }
  > {}

export interface Succeed
  extends ZOp<
    ZTag.Succeed,
    {
      readonly i0: () => any;
    }
  > {}

export interface Defer
  extends ZOp<
    ZTag.Defer,
    {
      readonly i0: () => Primitive;
    }
  > {}

export interface Fail
  extends ZOp<
    ZTag.Fail,
    {
      readonly i0: Cause<unknown>;
    }
  > {}

export interface Modify
  extends ZOp<
    ZTag.Modify,
    {
      readonly i0: (s1: any) => readonly [any, any];
    }
  > {}

export interface FlatMap
  extends ZOp<
    ZTag.Chain,
    {
      readonly i0: Primitive;
      readonly i1: (a: any) => Primitive;
    }
  > {}

export interface Match
  extends ZOp<
    ZTag.Match,
    {
      readonly i0: Primitive;
      readonly i1: (ws: Conc<any>, e: Cause<unknown>) => Primitive;
      readonly i2: (ws: Conc<any>, a: any) => Primitive;
    }
  > {}

export interface Access
  extends ZOp<
    ZTag.Access,
    {
      readonly i0: (r: Environment<any>) => Primitive;
    }
  > {}

export interface Provide
  extends ZOp<
    ZTag.Provide,
    {
      readonly i0: Primitive;
      readonly i1: Environment<any>;
    }
  > {}

export interface Tell
  extends ZOp<
    ZTag.Tell,
    {
      readonly i0: Conc<any>;
    }
  > {}

export interface MapLog
  extends ZOp<
    ZTag.MapLog,
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
 * @tsplus static fncts.control.ZOps concrete
 */
export function concrete(_: Z<any, any, any, any, any, any>): asserts _ is Primitive {
  //
}

export const ZErrorTypeId = Symbol.for("fncts.Z.ZError");
export type ZErrorTypeId = typeof ZErrorTypeId;

export class ZError<E> {
  readonly [ZErrorTypeId]: ZErrorTypeId = ZErrorTypeId;
  constructor(readonly cause: Cause<E>) {}
}

export function isZError(u: unknown): u is ZError<unknown> {
  return isObject(u) && ZErrorTypeId in u;
}
