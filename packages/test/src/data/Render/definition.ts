import type { RenderParam } from "../RenderParam";
import type { Conc } from "@fncts/base/collection/immutable/Conc";

export const enum RenderTag {
  Function = "Function",
  Infix = "Infix",
}

export class RenderFunction {
  readonly _tag = RenderTag.Function;
  constructor(readonly name: string, readonly paramLists: Conc<Conc<RenderParam>>) {}
}

export class RenderInfix {
  readonly _tag = RenderTag.Infix;
  constructor(readonly left: RenderParam, readonly op: string, readonly right: RenderParam) {}
}

/**
 * @tsplus type fncts.test.data.Render
 */
export type Render = RenderFunction | RenderInfix;

/**
 * @tsplus type fncts.test.data.RenderOps
 */
export interface RenderOps {}

export const Render: RenderOps = {};
