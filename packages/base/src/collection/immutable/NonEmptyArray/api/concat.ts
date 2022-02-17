import type { NonEmptyArray } from "../definition";

import { Array } from "../../Array/definition";

/**
 * @tsplus fluent fncts.collection.immutable.Array concat
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray concat
 */
export function concat_<A, B>(
  self: Array<A>,
  that: NonEmptyArray<B>
): NonEmptyArray<A | B>;
export function concat_<A, B>(
  self: NonEmptyArray<A>,
  that: Array<B>
): NonEmptyArray<A | B>;
export function concat_<A, B>(self: Array<A>, that: Array<B>): Array<A | B>;
export function concat_<A, B>(self: Array<A>, that: Array<B>): Array<A | B> {
  const lenx = self.length;
  if (lenx === 0) {
    return that;
  }
  const leny = that.length;
  if (leny === 0) {
    return self;
  }
  const r = Array.alloc<A | B>(lenx + leny);
  for (let i = 0; i < lenx; i++) {
    r[i] = self[i]!;
  }
  for (let i = 0; i < leny; i++) {
    r[i + lenx] = that[i]!;
  }
  return r;
}

/**
 * @tsplus dataFirst concat_
 */
export function concat<B>(
  ys: NonEmptyArray<B>
): <A>(xs: ReadonlyArray<A>) => NonEmptyArray<A | B>;
export function concat<B>(ys: ReadonlyArray<B>): {
  <A>(xs: NonEmptyArray<A>): NonEmptyArray<A | B>;
  <A>(xs: ReadonlyArray<A>): ReadonlyArray<A | B>;
};
export function concat<B>(
  ys: ReadonlyArray<B>
): <A>(xs: ReadonlyArray<A>) => ReadonlyArray<A | B> {
  return (xs) => xs.concat(ys);
}
