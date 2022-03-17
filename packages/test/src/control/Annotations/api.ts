import type { TestAnnotation } from "../../data/TestAnnotation.js";
import type { Annotated } from "./definition.js";
import type { HashSet } from "@fncts/base/collection/immutable/HashSet";
import type { RuntimeFiber } from "@fncts/base/control/Fiber";
import type { URIO } from "@fncts/base/control/IO";
import type { Has } from "@fncts/base/prelude";

import { IO } from "@fncts/base/control/IO";

import { Annotations } from "./definition.js";

/**
 * @tsplus static fncts.test.control.AnnotationsOps annotate
 */
export function annotate<V>(key: TestAnnotation<V>, value: V): URIO<Has<Annotations>, void> {
  return IO.serviceWithIO(Annotations.Tag)((annotations) => annotations.annotate(key, value));
}

/**
 * @tsplus static fncts.test.control.AnnotationsOps get
 */
export function get<V>(key: TestAnnotation<V>): URIO<Has<Annotations>, V> {
  return IO.serviceWithIO(Annotations.Tag)((annotations) => annotations.get(key));
}

/**
 * @tsplus static fncts.test.control.AnnotationsOps withAnnotations
 */
export function withAnnotation<R, E, A>(
  io: IO<R, E, A>,
): IO<R & Has<Annotations>, Annotated<E>, Annotated<A>> {
  return IO.serviceWithIO(Annotations.Tag)((annotations) => annotations.withAnnotation(io));
}

/**
 * @tsplus static fncts.test.control.AnnotationsOps supervisedFibers
 */
export const supervisedFibers: URIO<
  Has<Annotations>,
  HashSet<RuntimeFiber<any, any>>
> = IO.serviceWithIO(Annotations.Tag)((annotations) => annotations.supervisedFibers);
