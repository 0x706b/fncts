import type { Spec } from "@fncts/test/control/Spec";
import type { TestAspect } from "@fncts/test/control/TestAspect";
import type { TestLogger } from "@fncts/test/control/TestLogger";
import type { TestRunner } from "@fncts/test/control/TestRunner";
import type { ExecutedSpec } from "@fncts/test/data/ExecutedSpec";

export abstract class AbstractRunnableSpec<R, E> {
  abstract aspects: ReadonlyArray<TestAspect<R, any>>;
  abstract runner: TestRunner<R, E>;
  abstract spec: Spec<R, E>;

  get _run(): URIO<TestLogger, ExecutedSpec<E>> {
    return this.runSpec(this.spec);
  }

  runSpec(spec: Spec<R, E>): URIO<TestLogger, ExecutedSpec<E>> {
    return this.runner.run(this.aspects.foldLeft(spec, (b, a) => a(b)));
  }

  get platform() {
    return this.runner.runtimeConfig;
  }
}
