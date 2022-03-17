import type { ExecutedSpec } from "../../data/ExecutedSpec.js";
import type { FailureDetails } from "../../data/FailureDetails.js";
import type { Fragment, Message } from "../../data/LogLine.js";
import type { TestAnnotationRenderer } from "../TestAnnotationRenderer.js";
import type { ExecutionResult } from "./ExecutionResult.js";
import type { URIO } from "@fncts/base/control/IO";
import type { Cause } from "@fncts/base/data/Cause.js";
import type { Has } from "@fncts/base/prelude";

import { List } from "@fncts/base/collection/immutable/List.js";
import { Vector } from "@fncts/base/collection/immutable/Vector.js";
import { IO } from "@fncts/base/control/IO";
import { cyan, green, red, RESET, yellow } from "@fncts/base/util/AnsiFormat.js";
import { matchTag } from "@fncts/base/util/pattern.js";

import { ExecutedSpecCaseTag } from "../../data/ExecutedSpec.js";
import { TestAnnotationMap } from "../../data/TestAnnotationMap.js";
import { TestLogger } from "../TestLogger.js";
import { Failed, Ignored, Passed, rendered, Suite, Test } from "./ExecutionResult.js";
import { renderCause, renderFailureDetails } from "./renderFailureDetails.js";

export type TestReporter<E> = (
  duration: number,
  spec: ExecutedSpec<E>,
) => URIO<Has<TestLogger>, void>;

export function report<E>(testAnnotationRenderer: TestAnnotationRenderer): TestReporter<E> {
  return (duration, executedSpec) => {
    const rendered = renderLoop(
      executedSpec,
      0,
      List.empty(),
      List.empty(),
      testAnnotationRenderer,
    ).chain((r) => r.rendered);
    const stats = renderStats(duration, executedSpec);
    return IO.serviceWithIO(TestLogger.Tag)((l) => l.logLine(rendered.append(stats).join("\n")));
  };
}

export function renderStats<E>(duration: number, executedSpec: ExecutedSpec<E>): string {
  const [success, ignore, failure] = executedSpec.fold<E, readonly [number, number, number]>(
    matchTag({
      Labeled: ({ spec }) => spec,
      Multiple: ({ specs }) =>
        specs.foldLeft(
          [0, 0, 0] as readonly [number, number, number],
          ([x1, x2, x3], [y1, y2, y3]) => [x1 + y1, x2 + y2, x3 + y3] as const,
        ),
      Test: ({ test }) =>
        test.match(
          () => [0, 0, 1],
          matchTag({ Succeeded: () => [1, 0, 0], Ignored: () => [0, 1, 0] }),
        ) as readonly [number, number, number],
    }),
  );

  const total = success + ignore + failure;

  return cyan(
    `Ran ${total} test${
      total === 1 ? "" : "s"
    } in ${duration}ms: ${success} succeeded, ${ignore} ignored, ${failure} failed`,
  );
}

function renderLoop<E>(
  executedSpec: ExecutedSpec<E>,
  depth: number,
  ancestors: List<TestAnnotationMap>,
  labels: List<string>,
  testAnnotationRenderer: TestAnnotationRenderer,
): Vector<ExecutionResult> {
  switch (executedSpec.caseValue._tag) {
    case ExecutedSpecCaseTag.Labeled: {
      return renderLoop(
        executedSpec.caseValue.spec,
        depth,
        ancestors,
        labels.prepend(executedSpec.caseValue.label),
        testAnnotationRenderer,
      );
    }
    case ExecutedSpecCaseTag.Multiple: {
      const specs       = executedSpec.caseValue.specs;
      const hasFailures = executedSpec.exists((specCase) => {
        if (specCase._tag === ExecutedSpecCaseTag.Test) {
          return specCase.test.isLeft();
        } else {
          return false;
        }
      });

      const annotations = executedSpec.fold<E, TestAnnotationMap>(
        matchTag({
          Labeled: ({ spec }) => spec,
          Multiple: ({ specs }) => specs.foldLeft(TestAnnotationMap.empty, (a, b) => a.combine(b)),
          Test: ({ annotations }) => annotations,
        }),
      );

      const [status, renderedLabel] = specs.isEmpty
        ? [Ignored, Vector(renderIgnoreLabel(labels.reverse.join(" - "), depth))]
        : hasFailures
        ? [Failed, Vector(renderFailureLabel(labels.reverse.join(" - "), depth))]
        : [Passed, Vector(renderSuccessLabel(labels.reverse.join(" - "), depth))];

      const renderedAnnotations = testAnnotationRenderer.run(ancestors, annotations);

      const rest = Vector.from(specs).chain((spec) =>
        renderLoop(
          spec,
          depth + 1,
          ancestors.prepend(annotations),
          List.empty(),
          testAnnotationRenderer,
        ),
      );

      return rest.prepend(
        rendered(Suite, labels.reverse.join(" - "), status, depth, renderedLabel).withAnnotations(
          renderedAnnotations,
        ),
      );
    }
    case ExecutedSpecCaseTag.Test: {
      const renderedAnnotations = testAnnotationRenderer.run(
        ancestors,
        executedSpec.caseValue.annotations,
      );
      const renderedResult = executedSpec.caseValue.test.match(
        matchTag({
          AssertionFailure: ({ result }) =>
            result.fold<FailureDetails, ExecutionResult>({
              Value: (details) =>
                rendered(
                  Test,
                  labels.reverse.join(" - "),
                  Failed,
                  depth,
                  renderFailure(labels.reverse.join(" - "), depth, details),
                ),
              And: (l, r) => l && r,
              Or: (l, r) => l || r,
              Not: (v) => v.invert,
            }),
          RuntimeFailure: ({ cause }) =>
            rendered(
              Test,
              labels.reverse.join(" - "),
              Failed,
              depth,
              Vector(
                renderFailureLabel(labels.reverse.join(" - "), depth),
                renderFailureCause(cause, depth),
              ),
            ),
        }),
        matchTag({
          Succeeded: () =>
            rendered(
              Test,
              labels.reverse.join(" - "),
              Passed,
              depth,
              Vector(renderSuccessLabel(labels.reverse.join(" - "), depth)),
            ),
          Ignored: () =>
            rendered(
              Test,
              labels.reverse.join(" - "),
              Ignored,
              depth,
              Vector(renderIgnoreLabel(labels.reverse.join(" - "), depth)),
            ),
        }),
      );
      return Vector(renderedResult.withAnnotations(renderedAnnotations));
    }
  }
}

function withOffset(n: number): (s: string) => string {
  return (s) => " ".repeat(n) + s;
}

function renderToStringLines(message: Message): Vector<string> {
  const renderFragment = (f: Fragment) =>
    f.colorCode !== "" ? f.colorCode + f.text + RESET : f.text;
  return message.lines.map((line) =>
    withOffset(line.offset)(line.fragments.foldLeft("", (str, f) => str + renderFragment(f))),
  );
}

function renderFailure(label: string, offset: number, details: FailureDetails): Vector<string> {
  return renderToStringLines(renderFailureDetails(details, offset)).prepend(
    renderFailureLabel(label, offset),
  );
}

function renderFailureLabel(label: string, offset: number): string {
  return withOffset(offset)(red(`- ${label}`));
}

function renderSuccessLabel(label: string, offset: number): string {
  return withOffset(offset)(`${green("+")} ${label}`);
}

function renderIgnoreLabel(label: string, offset: number): string {
  return withOffset(offset)(yellow(`- ${label}`));
}

function renderFailureCause(cause: Cause<any>, offset: number): string {
  return renderToStringLines(renderCause(cause, offset)).join("\n");
}
