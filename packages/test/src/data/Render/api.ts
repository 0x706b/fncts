import type { RenderParam } from "../RenderParam.js";
import type { Render } from "./definition.js";

import { RenderFunction, RenderInfix } from "./definition.js";

/**
 * @tsplus static fncts.test.data.RenderOps fn
 */
export function fn(name: string, paramLists: Conc<Conc<RenderParam>>): Render {
  return new RenderFunction(name, paramLists);
}

/**
 * @tsplus static fncts.test.data.RenderOps infix
 */
export function infix(left: RenderParam, op: string, right: RenderParam): Render {
  return new RenderInfix(left, op, right);
}
