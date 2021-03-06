import type { TestResult } from "../data/FailureDetails.js";

import { FreeBooleanAlgebra } from "../data/FreeBooleanAlgebra.js";
import { TestFailure } from "../data/TestFailure.js";
import { TestSuccess } from "../data/TestSuccess.js";

/**
 * @tsplus type fncts.control.IO
 */
export type Test<R, E> = IO<R, TestFailure<E>, TestSuccess>;

/**
 * @tsplus type fncts.test.TestOps
 */
export interface TestOps {}

export const Test: TestOps = {};

/**
 * @tsplus static fncts.test.TestOps fromAssertion
 */
export function fromAssertion<R, E>(assertion: Lazy<IO<R, E, TestResult>>): Test<R, E> {
  return IO.defer(assertion).matchCauseIO(
    (cause) => IO.failNow(TestFailure.failCause(cause)),
    (testResult) =>
      testResult.failures.match(
        () => IO.succeedNow(TestSuccess.Succeeded(FreeBooleanAlgebra.success(undefined))),
        (failure) => IO.failNow(TestFailure.assertion(failure)),
      ),
  );
}
