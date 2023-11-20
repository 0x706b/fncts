import type { AssertionValue } from "@fncts/test/data/AssertionValue";
import type { TestResult } from "@fncts/test/data/FailureDetails";

import { check, checkAllConcurrently, checkAllIOConcurrently, checkIO } from "@fncts/test/api";
import { Assertion } from "@fncts/test/control/Assertion";
import { renderFragment } from "@fncts/test/control/DefaultTestReporter";
import { TestAnnotationRenderer } from "@fncts/test/control/TestAnnotationRenderer";
import { TestEnvironment } from "@fncts/test/control/TestEnvironment";
import { ConsoleRenderer } from "@fncts/test/control/TestRenderer/ConsoleRenderer";
import { Failed, Passed, rendered, Test } from "@fncts/test/data/ExecutionResult";
import { RenderParam } from "@fncts/test/data/RenderParam";
import * as V from "vitest";

export const describe = V.describe;

export const suite = V.suite;

export const it = (() => {
  function runTest(test: Lazy<TestResult | void>) {
    const result = test();
    if (!result) {
      return;
    }
    if (result.isFailure) {
      const lines = (assertionValues: Cons<AssertionValue<any>>) =>
        assertionValues.flatMap((value) => List.from(renderFragment(value, 0).lines));
      const renderedResult = ConsoleRenderer.renderSingle(
        result.invert.fold({
          Value: (details) => rendered(Test, "", Failed, 0, lines(details.failureDetails.assertion)),
          And: (l, r) => l && r,
          Or: (l, r) => l || r,
          Not: (v) => v.invert,
        }),
        TestAnnotationRenderer.Default,
      );
      const error = new Error(renderedResult);
      error.stack = undefined;
      throw error;
    }
  }

  function it(name: string, test: Lazy<TestResult | void>, timeout = 5_000) {
    return V.it.concurrent(name, () => runTest(test), timeout);
  }

  function runTestIO<E>(io: Lazy<IO<TestEnvironment, E, TestResult>>) {
    return Do((Δ) => {
      const result = Δ(IO.defer(io));
      return Δ(
        IO.defer(() => {
          if (result.isFailure) {
            const lines = (assertionValues: Cons<AssertionValue<any>>) => {
              return assertionValues.flatMap((value) => List.from(renderFragment(value, 0).lines));
            };
            const renderedResult = ConsoleRenderer.renderSingle(
              result.fold({
                Value: (details) => rendered(Test, "", Passed, 0, lines(details.failureDetails.assertion)),
                And: (l, r) => l && r,
                Or: (l, r) => l || r,
                Not: (v) => v.invert,
              }),
              TestAnnotationRenderer.Default,
            );
            const error = new Error(renderedResult);
            error.stack = undefined;
            return IO.haltNow(error);
          }
          return IO.unit;
        }),
      );
    })
      .provideLayer(TestEnvironment)
      .unsafeRunPromise();
  }

  function itIO<E>(name: string, io: Lazy<IO<TestEnvironment, E, TestResult>>, timeout = 5_000) {
    return V.it.concurrent(name, () => runTestIO(io), timeout);
  }

  return Object.assign(it, {
    skip: (name: string, test: Lazy<TestResult | void>, timeout = 5_000) => {
      return V.it.skip(name, () => runTest(test), timeout);
    },
    only: (name: string, test: Lazy<TestResult | void>, timeout = 5_000) => {
      return V.it.only(name, () => runTest(test), timeout);
    },
    check: check,
    checkIO: checkIO,
    checkAll: checkAllConcurrently,
    checkAllIO: checkAllIOConcurrently,
    io: Object.assign(itIO, {
      scoped: <E>(name: string, io: Lazy<IO<TestEnvironment | Scope, E, TestResult>>, timeout = 5_000) => {
        return itIO(name, io().scoped, timeout);
      },
      skip: <E>(name: string, io: Lazy<IO<TestEnvironment, E, TestResult>>, timeout = 5_000) => {
        return V.it.skip(name, () => runTestIO(io), timeout);
      },
      only: <E, A>(name: string, io: Lazy<IO<TestEnvironment, E, TestResult>>, timeout = 5_000) => {
        return V.it.only(name, () => runTestIO(io), timeout);
      },
    }),
  });
})();

export const test = it;

/**
 * @tsplus static fncts.test.AssertionOps calledTimes
 */
export function calledTimes(times: number): Assertion<V.Mock> {
  return Assertion.make("calledTimes", [RenderParam(times)], (mock) => mock.mock.calls.length === times);
}