import type { AssertionIO } from "../../control/AssertionIO/definition";
import type { FreeBooleanAlgebra } from "../FreeBooleanAlgebra";
import type { LazyValue } from "@fncts/base/control/LazyValue";

export const AssertionValueTypeId = Symbol.for("fncts.test.data.AssertionValue");
export type AssertionValueTypeId = typeof AssertionValueTypeId;

/**
 * @tsplus type fncts.test.data.AssertionValue
 * @tsplus companion fncts.test.data.AssertionValueOps
 */
export class AssertionValue<A> {
  readonly _typeId: AssertionValueTypeId = AssertionValueTypeId;
  constructor(
    readonly value: A,
    readonly assertion: LazyValue<AssertionIO<A>>,
    readonly result: LazyValue<FreeBooleanAlgebra<AssertionValue<A>>>,
  ) {}
}
