import type { FreeBooleanAlgebra } from "./FreeBooleanAlgebra";

export const enum TestSuccessTag {
  Succeeded = "Succeeded",
  Ignored = "Ignored",
}

export class Succeeded {
  readonly _tag = TestSuccessTag.Succeeded;
  constructor(readonly result: FreeBooleanAlgebra<void>) {}
}

export class Ignored {}

/**
 * @tsplus type fncts.data.TestSuccess
 */
export type TestSuccess = Succeeded | Ignored;

/**
 * @tsplus type fncts.data.TestSuccessOps
 */
export interface TestSuccessOps {}

export const TestSuccess: TestSuccessOps = {};

/**
 * @tsplus static fncts.data.TestSuccessOps Succeeded
 */
export function succeeded(result: FreeBooleanAlgebra<void>): TestSuccess {
  return new Succeeded(result);
}

/**
 * @tsplus static fncts.data.TestSuccessOps Ignored
 */
export const ignored = new Ignored();
