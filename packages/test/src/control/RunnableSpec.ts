import type { Spec } from "@fncts/test/control/Spec";
import type { TestArgs } from "@fncts/test/data/TestArgs";

import { matchTag } from "@fncts/base/util/pattern";
import { isObject } from "@fncts/base/util/predicates";
import { AbstractRunnableSpec } from "@fncts/test/control/AbstractRunnableSpec";
import { SummaryBuilder } from "@fncts/test/control/SummaryBuilder";
import { TestLogger } from "@fncts/test/control/TestLogger";

export abstract class RunnableSpec<R, E> extends AbstractRunnableSpec<R, E> {
  readonly _tag = "RunnableSpec";
  run(spec: Spec<R, E>): URIO<TestLogger, number> {
    const self = this;
    return Do((_) => {
      const results     = _(self.runSpec(spec));
      const hasFailures = results.some(
        matchTag(
          {
            Test: ({ test }) => test.isLeft(),
          },
          () => false,
        ),
      );
      const summary = SummaryBuilder.buildSummary(results);
      _(TestLogger.logLine(summary.summary));
      return hasFailures ? 1 : 0;
    });
  }

  main(_args?: TestArgs): void {
    // const filteredSpec = this.spec.filterByArgs(args);
    this.run(this.spec)
      .provideLayer(this.runner.bootstrap)
      .unsafeRunAsyncWith((exit) => {
        exit.match(
          () => {
            process.exit(1);
          },
          (code) => process.exit(code),
        );
      });
  }
}

export function isRunnableSpec(u: unknown): u is RunnableSpec<unknown, unknown> {
  return isObject(u) && "_tag" in u && u["_tag"] === "RunnableSpec";
}
