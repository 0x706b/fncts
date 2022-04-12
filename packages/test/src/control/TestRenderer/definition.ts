import type { ExecutionResult } from "../../data/ExecutionResult.js";
import type { TestAnnotationRenderer } from "../TestAnnotationRenderer.js";

export type TestRenderer = (results: Vector<ExecutionResult>, testAnnotationRenderer: TestAnnotationRenderer) => Vector<string>;
