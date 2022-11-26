export const TestAnnotationVariance = Symbol.for("fncts.test.TestAnnotation.Variance");
export type TestAnnotationVariance = typeof TestAnnotationVariance;

export const TestAnnotationTypeId = Symbol.for("fncts.test.TestAnnotation");
export type TestAnnotationTypeId = typeof TestAnnotationTypeId;

/**
 * @tsplus type fncts.test.TestAnnotation
 * @tsplus companion fncts.test.TestAnnotationOps
 */
export class TestAnnotation<V> implements Hashable, Equatable {
  readonly [TestAnnotationTypeId]: TestAnnotationTypeId = TestAnnotationTypeId;
  declare [TestAnnotationVariance]: {
    readonly _V: (_: never) => V;
  };
  constructor(
    readonly tag: Tag<V>,
    readonly identifier: string,
    readonly initial: V,
    readonly combine: (v1: V, v2: V) => V,
  ) {}
  get [Symbol.hash]() {
    return Hashable.combine(Hashable.string(this.identifier), Hashable.unknown(this.tag));
  }
  [Symbol.equals](that: unknown) {
    return (
      isTestAnnotation(that) &&
      Equatable.strictEquals(this.tag, that.tag) &&
      this.identifier === that.identifier &&
      Equatable.strictEquals(this.initial, that.initial)
    );
  }
}

export function isTestAnnotation(u: unknown): u is TestAnnotation<unknown> {
  return isObject(u) && TestAnnotationTypeId in u;
}
