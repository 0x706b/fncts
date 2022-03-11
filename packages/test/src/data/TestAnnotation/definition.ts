import type { Tag } from "@fncts/base/data/Tag";

import { Equatable, Hashable } from "@fncts/base/prelude";
import { hasTypeId } from "@fncts/base/util/predicates";

export const TestAnnotationTypeId = Symbol.for("fncts.data.TestAnnotation");
export type TestAnnotationTypeId = typeof TestAnnotationTypeId;

/**
 * @tsplus type fncts.data.TestAnnotation
 * @tsplus companion fncts.data.TestAnnotationOps
 */
export class TestAnnotation<V> implements Hashable, Equatable {
  readonly _typeId: TestAnnotationTypeId = TestAnnotationTypeId;
  readonly _V!: () => V;

  constructor(
    readonly tag: Tag<V>,
    readonly identifier: string,
    readonly initial: V,
    readonly combine: (v1: V, v2: V) => V,
  ) {}

  get [Symbol.hashable]() {
    return Hashable.combineHash(Hashable.hashString(this.identifier), Hashable.hash(this.tag));
  }

  [Symbol.equatable](that: unknown) {
    return (
      isTestAnnotation(that) &&
      this.tag.key === that.tag.key &&
      this.identifier === that.identifier &&
      Equatable.strictEquals(this.initial, that.initial)
    );
  }
}

export function isTestAnnotation(u: unknown): u is TestAnnotation<unknown> {
  return hasTypeId(u, TestAnnotationTypeId);
}
