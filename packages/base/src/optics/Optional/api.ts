import type { Optional } from "@fncts/base/optics/Optional/definition";

import { Index } from "@fncts/base/optics/Index";

/**
 * @tsplus static fncts.optics.OptionalOps index
 */
export function index<A>(index: number): Optional<ReadonlyArray<A>, A> {
  return Index.array<A>().index(index);
}
