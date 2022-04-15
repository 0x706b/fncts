import type { ExecutionResult, Status } from "../../data/ExecutionResult.js";
import type { Fragment } from "../../data/LogLine/Fragment.js";
import type { TestAnnotationMap } from "../../data/TestAnnotationMap.js";
import type { TestAnnotationRenderer } from "../TestAnnotationRenderer.js";

import { blue, bold, cyan, dim, green, red, underline, yellow } from "@fncts/base/util/AnsiFormat.js";
import { matchTag_ } from "@fncts/base/util/pattern.js";

import { fr, info, sp, warn } from "../../data/LogLine.js";
import { Line } from "../../data/LogLine/Line.js";
import { Message } from "../../data/LogLine/Message.js";
import { TestAnnotation } from "../../data/TestAnnotation.js";
import { TestRenderer } from "./definition.js";

const tabSize = 2;

/**
 * @tsplus type fncts.test.ConsoleRenderer
 */
export interface ConsoleRenderer {}

export const ConsoleRenderer: ConsoleRenderer = {};

/**
 * @tsplus static fncts.test.ConsoleRenderer render
 */
export function render(
  results: Vector<ExecutionResult>,
  testAnnotationRenderer: TestAnnotationRenderer,
): Vector<string> {
  return results.map((result) => {
    const message = new Message(Vector.from(result.lines)).intersperse(Line.fromString("\n"));
    const output  = matchTag_(result.resultType, {
      Suite: () => renderSuite(result.status, result.offset, message),
      Test: () => renderTest(result.status, result.offset, message),
      Other: () => new Message(Vector.from(result.lines)),
    });
    const renderedAnnotations = renderAnnotations(result.annotations, testAnnotationRenderer);
    return renderToStringLines(output + renderedAnnotations).join("");
  });
}

function renderSuite(status: Status, offset: number, message: Message) {
  return matchTag_(status, {
    Passed: () => (info("+") + sp).withOffset(offset).toMessage + message,
    Failed: () => Line.empty.withOffset(offset).toMessage + message,
    Ignored: () =>
      Line.empty.withOffset(offset).toMessage +
      message +
      fr(" - " + TestAnnotation.Ignored.identifier + " suite").toLine,
  });
}

function renderTest(status: Status, offset: number, message: Message) {
  return matchTag_(status, {
    Passed: () => (info("+") + sp).withOffset(offset).toMessage + message,
    Ignored: () => (warn("-") + sp).withOffset(offset).toMessage + message,
    Failed: () => message,
  });
}

function renderToStringLines(message: Message): Vector<string> {
  const renderFragment = (f: Fragment): string =>
    matchTag_(f.style, {
      Default: () => f.text,
      Primary: () => blue(f.text),
      Warning: () => yellow(f.text),
      Error: () => red(f.text),
      Info: () => green(f.text),
      Detail: () => cyan(f.text),
      Dimmed: () => dim(f.text),
      Bold: ({ fr }) => bold(renderFragment(fr)),
      Underlined: ({ fr }) => underline(renderFragment(fr)),
      Ansi: ({ fr, ansiColor }) => renderFragment(fr),
    });
  return message.lines.map((line) =>
    renderOffset(line.offset)(line.fragments.foldLeft("", (str, f) => str + renderFragment(f))),
  );
}

function renderAnnotations(annotations: List<TestAnnotationMap>, annotationRenderer: TestAnnotationRenderer): Message {
  if (annotations.isEmpty()) {
    return Message.empty;
  }
  const rendered = annotationRenderer.run(annotations.tail, annotations.head);
  if (rendered.isEmpty()) {
    return Message.empty;
  }
  return new Message(Vector(Line.fromString(` - ${rendered.join(", ")}`)));
}

function renderOffset(n: number) {
  return (s: string) => " ".repeat(n * tabSize) + s;
}
