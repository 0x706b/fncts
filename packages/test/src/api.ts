import type { Assertion, AssertResult } from "./control/Assertion.js";
import type { AssertionIO } from "./control/AssertionIO.js";
import type { TestResult } from "./data/FailureDetails.js";
import type { _E, _R } from "@fncts/base/types";

import { Spec } from "./control/Spec.js";
import { Test } from "./control/Test.js";
import { FailureDetailsResult } from "./data/AssertionResult.js";
import { AssertionValue } from "./data/AssertionValue.js";
import { FailureDetails } from "./data/FailureDetails.js";
import { FreeBooleanAlgebra } from "./data/FreeBooleanAlgebra.js";
import { TestAnnotationMap } from "./data/TestAnnotationMap.js";

function traverseResultLoop<A>(
  whole: AssertionValue<A>,
  failureDetails: FailureDetails,
): TestResult {
  if (whole.isSameAssertionAs(failureDetails.assertion.head)) {
    return FreeBooleanAlgebra.success(new FailureDetailsResult(failureDetails));
  } else {
    const fragment = whole.result;
    const r0       = fragment.value;
    const result   = r0.isSuccess ? r0 : r0.invert;
    return result.chain((fragment) =>
      traverseResultLoop(
        fragment,
        new FailureDetails(Cons(whole, failureDetails.assertion), failureDetails.gen),
      ),
    );
  }
}

export function traverseResult<A>(
  value: A,
  assertResult: AssertResult<A>,
  assertion: AssertionIO<A>,
): TestResult {
  return assertResult.chain((fragment) =>
    traverseResultLoop(
      fragment,
      new FailureDetails(
        Cons(
          new AssertionValue(
            LazyValue(() => assertion),
            value,
            LazyValue(() => assertResult),
          ),
        ),
        Nothing(),
      ),
    ),
  );
}

/**
 * @tsplus fluent global assert
 */
export function assert_<A>(value: A, assertion: Assertion<A>): TestResult {
  return traverseResult(value, assertion.run(value), assertion);
}

/**
 * @tsplus fluent fncts.control.IO assert
 */
export function assertIO_<R, E, A>(
  io: IO<R, E, A>,
  assertion: AssertionIO<A>,
): IO<R, E, TestResult> {
  return IO.gen(function* (_) {
    const value        = yield* _(io);
    const assertResult = yield* _(assertion.runIO(value));
    return traverseResult(value, assertResult, assertion);
  });
}

export function suite<Specs extends ReadonlyArray<Spec<any, any>>>(
  label: string,
  ...specs: Specs
): Spec<_R<Specs[number]>, _E<Specs[number]>> {
  return Spec.multiple(Conc.from(specs)).labeled(label);
}

export function testIO<R, E>(label: string, assertion: Lazy<IO<R, E, TestResult>>): Spec<R, E> {
  return Spec.test(Test.fromAssertion(assertion), TestAnnotationMap.empty).labeled(label);
}

export function test(label: string, assertion: Lazy<TestResult>): Spec<unknown, never> {
  return testIO(label, IO.succeed(assertion));
}
