import type { FailureDetails } from "./FailureDetails.js";
import type { GenFailureDetails } from "./GenFailureDetails.js";

export class FailureDetailsResult {
  constructor(
    readonly failureDetails: FailureDetails,
    readonly genFailureDetails: Maybe<GenFailureDetails> = Nothing(),
  ) {}
}

/**
 * @tsplus type fncts.test.data.AssertionResult
 */
export type AssertionResult = FailureDetailsResult;

/**
 * @tsplus type fncts.test.data.AssertionResultOps
 */
export interface AssertionResultOps {}

export const AssertionResult: AssertionResultOps = {};

/**
 * @tsplus static fncts.test.data.AssertionResultOps FailureDetailsResult
 */
export function failureDetailsResult(
  failureDetails: FailureDetails,
  genFailureDetails: Maybe<GenFailureDetails> = Nothing(),
): AssertionResult {
  return new FailureDetailsResult(failureDetails, genFailureDetails);
}
