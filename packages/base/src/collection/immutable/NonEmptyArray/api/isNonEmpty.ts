import type { NonEmptyArray } from "../definition";

/**
 * @tsplus fluent fncts.collection.immutable.Array isNonEmpty
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray isNonEmpty
 */
export function isNonEmpty<A>(self: ReadonlyArray<A>): self is NonEmptyArray<A> {
  return self.length > 0;
}
