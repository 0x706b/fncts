import type { FreeBooleanAlgebra } from "./FreeBooleanAlgebra.js";

export const enum TestSuccessTag {
  Succeeded = "Succeeded",
  Ignored = "Ignored",
}

export class Succeeded {
  readonly _tag = TestSuccessTag.Succeeded;
  constructor(readonly result: FreeBooleanAlgebra<void>) {}
}

export class Ignored {
  readonly _tag = TestSuccessTag.Ignored;
}

/**
 * @tsplus type fncts.test.TestSuccess
 */
export type TestSuccess = Succeeded | Ignored;

/**
 * @tsplus type fncts.test.TestSuccessOps
 */
export interface TestSuccessOps {}

export const TestSuccess: TestSuccessOps = {};

/**
 * @tsplus static fncts.test.TestSuccessOps Succeeded
 */
export function succeeded(result: FreeBooleanAlgebra<void>): TestSuccess {
  return new Succeeded(result);
}

/**
 * @tsplus static fncts.test.TestSuccessOps Ignored
 */
export const ignored = new Ignored();
