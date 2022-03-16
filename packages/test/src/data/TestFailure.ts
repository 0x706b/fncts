import type { TestResult } from "./FailureDetails.js";

import { Cause } from "@fncts/base/data/Cause";

export const enum TestFailureTag {
  AssertionFailure = "AssertionFailure",
  RuntimeFailure = "RuntimeFailure",
}

export class AssertionFailure {
  readonly _tag = TestFailureTag.AssertionFailure;
  constructor(readonly result: TestResult) {}
}

export class RuntimeFailure<E> {
  readonly _tag = TestFailureTag.RuntimeFailure;
  constructor(readonly cause: Cause<E>) {}
}

/**
 * @tsplus type fncts.test.data.TestFailure
 */
export type TestFailure<E> = AssertionFailure | RuntimeFailure<E>;

/**
 * @tsplus type fncts.test.data.TestFailureOps
 */
export interface TestFailureOps {}

export const TestFailure: TestFailureOps = {};

/**
 * @tsplus static fncts.test.data.TestFailureOps assertion
 */
export function assertion(result: TestResult): TestFailure<never> {
  return new AssertionFailure(result);
}

/**
 * @tsplus static fncts.test.data.TestFailureOps halt
 */
export function halt(defect: unknown): TestFailure<never> {
  return new RuntimeFailure(Cause.halt(defect));
}

/**
 * @tsplus static fncts.test.data.TestFailureOps fail
 */
export function fail<E>(e: E): TestFailure<E> {
  return new RuntimeFailure(Cause.fail(e));
}

/**
 * @tsplus static fncts.test.data.TestFailureOps failCause
 */
export function failCause<E>(cause: Cause<E>): TestFailure<E> {
  return new RuntimeFailure(cause);
}
