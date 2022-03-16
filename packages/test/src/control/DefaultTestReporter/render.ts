import type { ExecutedSpec } from "../../data/ExecutedSpec.js";
import type { TestAnnotationRenderer } from "../TestAnnotationRenderer.js";
import type { URIO } from "@fncts/base/control/IO";
import type { Has } from "@fncts/base/prelude";

export type TestReporter<E> = (
  duration: number,
  spec: ExecutedSpec<E>,
) => URIO<Has<TestLogger>, void>;

export function report<E>(testAnnotationRenderer: TestAnnotationRenderer): TestReporter<E>;
