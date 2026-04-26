import type { Optional } from "@fncts/base/optics/Optional/definition";

import { Index } from "@fncts/base/optics/Index/definition";

/**
 * Creates an `Optional` that focuses on an array element at the given index.
 *
 * @tsplus static fncts.optics.OptionalOps index
 */
export function index<A>(index: number): Optional<ReadonlyArray<A>, A> {
  return Index.array<A>().index(index);
}
