import type { TestFailure } from "@fncts/test/data/TestFailure";
import type { TestSuccess } from "@fncts/test/data/TestSuccess";

import { matchTag } from "@fncts/base/util/pattern";
import { render } from "@fncts/test/control/DefaultTestReporter/render";
import { silent } from "@fncts/test/control/TestAnnotationRenderer";
import { ConsoleRenderer } from "@fncts/test/control/TestRenderer/ConsoleRenderer";
import { ExecutedSpec } from "@fncts/test/data/ExecutedSpec";
import { Summary } from "@fncts/test/data/Summary";

/**
 * @tsplus type fncts.test.control.SummaryBuilder
 */
export interface SummaryBuilderOps {}

export const SummaryBuilder: SummaryBuilderOps = {};

/**
 * @tsplus static fncts.test.control.SummaryBuilder buildSummary
 */
export function buildSummary<E>(executedSpec: ExecutedSpec<E>): Summary {
  const success = countTestResults(executedSpec, (_) =>
    _.match(
      () => false,
      (_) => _._tag === "Succeeded",
    ),
  );
  const fail   = countTestResults(executedSpec, (_) => _.isLeft());
  const ignore = countTestResults(executedSpec, (_) =>
    _.match(
      () => false,
      (_) => _._tag === "Ignored",
    ),
  );
  const failures = extractFailures(executedSpec);
  const rendered = ConsoleRenderer.render(failures.flatMap(render), silent).join("\n");

  return new Summary(success, fail, ignore, rendered);
}

function countTestResults<E>(
  executedSpec: ExecutedSpec<E>,
  predicate: (r: Either<TestFailure<E>, TestSuccess>) => boolean,
): number {
  return executedSpec.fold(
    matchTag({
      Labeled: ({ spec }) => spec,
      Multiple: ({ specs }) => specs.foldLeft(0, (b, a) => b + a),
      Test: ({ test }) => (predicate(test) ? 1 : 0),
    }),
  );
}

function extractFailures<E>(executedSpec: ExecutedSpec<E>): Vector<ExecutedSpec<E>> {
  return executedSpec.fold(
    matchTag({
      Labeled: ({ label, spec }) => spec.map((spec) => ExecutedSpec.labeled(spec, label)),
      Test: (c) => (c.test.isLeft() ? Vector.single(new ExecutedSpec(c)) : Vector.empty<ExecutedSpec<E>>()),
      Multiple: ({ specs }) => {
        const newSpecs = specs.flatMap(Conc.from);
        if (newSpecs.isNonEmpty) {
          return Vector.single(ExecutedSpec.multiple(newSpecs));
        }
        return Vector.empty<ExecutedSpec<E>>();
      },
    }),
  );
}
