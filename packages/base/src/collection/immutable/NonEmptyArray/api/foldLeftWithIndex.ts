import type { Array } from "../../Array/definition";

/**
 * @tsplus fluent fncts.collection.immutable.Array foldLeftWithIndex
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(
  self: Array<A>,
  b: B,
  f: (i: number, b: B, a: A) => B
): B {
  const len = self.length;
  let r     = b;
  for (let i = 0; i < len; i++) {
    r = f(i, r, self[i]!);
  }
  return r;
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst foldLeftWithIndex_
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: Array<A>): B => foldLeftWithIndex_(self, b, f);
}
// codegen:end
