import type { ExecutionResult } from "../DefaultTestReporter/ExecutionResult.js";
import type { TestAnnotationRenderer } from "../TestAnnotationRenderer.js";

export abstract class TestRenderer {
  abstract render(
    results: Vector<ExecutionResult>,
    testAnnotationRenderer: TestAnnotationRenderer,
  ): Vector<string>;
}
