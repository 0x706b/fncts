import type { TestAspect } from "@fncts/test/control/TestAspect/definition";
import type { TestSuccess } from "@fncts/test/data/TestSuccess";

import { matchTag, matchTag_ } from "@fncts/base/util/pattern";
import { Console } from "@fncts/io/Console";
import { Annotations } from "@fncts/test/control/Annotations";
import { Live } from "@fncts/test/control/Live";
import { Spec, TestCase } from "@fncts/test/control/Spec";
import { TestAnnotation } from "@fncts/test/data/TestAnnotation";
import { RuntimeFailure, TestFailure } from "@fncts/test/data/TestFailure";

export type TestAspectAtLeastR<R> = TestAspect<R, never>;

export type TestAspectPoly = TestAspect<unknown, never>;

export const id: TestAspectPoly = Function.identity;

export const ignore: TestAspectAtLeastR<Has<Annotations>> = (spec) => spec.when(false);

export function perTest<R, E>(
  f: <R1, E1>(test: IO<R1, TestFailure<E1>, TestSuccess>) => IO<R & R1, TestFailure<E | E1>, TestSuccess>,
): TestAspect<R, E> {
  return (spec) =>
    spec.transform(
      matchTag(
        {
          Test: ({ test, annotations }) => new TestCase(f(test), annotations),
        },
        Function.identity,
      ),
    );
}

export function after<R, E, A>(effect: IO<R, E, A>): TestAspect<R, E> {
  return perTest<R, E>((test) =>
    test.result
      .zipWith(effect.catchAllCause((cause) => IO.fail(new RuntimeFailure(cause))).result, (ex0, ex1) =>
        ex0.apFirst(ex1),
      )
      .flatMap(IO.fromExitNow),
  );
}

export function around<R, E, A, R1>(before: IO<R, E, A>, after: (a: A) => IO<R1, never, any>): TestAspect<R & R1, E> {
  return perTest<R & R1, E>((test) =>
    before.catchAllCause((c) => IO.fail(new RuntimeFailure(c))).bracket(() => test, after),
  );
}

export function aroundAll<R, E, A, R1>(
  before: IO<R, E, A>,
  after: (a: A) => IO<R1, never, any>,
): TestAspect<R & R1, E> {
  return <R0, E0>(spec: Spec<R0, E0>) =>
    Spec.scoped<R & R1 & R0, TestFailure<E | E0>, TestSuccess>(
      IO.acquireRelease(before, after)
        .mapError((e) => TestFailure.fail(e))
        .as(spec),
    );
}

export function before<R0>(effect: IO<R0, never, any>): TestAspect<R0, never> {
  return perTest<R0, never>((test) => effect.apSecond(test));
}

export function beforeAll<R0, E0>(effect: IO<R0, E0, any>): TestAspect<R0, E0> {
  return aroundAll(effect, () => IO.unit);
}

export const eventually = perTest((test) => test.eventually);

export function repeat<R0>(schedule: Schedule<R0, TestSuccess, any>): TestAspect<R0 & Has<Annotations>, never> {
  return perTest<R0 & Has<Annotations>, never>(
    <R1, E1>(
      test: IO<R1, TestFailure<E1>, TestSuccess>,
    ): IO<R0 & R1 & Has<Annotations>, TestFailure<E1>, TestSuccess> =>
      IO.environmentWithIO((r: Environment<R0 & R1 & Has<Annotations>>) =>
        test
          .provideEnvironment(r)
          .repeat(
            schedule.zipRight(
              Schedule.identity<TestSuccess>().tapOutput((_) =>
                Annotations.annotate(TestAnnotation.Repeated, 1).provideEnvironment(r),
              ),
            ),
          ),
      ),
  );
}

export function timeoutWarning(duration: Duration): TestAspect<Has<Live>, any> {
  return <R1, E1>(spec: Spec<R1, E1>) => {
    const loop = (labels: Vector<string>, spec: Spec<R1, E1>): Spec<R1 & Has<Live>, E1> =>
      matchTag_(spec.caseValue, {
        Exec: ({ exec, spec }) => Spec.exec(loop(labels, spec), exec),
        Labeled: ({ label, spec }) => Spec.labeled(loop(labels.append(label), spec), label),
        Scoped: ({ scoped }) => Spec.scoped(scoped.map((spec) => loop(labels, spec))),
        Multiple: ({ specs }) => Spec.multiple(specs.map((spec) => loop(labels, spec))),
        Test: ({ test, annotations }) => Spec.test(warn(labels, test, duration), annotations),
      });

    return loop(Vector(), spec);
  };
}

function warn<R, E>(labels: Vector<string>, test: IO<R, TestFailure<E>, TestSuccess>, duration: Duration) {
  return test.raceWith(
    Live.withLive(showWarning(labels, duration), (io) => Clock.sleep(duration) > io),
    (result, fiber) => fiber.interrupt > IO.fromExitNow(result),
    (_, fiber) => fiber.join,
  );
}

function showWarning(labels: Vector<string>, duration: Duration) {
  return Live.Live(Console.print(renderWarning(labels, duration)));
}

function renderWarning(labels: Vector<string>, duration: Duration) {
  return `Test ${labels.join(" - ")} has taken more than ${
    duration.milliseconds
  } milliseconds to execute. If this is not expected, consider using TestAspect.timeout to timeout runaway tests for faster diagnostics`;
}
