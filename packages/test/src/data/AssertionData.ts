import type { Assertion } from "../control/Assertion/definition.js";

import { AssertionValue } from "./AssertionValue.js";
import { FreeBooleanAlgebra } from "./FreeBooleanAlgebra.js";

export const AssertionDataTypeId = Symbol.for("fncts.test.data.AssertionData");
export type AssertionDataTypeId = typeof AssertionDataTypeId;

/**
 * @tsplus type fncts.test.data.AssertionData
 */
export class AssertionData<A> {
  readonly [AssertionDataTypeId]: AssertionDataTypeId = AssertionDataTypeId;
  constructor(readonly value: A, readonly assertion: Assertion<A>) {}
}

/**
 * @tsplus getter fncts.test.data.AssertionData asSuccess
 */
export function asSuccess<A>(self: AssertionData<A>): FreeBooleanAlgebra<AssertionValue<A>> {
  return FreeBooleanAlgebra.success(
    new AssertionValue(LazyValue(self.assertion), self.value, LazyValue(self.asSuccess)),
  );
}

/**
 * @tsplus getter fncts.test.data.AssertionData asFailure
 */
export function asFailure<A>(self: AssertionData<A>): FreeBooleanAlgebra<AssertionValue<A>> {
  return FreeBooleanAlgebra.failure(
    new AssertionValue(LazyValue(self.assertion), self.value, LazyValue(self.asFailure)),
  );
}
