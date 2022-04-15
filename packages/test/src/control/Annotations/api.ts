import type { TestAnnotation } from "../../data/TestAnnotation.js";
import type { Annotated } from "./definition.js";

import { Annotations } from "./definition.js";

/**
 * @tsplus static fncts.test.control.AnnotationsOps annotate
 */
export function annotate<V>(key: TestAnnotation<V>, value: V): URIO<Has<Annotations>, void> {
  return IO.serviceWithIO((annotations) => annotations.annotate(key, value), Annotations.Tag);
}

/**
 * @tsplus static fncts.test.control.AnnotationsOps get
 */
export function get<V>(key: TestAnnotation<V>): URIO<Has<Annotations>, V> {
  return IO.serviceWithIO((annotations) => annotations.get(key), Annotations.Tag);
}

/**
 * @tsplus static fncts.test.control.AnnotationsOps withAnnotations
 */
export function withAnnotation<R, E, A>(io: IO<R, E, A>): IO<R & Has<Annotations>, Annotated<E>, Annotated<A>> {
  return IO.serviceWithIO((annotations) => annotations.withAnnotation(io), Annotations.Tag);
}

/**
 * @tsplus static fncts.test.control.AnnotationsOps supervisedFibers
 */
export const supervisedFibers: URIO<Has<Annotations>, HashSet<Fiber.Runtime<any, any>>> = IO.serviceWithIO(
  (annotations) => annotations.supervisedFibers,
  Annotations.Tag,
);
