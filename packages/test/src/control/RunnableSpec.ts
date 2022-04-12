import type { Spec } from "@fncts/test/control/Spec";
import type { TestArgs } from "@fncts/test/data/TestArgs";

import { matchTag } from "@fncts/base/util/pattern";
import { isObject } from "@fncts/base/util/predicates";
import { AbstractRunnableSpec } from "@fncts/test/control/AbstractRunnableSpec";
import { SummaryBuilder } from "@fncts/test/control/SummaryBuilder";
import { TestLogger } from "@fncts/test/control/TestLogger";

export abstract class RunnableSpec<R, E> extends AbstractRunnableSpec<R, E> {
  readonly _tag = "RunnableSpec";
  run(spec: Spec<R, E>): URIO<Has<TestLogger> & Has<Clock>, number> {
    const self = this;
    return IO.gen(function* (_) {
      const results     = yield* _(self.runSpec(spec));
      const hasFailures = results.exists(
        matchTag(
          {
            Test: ({ test }) => test.isLeft(),
          },
          () => false,
        ),
      );
      const summary = SummaryBuilder.buildSummary(results);
      yield* _(TestLogger.logLine(summary.summary));
      return hasFailures ? 1 : 0;
    });
  }

  main(_args?: TestArgs): void {
    // const filteredSpec = this.spec.filterByArgs(this.spec, args);
    this.run(this.spec)
      .provideLayer(this.runner.bootstrap)
      .unsafeRunAsyncWith((exit) => {
        console.log(exit);
      });
  }
}

export function isRunnableSpec(u: unknown): u is RunnableSpec<unknown, unknown> {
  return isObject(u) && "_tag" in u && u["_tag"] === "RunnableSpec";
}
