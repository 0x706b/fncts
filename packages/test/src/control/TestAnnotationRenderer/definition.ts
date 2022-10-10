import type { TestAnnotation } from "../../data/TestAnnotation.js";
import type { TestAnnotationMap } from "../../data/TestAnnotationMap.js";

export const enum TestAnnotationRendererTag {
  LeafRenderer = "LeafRenderer",
  CompositeRenderer = "CompositeRenderer",
}

export class LeafRenderer {
  readonly _tag = TestAnnotationRendererTag.LeafRenderer;
  constructor(
    readonly use: <X>(f: <V>(annotation: TestAnnotation<V>, render: (_: List<V>) => Maybe<string>) => X) => X,
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
        (s) => Cons(s, Nil()),
      ),
    );
  }
}

export class CompositeRenderer {
  readonly _tag = TestAnnotationRendererTag.CompositeRenderer;
  constructor(readonly renderers: Vector<TestAnnotationRenderer>) {}
  run(ancestors: List<TestAnnotationMap>, child: TestAnnotationMap): List<string> {
    return this.renderers.toList.flatMap((renderer) => renderer.run(ancestors, child));
  }
}

/**
 * @tsplus type fncts.test.TestAnnotationRenderer
 */
export type TestAnnotationRenderer = LeafRenderer | CompositeRenderer;

/**
 * @tsplus type fncts.test.TestAnnotationRendererOps
 */
export interface TestAnnotationRendererOps {}

export const TestAnnotationRenderer: TestAnnotationRendererOps = {};
