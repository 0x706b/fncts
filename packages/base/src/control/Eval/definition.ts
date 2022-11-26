export const EvalVariance = Symbol.for("fncts.Eval.Variance");
export type EvalVariance = typeof EvalVariance;

export const EvalTypeId = Symbol.for("@fncts/control/Eval");
export type EvalTypeId = typeof EvalTypeId;

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

export class Value<A> implements Eval<A> {
  readonly _tag                     = EvalTag.Value;
  readonly [EvalTypeId]: EvalTypeId = EvalTypeId;
  declare [EvalVariance]: {
    readonly _A: (_: never) => A;
  };
  constructor(readonly value: A) {}
}

export class Defer<A> implements Eval<A> {
  readonly [EvalTypeId]: EvalTypeId = EvalTypeId;
  declare [EvalVariance]: {
    readonly _A: (_: never) => A;
  };
  readonly _tag = EvalTag.Defer;
  readonly _A!: () => A;
  constructor(readonly make: () => Eval<A>) {}
}

export class Chain<A, B> implements Eval<B> {
  readonly [EvalTypeId]: EvalTypeId = EvalTypeId;
  declare [EvalVariance]: {
    readonly _A: (_: never) => B;
  };
  readonly _tag = EvalTag.Chain;
  constructor(readonly self: Eval<A>, readonly f: (a: A) => Eval<B>) {}
}

type Concrete = Value<any> | Defer<any> | Chain<any, any>;

/**
 * @tsplus smart:remove
 */
export function concrete(_: Eval<any>): asserts _ is Concrete {
  //
}

/**
 * @tsplus unify fncts.control.Eval
 */
export function unifyEval<X extends Eval<any>>(self: X): Eval<[X] extends [Eval<infer A>] ? A : never> {
  return self;
}
