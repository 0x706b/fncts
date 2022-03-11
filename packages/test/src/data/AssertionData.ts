import type { Assertion } from "../control/Assertion/definition";

import { LazyValue } from "@fncts/base/control/LazyValue";

import { AssertionValue } from "./AssertionValue";
import { FreeBooleanAlgebra } from "./FreeBooleanAlgebra";

export const AssertionDataTypeId = Symbol.for("fncts.test.data.AssertionData");
export type AssertionDataTypeId = typeof AssertionDataTypeId;

/**
 * @tsplus type fncts.test.data.AssertionData
 */
export class AssertionData<A> {
  readonly _typeId: AssertionDataTypeId = AssertionDataTypeId;
  constructor(readonly value: A, readonly assertion: Assertion<A>) {}
}

/**
 * @tsplus getter fncts.test.data.AssertionData asSuccess
 */
export function asSuccess<A>(self: AssertionData<A>): FreeBooleanAlgebra<AssertionValue<A>> {
  return FreeBooleanAlgebra.success(new AssertionValue(self.value, LazyValue(self.assertion), LazyValue(self.asSuccess)));
}

/**
 * @tsplus getter fncts.test.data.AssertionData asFailure
 */
export function asFailure<A>(self: AssertionData<A>): FreeBooleanAlgebra<AssertionValue<A>> {
  return FreeBooleanAlgebra.failure(new AssertionValue(self.value, LazyValue(self.assertion), LazyValue(self.asFailure)));
}
