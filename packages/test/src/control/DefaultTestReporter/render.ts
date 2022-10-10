import type { AssertionResult, FailureDetailsResult } from "../../data/AssertionResult.js";
import type { AssertionValue } from "../../data/AssertionValue.js";
import type { ExecutedSpec } from "../../data/ExecutedSpec.js";
import type { ExecutionResult } from "../../data/ExecutionResult.js";
import type { TestResult } from "../../data/FailureDetails.js";
import type { GenFailureDetails } from "../../data/GenFailureDetails.js";
import type { TestAnnotationRenderer } from "../TestAnnotationRenderer.js";
import type { TestRenderer } from "../TestRenderer/definition.js";

import { matchTag } from "@fncts/base/util/pattern";

import { ExecutedSpecCaseTag } from "../../data/ExecutedSpec.js";
import { Other } from "../../data/ExecutionResult.js";
import { Failed, Ignored, Passed, rendered, Suite, Test } from "../../data/ExecutionResult.js";
import { detail, primary, Style } from "../../data/LogLine.js";
import { error, fr, warn } from "../../data/LogLine.js";
import { Fragment } from "../../data/LogLine/Fragment.js";
import { Line } from "../../data/LogLine/Line.js";
import { Message } from "../../data/LogLine/Message.js";
import { TestAnnotationMap } from "../../data/TestAnnotationMap.js";
import { TestTimeoutException } from "../../data/TestTimeoutException.js";
import { TestLogger } from "../TestLogger.js";

export type TestReporter<E> = (duration: number, spec: ExecutedSpec<E>) => URIO<TestLogger, void>;

/**
 * @tsplus static fncts.test.DefaultTestReporter report
 */
export function report<E>(renderTest: TestRenderer, testAnnotationRenderer: TestAnnotationRenderer): TestReporter<E> {
  return (duration, executedSpec) => {
    const rendered = renderTest(renderLoop(executedSpec, 0, List.empty(), List.empty()), testAnnotationRenderer);
    const stats    = renderTest(Vector(renderStats(duration, executedSpec)), testAnnotationRenderer);
    return IO.serviceWithIO((l) => l.logLine(rendered.concat(stats).join("\n")), TestLogger.Tag);
  };
}

export function renderStats<E>(duration: number, executedSpec: ExecutedSpec<E>) {
  const [success, ignore, failure] = executedSpec.fold<E, readonly [number, number, number]>(
    matchTag({
      Labeled: ({ spec }) => spec,
      Multiple: ({ specs }) =>
        specs.foldLeft(
          [0, 0, 0] as readonly [number, number, number],
          ([x1, x2, x3], [y1, y2, y3]) => [x1 + y1, x2 + y2, x3 + y3] as const,
        ),
      Test: ({ test }) =>
        test.match(() => [0, 0, 1], matchTag({ Succeeded: () => [1, 0, 0], Ignored: () => [0, 1, 0] })) as readonly [
          number,
          number,
          number,
        ],
    }),
  );
  const total = success + ignore + failure;
  const stats = detail(
    `Ran ${total} test${
      total === 1 ? "" : "s"
    } in ${duration}ms: ${success} succeeded, ${ignore} ignored, ${failure} failed`,
  );
  return rendered(Other, "", Passed, 0, List(stats.toLine));
}

/**
 * @tsplus static fncts.test.DefaultTestRenderer render
 */
export function render<E>(executedSpec: ExecutedSpec<E>): Vector<ExecutionResult> {
  return renderLoop(executedSpec, 0, Nil(), Nil());
}

function renderLoop<E>(
  executedSpec: ExecutedSpec<E>,
  depth: number,
  ancestors: List<TestAnnotationMap>,
  labels: List<string>,
): Vector<ExecutionResult> {
  switch (executedSpec.caseValue._tag) {
    case ExecutedSpecCaseTag.Labeled: {
      return renderLoop(executedSpec.caseValue.spec, depth, ancestors, labels.prepend(executedSpec.caseValue.label));
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
        ? [Ignored, Vector(renderSuiteIgnored(labels.reverse.join(" - "), depth))]
        : hasFailures
        ? [Failed, Vector(renderSuiteFailed(labels.reverse.join(" - "), depth))]
        : [Passed, Vector(renderSuiteSucceeded(labels.reverse.join(" - "), depth))];
      const allAnnotations = ancestors.prepend(annotations);
      const rest           = Vector.from(specs).flatMap((spec) =>
        renderLoop(spec, depth + 1, ancestors.prepend(annotations), List.empty()),
      );
      return rest.prepend(
        rendered(
          Suite,
          labels.reverse.join(" - "),
          status,
          depth,
          List.from(renderedLabel.flatMap((r) => r.lines)),
        ).withAnnotations(allAnnotations),
      );
    }
    case ExecutedSpecCaseTag.Test: {
      const renderedResult = executedSpec.caseValue.test.match(
        matchTag({
          AssertionFailure: ({ result }) =>
            result.fold<FailureDetailsResult, ExecutionResult>({
              Value: (details) =>
                rendered(
                  Test,
                  labels.reverse.join(" - "),
                  Failed,
                  depth,
                  List.from(renderFailure(labels.reverse.join(" - "), depth, details).lines),
                ),
              And: (l, r) => l && r,
              Or: (l, r) => l || r,
              Not: (v) => v.invert,
            }),
          RuntimeFailure: ({ cause }) => renderRuntimeCause(cause, labels.reverse.join(" - "), depth, true),
        }),
        matchTag({
          Succeeded: () =>
            rendered(Test, labels.reverse.join(" - "), Passed, depth, List(fr(labels.reverse.join(" - ")).toLine)),
          Ignored: () =>
            rendered(Test, labels.reverse.join(" - "), Ignored, depth, List(warn(labels.reverse.join(" - ")).toLine)),
        }),
      );
      return Vector(renderedResult.withAnnotations(ancestors.prepend(executedSpec.caseValue.annotations)));
    }
  }
}

function renderSuiteIgnored(label: string, offset: number) {
  return rendered(Suite, label, Ignored, offset, Cons(warn(`- ${label}`).toLine));
}

function renderSuiteFailed(label: string, offset: number) {
  return rendered(Suite, label, Failed, offset, Cons(error(`- ${label}`).toLine));
}

function renderSuiteSucceeded(label: string, offset: number) {
  return rendered(Suite, label, Passed, offset, Cons(fr(label).toLine));
}

function renderFailure(label: string, offset: number, details: AssertionResult): Message {
  return renderFailureLabel(label, offset).toMessage + renderAssertionResult(details, offset);
}

function renderAssertionResult(assertionResult: AssertionResult, offset: number): Message {
  return (
    renderGenFailureDetails(assertionResult.genFailureDetails, offset) +
    renderAssertionFailureDetails(assertionResult.failureDetails.assertion, offset)
  );
}

function renderFailureLabel(label: string, offset: number): Line {
  return error("- " + label).toLine.withOffset(offset);
}

function renderAssertFailure(result: TestResult, label: string, depth: number): ExecutionResult {
  return result.fold({
    Value: (details) => rendered(Test, label, Failed, depth, List.from(renderFailure(label, depth, details).lines)),
    And: (l, r) => l && r,
    Or: (l, r) => l || r,
    Not: (v) => v.invert,
  });
}

function renderAssertionFailureDetails(failureDetails: Cons<AssertionValue<any>>, offset: number): Message {
  /**
   * @tsplus tailrec
   */
  function loop(failureDetails: List<AssertionValue<any>>, rendered: Message): Message {
    const fragment = failureDetails.head;
    const whole    = failureDetails.tail.flatMap((l) => l.head);
    const details  = failureDetails.tail.flatMap((l) => l.tail);
    if (fragment.isJust() && whole.isJust() && details.isJust()) {
      return loop(Cons(whole.value, details.value), rendered + renderWhole(fragment.value, whole.value, offset));
    } else {
      return rendered;
    }
  }
  return renderFragment(failureDetails.head, offset) + loop(failureDetails, Message.empty);
}

function renderGenFailureDetails(failureDetails: Maybe<GenFailureDetails>, offset: number): Message {
  return failureDetails.match(
    () => Message.empty,
    (details) => {
      const shrunken       = `${details.shrunkenInput}`;
      const initial        = `${details.initialInput}`;
      const renderShrunken = (
        Fragment(
          `Test failed after ${details.iterations + 1} iteration${details.iterations > 0 ? "s" : ""} with input: `,
        ) + error(shrunken)
      ).withOffset(offset + 1);
      return initial === shrunken
        ? renderShrunken.toMessage
        : renderShrunken | (Fragment("Original input before shrinking was: ") + error(initial)).withOffset(offset + 1);
    },
  );
}

function renderFragment<A>(fragment: AssertionValue<A>, offset: number): Message {
  return (
    (primary(renderValue(fragment, offset + 1)) + renderSatisfied(fragment)).withOffset(offset).toMessage +
    Message(
      Vector.from(fragment.assertion.value.rendered.split(/\n/).map((s) => detail(s).toLine.withOffset(offset))),
    ).withOffset(offset)
  );
}

function renderWhole<A>(fragment: AssertionValue<A>, whole: AssertionValue<A>, offset: number) {
  return (
    primary(renderValue(whole, offset + 1)) +
    renderSatisfied(whole) +
    highlight(detail(whole.assertion.value.rendered), fragment.assertion.value.rendered)
  );
}

function renderValue<A>(av: AssertionValue<A>, offset: number) {
  return av.showValue(offset);
}

function expressionRedundant(valueStr: string, expression: string) {
  const strip = (s: string) => s.replace('"', "").replace(" ", "").replace("\n", "").replace("\\n", "");
  return strip(valueStr) === strip(expression);
}

function renderSatisfied<A>(assertionValue: AssertionValue<A>): Fragment {
  return assertionValue.result.value.isSuccess ? Fragment(" satisfied ") : Fragment(" did not satisfy ");
}

function renderRuntimeCause<E>(cause: Cause<E>, label: string, depth: number, includeCause: boolean) {
  const failureDetails = List(renderFailureLabel(label, depth)).concat(
    List(renderCause(cause, depth))
      .filter(() => includeCause)
      .flatMap((l) => l.lines),
  );
  return rendered(Test, label, Failed, depth, List.from(failureDetails));
}

function renderCause(cause: Cause<any>, offset: number): Message {
  const defects  = cause.defects;
  const timeouts = defects.filterMap((u) =>
    u instanceof TestTimeoutException ? Just(new Fragment(u.message).toLine.toMessage) : Nothing(),
  );
  const remaining = cause.filterDefects((u) => u instanceof TestTimeoutException);
  const prefix    = timeouts.foldLeft(Message.empty, (b, a) => b + a);
  return remaining.match(
    () => prefix,
    (remainingCause) =>
      prefix +
      Message(
        Vector.from(remainingCause.prettyPrint.split("\n").map((s) => Line.fromString(s).withOffset(offset + 1))),
      ),
  );
}

function highlight(fragment: Fragment, substring: string, style: Style = Style.Warning): Line {
  const parts = fragment.text.split(substring);
  if (parts.length === 1) return fragment.toLine;
  else {
    return parts.foldLeft(Line.empty, (line, part) => {
      if (line.fragments.length < parts.length * 2 - 2) {
        return line + Fragment(part, fragment.style) + Fragment(substring, style);
      } else {
        return line + Fragment(part, fragment.style);
      }
    });
  }
}
