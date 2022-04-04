import type { AssertionIO } from "../../control/AssertionIO/definition.js";
import type { FreeBooleanAlgebra } from "../FreeBooleanAlgebra.js";

export const AssertionValueTypeId = Symbol.for("fncts.test.data.AssertionValue");
export type AssertionValueTypeId = typeof AssertionValueTypeId;

/**
 * @tsplus type fncts.test.data.AssertionValue
 * @tsplus companion fncts.test.data.AssertionValueOps
 */
export class AssertionValue<A> {
  readonly _typeId: AssertionValueTypeId = AssertionValueTypeId;
  constructor(
    readonly assertion: LazyValue<AssertionIO<A>>,
    readonly value: A,
    readonly result: LazyValue<FreeBooleanAlgebra<AssertionValue<A>>>,
    readonly expression: Maybe<string> = Nothing(),
    readonly sourceLocation: Maybe<string> = Nothing(),
  ) {}
}
