import type { TestAnnotation } from "../../data/TestAnnotation.js";
import type { TestAnnotationMap } from "../../data/TestAnnotationMap.js";
import type { HashSet } from "@fncts/base/collection/immutable/HashSet";
import type { RuntimeFiber } from "@fncts/base/control/Fiber";
import type { IO, UIO } from "@fncts/base/control/IO";

import { Tag } from "@fncts/base/data/Tag";

export type Annotated<A> = readonly [A, TestAnnotationMap];

/**
 * @tsplus type fncts.test.control.Annotations
 * @tsplus companion fncts.test.control.AnnotationsOps
 */
export abstract class Annotations {
  abstract annotate<V>(key: TestAnnotation<V>, value: V): UIO<void>;
  abstract get<V>(key: TestAnnotation<V>): UIO<V>;
  abstract withAnnotation<R, E, A>(io: IO<R, E, A>): IO<R, Annotated<E>, Annotated<A>>;
  abstract readonly supervisedFibers: UIO<HashSet<RuntimeFiber<any, any>>>;
}

/**
 * @tsplus static fncts.test.control.AnnotationsOps Tag
 */
export const AnnotationsTag = Tag<Annotations>();
