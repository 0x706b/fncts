import type { AssertionIO } from "../../control/AssertionIO/definition.js";

export const enum RenderParamTag {
  AssertionIO = "AssertionIO",
  Value = "Value",
}

export class RenderAssertionIO<A> {
  readonly _tag = RenderParamTag.AssertionIO;
  constructor(readonly assertion: AssertionIO<A>) {}
}

export class RenderValue<A> {
  readonly _tag = RenderParamTag.Value;
  constructor(readonly value: A) {}
}

/**
 * @tsplus type fncts.test.data.RenderParam
 */
export type RenderParam<A = any> = RenderAssertionIO<A> | RenderValue<A>;

/**
 * @tsplus type fncts.test.data.RenderParamOps
 */
export interface RenderParamOps {}

export const RenderParam: RenderParamOps = {};
