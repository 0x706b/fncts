import type { Array } from "../../Array/definition";

/**
 * @tsplus fluent fncts.collection.immutable.Array isOutOfBound
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray isOutOfBound
 */
export function isOutOfBound_<A>(self: Array<A>, i: number): boolean {
  return i < 0 || i >= self.length;
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst isOutOfBound_
 */
export function isOutOfBound(i: number) {
  return <A>(self: Array<A>): boolean => isOutOfBound_(self, i);
}
// codegen:end
