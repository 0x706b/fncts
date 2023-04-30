export const EvalVariance = Symbol.for("fncts.Eval.Variance");
export type EvalVariance = typeof EvalVariance;

export const EvalTypeId = Symbol.for("@fncts/control/Eval");
export type EvalTypeId = typeof EvalTypeId;

export class EvalPrimitive {
  readonly [EvalTypeId]: EvalTypeId = EvalTypeId;
  declare [EvalVariance]: {
    readonly _A: (_: never) => never;
  };
  constructor(readonly _tag: unknown) {}
  readonly i0: unknown = undefined;
  readonly i1: unknown = undefined;
}

export type EvalOp<Tag extends number, Body = {}> = EvalPrimitive &
  Body & {
    _tag: Tag;
  };

export interface EvalF extends HKT {
  type: Eval<this["A"]>;
  variance: {
    A: "+";
  };
}

/**
 * @tsplus type fncts.control.Eval
 */
export interface Eval<A> {
  readonly [EvalTypeId]: EvalTypeId;
  readonly [EvalVariance]: {
    readonly _A: (_: never) => A;
  };
}

/**
 * @tsplus type fncts.control.EvalOps
 */
export interface EvalOps {}

export const Eval: EvalOps = {};

export const enum EvalTag {
  Value,
  Defer,
  Chain,
}

export interface Value
  extends EvalOp<
    EvalTag.Value,
    {
      readonly i0: any;
    }
  > {}

export interface Defer
  extends EvalOp<
    EvalTag.Defer,
    {
      readonly i0: () => Primitive;
    }
  > {}

export interface FlatMap
  extends EvalOp<
    EvalTag.Chain,
    {
      readonly i0: Primitive;
      readonly i1: (a: any) => Primitive;
    }
  > {}

type Primitive = Value | Defer | FlatMap;

/**
 * @tsplus smart:remove
 */
export function concrete(_: Eval<any>): asserts _ is Primitive {
  //
}

/**
 * @tsplus unify fncts.control.Eval
 */
export function unifyEval<X extends Eval<any>>(self: X): Eval<[X] extends [Eval<infer A>] ? A : never> {
  return self;
}
