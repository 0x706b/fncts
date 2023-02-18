import type { TestAnnotation } from "../../data/TestAnnotation.js";
import type { TestAnnotationMap } from "../../data/TestAnnotationMap.js";

export const AnnotationsTypeId = Symbol.for("fncts.test.Annotations");
export type AnnotationsTypeId = typeof AnnotationsTypeId;

export type Annotated<A> = readonly [A, TestAnnotationMap];

/**
 * @tsplus type fncts.test.Annotations
 * @tsplus companion fncts.test.AnnotationsOps
 */
export abstract class Annotations {
  readonly [AnnotationsTypeId]: AnnotationsTypeId = AnnotationsTypeId;
  abstract annotate<V>(key: TestAnnotation<V>, value: V): UIO<void>;
  abstract get<V>(key: TestAnnotation<V>): UIO<V>;
  abstract withAnnotation<R, E, A>(io: IO<R, E, A>): IO<R, Annotated<E>, Annotated<A>>;
  abstract readonly supervisedFibers: UIO<HashSet<Fiber.Runtime<any, any>>>;
}

/**
 * @tsplus static fncts.test.AnnotationsOps Tag
 */
export const AnnotationsTag = Tag<Annotations>("fncts.test.Annotations");
