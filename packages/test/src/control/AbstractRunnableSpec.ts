import type { Annotated } from "@fncts/test/control/Annotations";
import type { Spec, SpecCase } from "@fncts/test/control/Spec";
import type { TestAspect } from "@fncts/test/control/TestAspect";
import type { TestFailure } from "@fncts/test/data/TestFailure";
import type { TestSuccess } from "@fncts/test/data/TestSuccess";

import { matchTag, matchTag_ } from "@fncts/base/util/pattern";
import { DefaultTestReporter } from "@fncts/test/control/DefaultTestReporter";
import { SummaryBuilder } from "@fncts/test/control/SummaryBuilder";
import { TestAnnotationRenderer } from "@fncts/test/control/TestAnnotationRenderer";
import { timeoutWarning } from "@fncts/test/control/TestAspect";
import { TestEnvironment } from "@fncts/test/control/TestEnvironment";
import { TestLogger } from "@fncts/test/control/TestLogger";
import { ConsoleRenderer } from "@fncts/test/control/TestRenderer/ConsoleRenderer";
import { ExecutedSpec } from "@fncts/test/data/ExecutedSpec";
import { TestAnnotationMap } from "@fncts/test/data/TestAnnotationMap";
import { RuntimeFailure } from "@fncts/test/data/TestFailure";

/**
 * @tsplus type fncts.test.AbstractRunnableSpec
 */
export abstract class AbstractRunnableSpec<R, E> {
  aspects: ReadonlyArray<TestAspect<R | TestEnvironment, any>> = [timeoutWarning((60).seconds)];

  abstract spec: Spec<R | TestEnvironment | Scope, E>;
  abstract bootstrap: Layer<never, never, R>;

  runSpec(spec: Spec<R | TestEnvironment | Scope, E>, __tsplusTrace?: string): UIO<ExecutedSpec<E>> {
    return spec.annotated
      .provideLayer(this.bootstrap.and(TestEnvironment))
      .foreachExec(
        (cause): UIO<Annotated<Either<TestFailure<E>, TestSuccess>>> =>
          cause.failureOrCause.match(
            ([failure, annotations]) => IO.succeedNow([Either.left(failure), annotations]),
            (cause) => IO.succeedNow([Either.left(new RuntimeFailure(cause)), TestAnnotationMap.empty]),
          ),
        ([success, annotations]): UIO<Annotated<Either<TestFailure<E>, TestSuccess>>> =>
          IO.succeedNow([Either.right(success), annotations]),
        ExecutionStrategy.concurrentBounded(10),
      )
      .scoped.flatMap(
        (s) =>
          s.foldScoped(
            (spec: SpecCase<never, never, Annotated<Either<TestFailure<E>, TestSuccess>>, ExecutedSpec<E>>) =>
              matchTag_(spec, {
                Exec: ({ spec }) => IO.succeedNow(spec),
                Labeled: ({ label, spec }) => IO.succeedNow(ExecutedSpec.labeled(spec, label)),
                Scoped: ({ scoped }) => scoped,
                Multiple: ({ specs }) => IO.succeedNow(ExecutedSpec.multiple(specs)),
                Test: ({ test, annotations }) =>
                  test.map(([result, dynamicAnnotations]) =>
                    ExecutedSpec.test(result, annotations.combine(dynamicAnnotations)),
                  ),
              }),
            ExecutionStrategy.concurrentBounded(10),
          ).scoped,
      )
      .timedWith(Clock.currentTime)
      .flatMap(([duration, results]) =>
        DefaultTestReporter.report(ConsoleRenderer.render, TestAnnotationRenderer.Default)(duration, results).as(
          results,
        ),
      )
      .provideLayer(TestLogger.fromConsole);
  }

  run(__tsplusTrace?: string): UIO<number> {
    return Do((Δ) => {
      const results     = Δ(this.runSpec(this.spec));
      const hasFailures = results.some(
        matchTag(
          {
            Test: ({ test }) => test.isLeft(),
          },
          () => false,
        ),
      );
      const summary = SummaryBuilder.buildSummary(results);
      Δ(TestLogger.logLine(summary.summary));
      return hasFailures ? 1 : 0;
    }).provideSomeLayer(TestLogger.fromConsole);
  }
}

/**
 * @tsplus pipeable fncts.test.AbstractRunnableSpec combine
 * @tsplus pipeable-operator fncts.test.AbstractRunnableSpec +
 */
export function combine<R1, E1>(that: AbstractRunnableSpec<R1, E1>) {
  return <R, E>(self: AbstractRunnableSpec<R, E>): AbstractRunnableSpec<R | R1, E | E1> => {
    return new (class extends AbstractRunnableSpec<R | R1, E | E1> {
      bootstrap: Layer<never, never, R1 | R> = self.bootstrap.and(that.bootstrap);
      spec: Spec<Scope | R1 | R | TestEnvironment, E1 | E> = self.aspects
        .foldLeft(self.spec, (b, a) => a(b))
        .combine(that.aspects.foldLeft(that.spec, (b, a) => a(b)));
      aspects: readonly TestAspect<R1 | R | TestEnvironment, any>[] = [];
    })();
  };
}
