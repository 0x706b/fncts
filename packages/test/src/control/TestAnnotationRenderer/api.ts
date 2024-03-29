import type { TestAnnotationRenderer } from "./definition.js";

import { TestAnnotation } from "../../data/TestAnnotation.js";
import { LeafRenderer } from "./definition.js";
import { CompositeRenderer, TestAnnotationRendererTag } from "./definition.js";

/**
 * @tsplus pipeable fncts.test.TestAnnotationRenderer combine
 * @tsplus pipeable-operator fncts.test.TestAnnotationRenderer +
 */
export function combine(that: TestAnnotationRenderer) {
  return (self: TestAnnotationRenderer): TestAnnotationRenderer => {
    if (
      self._tag === TestAnnotationRendererTag.CompositeRenderer &&
      that._tag === TestAnnotationRendererTag.CompositeRenderer
    ) {
      return new CompositeRenderer(self.renderers.concat(that.renderers));
    } else if (self._tag === TestAnnotationRendererTag.CompositeRenderer) {
      return new CompositeRenderer(self.renderers.append(that));
    } else if (that._tag === TestAnnotationRendererTag.CompositeRenderer) {
      return new CompositeRenderer(that.renderers.prepend(self));
    } else {
      return new CompositeRenderer(Vector(self, that));
    }
  };
}

/**
 * @tsplus static fncts.test.TestAnnotationRendererOps Ignored
 */
export const ignored: TestAnnotationRenderer = new LeafRenderer((f) =>
  f(TestAnnotation.Ignored, (children) => children.head.flatMap((n) => (n === 0 ? Nothing() : Just(`ignored: ${n}`)))),
);

/**
 * @tsplus static fncts.test.TestAnnotationRendererOps Repeated
 */
export const repeated: TestAnnotationRenderer = new LeafRenderer((f) =>
  f(TestAnnotation.Repeated, (children) =>
    children.head.flatMap((n) => (n === 0 ? Nothing() : Just(`repeated: ${n}`))),
  ),
);

/**
 * @tsplus static fncts.test.TestAnnotationRendererOps Retried
 */
export const retried: TestAnnotationRenderer = new LeafRenderer((f) =>
  f(TestAnnotation.Repeated, (children) => children.head.flatMap((n) => (n === 0 ? Nothing() : Just(`retried: ${n}`)))),
);

/**
 * @tsplus static fncts.test.TestAnnotationRendererOps Tagged
 */
export const tagged: TestAnnotationRenderer = new LeafRenderer((f) =>
  f(TestAnnotation.Tagged, (children) =>
    children.head.flatMap((child) =>
      child.size === 0 ? Nothing() : Just(`tagged: ${child.map((s) => s.surround('"')).join(", ")}`),
    ),
  ),
);

/**
 * @tsplus static fncts.test.TestAnnotationRendererOps Timed
 */
export const timed: TestAnnotationRenderer = new LeafRenderer((f) =>
  f(TestAnnotation.Timing, (children) => children.head.flatMap((n) => (n === 0 ? Nothing() : Just(`${n}ms`)))),
);

/**
 * @tsplus static fncts.test.TestAnnotationRendererOps Silent
 */
export const silent: TestAnnotationRenderer = new CompositeRenderer(Vector.empty());

/**
 * @tsplus static fncts.test.TestAnnotationRendererOps Default
 */
export const Default: TestAnnotationRenderer = new CompositeRenderer(Vector(ignored, repeated, retried, tagged, timed));
