import type { NonEmptyArray } from "../definition";

import { Array } from "../../Array/definition";

/**
 * @tsplus fluent fncts.collection.immutable.Array prepend
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray prepend
 */
export function prepend_<A, B>(self: Array<A>, head: B): NonEmptyArray<A | B>;
export function prepend_<A, B>(self: Array<A>, head: B): Array<A | B>;
export function prepend_<A, B>(self: Array<A>, head: B): NonEmptyArray<A | B> {
  const len = self.length;
  const out = Array.alloc<A | B>(len + 1);
  out[0]    = head;
  for (let i = 0; i < len; i++) {
    out[i + 1] = self[i]!;
  }
  return out as unknown as NonEmptyArray<A | B>;
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst prepend_
 */
export function prepend<B>(head: B): <A>(self: Array<A>) => NonEmptyArray<A | B>;
/**
 * @tsplus dataFirst prepend_
 */
export function prepend<B>(head: B): <A>(self: Array<A>) => Array<A | B>;
/**
 * @tsplus dataFirst prepend_
 */
export function prepend<B>(head: B) {
  return <A>(self: Array<A>): NonEmptyArray<A | B> => prepend_(self, head);
}
// codegen:end
