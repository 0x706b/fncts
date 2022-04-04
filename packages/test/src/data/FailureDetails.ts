import type { FailureDetailsResult } from "./AssertionResult.js";
import type { AssertionValue } from "./AssertionValue.js";
import type { FreeBooleanAlgebra } from "./FreeBooleanAlgebra.js";
import type { GenFailureDetails } from "./GenFailureDetails.js";

/**
 * @tsplus type fncts.data.FreeBooleanAlgebra
 */
export type TestResult = FreeBooleanAlgebra<FailureDetailsResult>;

export class FailureDetails {
  constructor(
    readonly assertion: Cons<AssertionValue<any>>,
    readonly gen: Maybe<GenFailureDetails<any>>,
  ) {}
}
