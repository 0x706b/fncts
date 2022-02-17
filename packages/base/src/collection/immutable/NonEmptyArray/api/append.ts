import type { NonEmptyArray } from "../definition";

import { Array } from "../../Array/definition";

/**
 * @tsplus fluent fncts.collection.immutable.Array append
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray append
 */
export function append_<A, B>(self: Array<A>, last: B): NonEmptyArray<A | B>;
export function append_<A, B>(self: Array<A>, last: B): Array<A | B>;
export function append_<A, B>(self: Array<A>, last: B): NonEmptyArray<A | B> {
  const len = self.length;
  const r   = Array.alloc<A | B>(len + 1);
  r[len]    = last;
  for (let i = 0; i < len; i++) {
    r[i] = self[i]!;
  }
  return r as unknown as NonEmptyArray<A | B>;
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst append_
 */
export function append<B>(last: B): <A>(self: Array<A>) => NonEmptyArray<A | B>;
/**
 * @tsplus dataFirst append_
 */
export function append<B>(last: B): <A>(self: Array<A>) => Array<A | B>;
/**
 * @tsplus dataFirst append_
 */
export function append<B>(last: B) {
  return <A>(self: Array<A>): NonEmptyArray<A | B> => append_(self, last);
}
// codegen:end
