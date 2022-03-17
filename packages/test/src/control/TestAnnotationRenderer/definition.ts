import type { TestAnnotation } from "../../data/TestAnnotation.js";
import type { TestAnnotationMap } from "../../data/TestAnnotationMap.js";
import type { Vector } from "@fncts/base/collection/immutable/Vector";
import type { Maybe } from "@fncts/base/data/Maybe";

import { _Nil, Cons, List } from "@fncts/base/collection/immutable/List";

export const enum TestAnnotationRendererTag {
  LeafRenderer = "LeafRenderer",
  CompositeRenderer = "CompositeRenderer",
}

export class LeafRenderer {
  readonly _tag = TestAnnotationRendererTag.LeafRenderer;
  constructor(
    readonly use: <X>(
      f: <V>(annotation: TestAnnotation<V>, render: (_: List<V>) => Maybe<string>) => X,
    ) => X,
  ) {}

  run(ancestors: List<TestAnnotationMap>, child: TestAnnotationMap): List<string> {
    return this.use((annotation, render) =>
      render(
        Cons(
          child.get(annotation),
          ancestors.map((map) => map.get(annotation)),
        ),
      ).match(
        () => List.empty(),
        (s) => Cons(s, _Nil),
      ),
    );
  }
}

export class CompositeRenderer {
  readonly _tag = TestAnnotationRendererTag.CompositeRenderer;
  constructor(readonly renderers: Vector<TestAnnotationRenderer>) {}

  run(ancestors: List<TestAnnotationMap>, child: TestAnnotationMap): List<string> {
    return this.renderers.toList.chain((renderer) => renderer.run(ancestors, child));
  }
}

/**
 * @tsplus type fncts.test.control.TestAnnotationRenderer
 */
export type TestAnnotationRenderer = LeafRenderer | CompositeRenderer;

/**
 * @tsplus type fncts.test.control.TestAnnotationRendererOps
 */
export interface TestAnnotationRendererOps {}

export const TestAnnotationRenderer: TestAnnotationRendererOps = {};
