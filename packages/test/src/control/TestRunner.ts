import type { RuntimeConfig } from "@fncts/io/RuntimeConfig";
import type { Annotations } from "@fncts/test/control/Annotations";
import type { TestReporter } from "@fncts/test/control/DefaultTestReporter/render";
import type { Spec } from "@fncts/test/control/Spec";
import type { TestExecutor } from "@fncts/test/control/TestExecutor";
import type { ExecutedSpec } from "@fncts/test/data/ExecutedSpec";

import { Console } from "@fncts/io/Console";
import { defaultRuntimeConfig } from "@fncts/io/IO";
import { DefaultTestReporter } from "@fncts/test/control/DefaultTestReporter";
import { TestAnnotationRenderer } from "@fncts/test/control/TestAnnotationRenderer";
import { TestLogger } from "@fncts/test/control/TestLogger";
import { ConsoleRenderer } from "@fncts/test/control/TestRenderer/ConsoleRenderer";

export class TestRunner<R, E> {
  readonly reporter: TestReporter<E>;
  readonly bootstrap: Layer<unknown, never, Has<TestLogger> & Has<Clock>>;
  constructor(
    readonly executor: TestExecutor<R>,
    readonly runtimeConfig: RuntimeConfig = defaultRuntimeConfig,
    reporter?: TestReporter<E>,
    bootstrap?: Layer<unknown, never, Has<TestLogger> & Has<Clock>>,
  ) {
    this.reporter = reporter ?? DefaultTestReporter.report(ConsoleRenderer.render, TestAnnotationRenderer.Default);
    this.bootstrap =
      bootstrap ??
      Layer.succeed(Console.Live, Console.Tag).to(TestLogger.fromConsole).and(Layer.succeed(Clock.Live, Clock.Tag));
  }

  run(spec: Spec<R & Has<Annotations>, E>): URIO<Has<TestLogger> & Has<Clock>, ExecutedSpec<E>> {
    return this.executor
      .run(spec, ExecutionStrategy.concurrentBounded(10))
      .timedWith(Clock.currentTime)
      .flatMap(([duration, results]) => this.reporter(duration, results).as(results));
  }
}
