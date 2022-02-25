import type { Array } from "../../Array/definition";

/**
 * @tsplus fluent fncts.collection.immutable.Array foldRightWithIndex
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray foldRightWithIndex
 */
export function foldRightWithIndex_<A, B>(self: Array<A>, b: B, f: (i: number, a: A, b: B) => B): B {
  let r = b;
  for (let i = self.length - 1; i >= 0; i--) {
    r = f(i, self[i]!, r);
  }
  return r;
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst foldRightWithIndex_
 */
export function foldRightWithIndex<A, B>(b: B, f: (i: number, a: A, b: B) => B) {
  return (self: Array<A>): B => foldRightWithIndex_(self, b, f);
}
// codegen:end
