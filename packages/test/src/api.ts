import type { AssertResult } from "./control/Assertion.js";
import type { AssertionIO } from "./control/AssertionIO.js";
import type { Gen } from "./control/Gen.js";
import type { Sample } from "./control/Sample.js";
import type { TestResult } from "./data/FailureDetails.js";
import type { _E, _R } from "@fncts/base/types";

import { identity } from "@fncts/base/data/function";

import { Assertion, completes } from "./control/Assertion.js";
import { Spec } from "./control/Spec.js";
import { Test } from "./control/Test.js";
import { FailureDetailsResult } from "./data/AssertionResult.js";
import { AssertionValue } from "./data/AssertionValue.js";
import { FailureDetails } from "./data/FailureDetails.js";
import { FreeBooleanAlgebra } from "./data/FreeBooleanAlgebra.js";
import { GenFailureDetails } from "./data/GenFailureDetails.js";
import { TestAnnotationMap } from "./data/TestAnnotationMap.js";
import { TestConfig } from "./data/TestConfig.js";

function traverseResultLoop<A>(whole: AssertionValue<A>, failureDetails: FailureDetails): TestResult {
  if (whole.isSameAssertionAs(failureDetails.assertion.head)) {
    return FreeBooleanAlgebra.success(new FailureDetailsResult(failureDetails));
  } else {
    const fragment = whole.result;
    const r0       = fragment.value;
    const result   = r0.isSuccess ? r0 : r0.invert;
    return result.flatMap((fragment) =>
      traverseResultLoop(fragment, new FailureDetails(Cons(whole, failureDetails.assertion), failureDetails.gen)),
    );
  }
}

export function traverseResult<A>(value: A, assertResult: AssertResult<A>, assertion: AssertionIO<A>): TestResult {
  return assertResult.flatMap((fragment) =>
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
 * @tsplus fluent global assert 1
 */
export function assert_<A>(value: A, assertion: Assertion<A>): TestResult {
  return traverseResult(value, assertion.run(value), assertion);
}

/**
 * @tsplus fluent global assert 0
 */
export function assertIO_<R, E, A>(io: IO<R, E, A>, assertion: AssertionIO<A>): IO<R, E, TestResult> {
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

/**
 * @tsplus fluent fncts.test.Gen check
 */
export function check<R, A>(rv: Gen<R, A>, test: (a: A) => TestResult): IO<R & Has<TestConfig>, never, TestResult> {
  return TestConfig.samples.flatMap((n) =>
    checkStream(rv.sample.forever.filterMap(identity).take(n), (a) => IO.succeed(test(a))),
  );
}

/**
 * @tsplus fluent fncts.test.Gen check
 */
export function checkIO<R, A, R1, E>(
  rv: Gen<R, A>,
  test: (a: A) => IO<R1, E, TestResult>,
): IO<R & R1 & Has<TestConfig>, E, TestResult> {
  return TestConfig.samples.flatMap((n) => checkStream(rv.sample.forever.filterMap(identity).take(n), test));
}

/**
 * @tsplus fluent fncts.test.Gen checkAllC
 */
export function checkAllC<R, A>(
  rv: Gen<R, A>,
  concurrency: number,
  test: (a: A) => TestResult,
): IO<R & Has<TestConfig>, never, TestResult> {
  return checkStreamC(rv.sample.forever.filterMap(identity), concurrency, (a) => IO.succeed(test(a)));
}

/**
 * @tsplus fluent fncts.test.Gen checkAllC
 */
export function checkAllIOC<R, A, R1, E>(
  rv: Gen<R, A>,
  concurrency: number,
  test: (a: A) => IO<R1, E, TestResult>,
): IO<R & R1 & Has<TestConfig>, E, TestResult> {
  return checkStreamC(rv.sample.forever.filterMap(identity), concurrency, test);
}

function checkStreamC<R, E, A, R1>(
  stream: Stream<R, never, Sample<R, A>>,
  concurrency: number,
  test: (a: A) => IO<R1, E, TestResult>,
): IO<R & R1 & Has<TestConfig>, E, TestResult> {
  return TestConfig.shrinks.flatMap((shrinks) =>
    shrinkStream(
      stream.zipWithIndex
        .mapIOC(concurrency, ([initial, index]) =>
          initial
            .foreach(
              (input) =>
                test(input).map((result) =>
                  result.map(
                    (details) =>
                      new FailureDetailsResult(
                        details.failureDetails,
                        Just(new GenFailureDetails(initial.value, input, index)),
                      ),
                  ),
                ).either,
            )
            .flatMap((sample) =>
              sample.value.match(
                () => IO.fail(sample),
                () => IO.succeed(sample),
              ),
            ),
        )
        .catchAll(Stream.succeedNow),
      shrinks,
    ),
  );
}

function checkStream<R, E, A, R1>(
  stream: Stream<R, never, Sample<R, A>>,
  test: (a: A) => IO<R1, E, TestResult>,
): IO<R & R1 & Has<TestConfig>, E, TestResult> {
  return TestConfig.shrinks.flatMap((shrinks) =>
    shrinkStream(
      stream.zipWithIndex.mapIO(([initial, index]) =>
        initial.foreach(
          (input) =>
            test(input).map((result) =>
              result.map(
                (details) =>
                  new FailureDetailsResult(
                    details.failureDetails,
                    Just(new GenFailureDetails(initial.value, input, index)),
                  ),
              ),
            ).either,
        ),
      ),
      shrinks,
    ),
  );
}

function shrinkStream<R, E, A, R1>(
  stream: Stream<R1, never, Sample<R1, Either<E, TestResult>>>,
  maxShrinks: number,
  __tsPlusTrace?: string,
): IO<R & R1 & Has<TestConfig>, E, TestResult> {
  return stream
    .dropWhile(
      (sample) =>
        !sample.value.match(
          () => true,
          (result) => result.isFailure,
        ),
    )
    .take(1)
    .flatMap((sample) =>
      sample
        .shrinkSearch((value) =>
          value.match(
            () => true,
            (result) => result.isFailure,
          ),
        )
        .take(maxShrinks + 1),
    )
    .runCollect.flatMap((shrinks) =>
      shrinks
        .filter((value) =>
          value.match(
            () => true,
            (result) => result.isFailure,
          ),
        )
        .last.match(
          () =>
            IO.succeedNow(
              FreeBooleanAlgebra.success(
                new FailureDetailsResult(
                  new FailureDetails(
                    Cons(
                      new AssertionValue(
                        LazyValue(Assertion.anything),
                        undefined,
                        LazyValue(Assertion.anything.run(undefined)),
                      ),
                    ),
                    Nothing(),
                  ),
                ),
              ),
            ),
          IO.fromEitherNow,
        ),
    );
}
