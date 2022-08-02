import type { AssertionValue } from "../../data/AssertionValue.js";
import type { Render } from "../../data/Render.js";
import type { FreeBooleanAlgebraIO } from "../FreeBooleanAlgebraIO.js";

import { hasTypeId } from "@fncts/base/util/predicates";

export type AssertResultIO<A> = FreeBooleanAlgebraIO<never, never, AssertionValue<A>>;

export const AssertionIOTypeId = Symbol.for("fncts.test.AssertionIO");
export type AssertionIOTypeId = typeof AssertionIOTypeId;

/**
 * @tsplus type fncts.test.AssertionIO
 * @tsplus companion fncts.test.AssertionIOOps
 */
export class AssertionIO<A> {
  readonly _typeId: AssertionIOTypeId = AssertionIOTypeId;
  constructor(readonly render: Render, readonly runIO: (actual: A) => AssertResultIO<A>) {}
  get rendered() {
    return this.render.rendered;
  }
}

export function isAssertionIO(u: unknown): u is AssertionIO<unknown> {
  return hasTypeId(u, AssertionIOTypeId);
}
