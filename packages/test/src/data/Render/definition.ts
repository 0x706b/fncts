import type { RenderParam } from "../RenderParam.js";

export const enum RenderTag {
  Function = "Function",
  Infix = "Infix",
}

export class RenderFunction {
  readonly _tag = RenderTag.Function;
  constructor(
    readonly name: string,
    readonly paramLists: Conc<Conc<RenderParam>>,
  ) {}
  get rendered(): string {
    return `${this.name}(${this.paramLists.map((ps) => ps.map((p) => p.rendered).join(", ")).join("")})`;
  }
}

export class RenderInfix {
  readonly _tag = RenderTag.Infix;
  constructor(
    readonly left: RenderParam,
    readonly op: string,
    readonly right: RenderParam,
  ) {}
  get rendered(): string {
    return `(${this.left.rendered} ${this.op} ${this.right.rendered})`;
  }
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
