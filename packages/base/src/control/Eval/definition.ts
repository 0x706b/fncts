import type { HKT } from "../../prelude";

export const EvalTypeId = Symbol.for("@fncts.base/control/Eval");
export type EvalTypeId = typeof EvalTypeId;

/**
 * @tsplus type fncts.Eval
 */
export interface Eval<A> {
  readonly _typeId: EvalTypeId;
  readonly _A: () => A;
}

/**
 * @tsplus type fncts.EvalOps
 */
export interface EvalOps {}

export const Eval: EvalOps = {};

export const enum EvalTag {
  Value,
  Defer,
  Chain,
}

export class Value<A> implements Eval<A> {
  readonly _tag                = EvalTag.Value;
  readonly _typeId: EvalTypeId = EvalTypeId;
  readonly _A!: () => A;
  constructor(readonly value: A) {}
}

export class Defer<A> implements Eval<A> {
  readonly _typeId: EvalTypeId = EvalTypeId;
  readonly _tag                = EvalTag.Defer;
  readonly _A!: () => A;
  constructor(readonly make: () => Eval<A>) {}
}

export class Chain<A, B> implements Eval<B> {
  readonly _typeId: EvalTypeId = EvalTypeId;
  readonly _tag                = EvalTag.Chain;
  readonly _A!: () => B;
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
 * @tsplus unify fncts.Eval
 */
export function unifyEval<X extends Eval<any>>(
  self: X
): Eval<[X] extends [Eval<infer A>] ? A : never> {
  return self;
}

export interface EvalF extends HKT {
  readonly type: Eval<this["A"]>;
  readonly variance: {
    readonly A: "-";
  };
}
