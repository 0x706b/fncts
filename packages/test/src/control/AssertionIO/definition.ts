import type { AssertionValue } from "../../data/AssertionValue";
import type { Render } from "../../data/Render";
import type { FreeBooleanAlgebraIO } from "../FreeBooleanAlgebraIO";

import { hasTypeId } from "@fncts/base/util/predicates";

export type AssertResultIO<A> = FreeBooleanAlgebraIO<unknown, never, AssertionValue<A>>;

export const AssertionIOTypeId = Symbol.for("fncts.test.control.AssertionIO");
export type AssertionIOTypeId = typeof AssertionIOTypeId;

/**
 * @tsplus type fncts.test.control.AssertionIO
 * @tsplus companion fncts.test.control.AssertionIOOps
 */
export class AssertionIO<A> {
  readonly _typeId: AssertionIOTypeId = AssertionIOTypeId;
  constructor(readonly render: Render, readonly runIO: (actual: A) => AssertResultIO<A>) {}
}

export function isAssertionIO(u: unknown): u is AssertionIO<unknown> {
  return hasTypeId(u, AssertionIOTypeId);
}
