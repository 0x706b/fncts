import type { Maybe } from "../../../data/Maybe";
import type { Array } from "../Array";
import type { MutableNonEmptyArray } from "./definition";

import { Just, Nothing } from "../../../data/Maybe";
import { NonEmptyArray } from "./definition";

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps allocWithHead
 */
export function allocWithHead<A>(
  head: A,
  length: number
): MutableNonEmptyArray<A> {
  const as = new globalThis.Array(length) as MutableNonEmptyArray<A>;
  as[0]    = head;
  return as;
}

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps fromArray
 * @tsplus getter fncts.collection.immutable.Array toNonEmptyArray
 */
export function fromArray<A>(self: Array<A>): Maybe<NonEmptyArray<A>> {
  return self.isNonEmpty() ? Just(self) : Nothing();
}

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps __call
 */
export function make<A>(...as: readonly [A, ...Array<A>]): NonEmptyArray<A> {
  return as;
}

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps makeBy
 */
export function makeBy<A>(n: number, f: (i: number) => A): NonEmptyArray<A> {
  const len = Math.max(0, Math.floor(n));
  const out = NonEmptyArray.allocWithHead(f(0), len);
  for (let i = 1; i < len; i++) {
    out.push(f(i));
  }
  return out;
}

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArray replicate
 */
export function replicate<A>(n: number, a: A): NonEmptyArray<A> {
  return NonEmptyArray.makeBy(n, () => a);
}

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps range
 */
export function range(start: number, end: number): NonEmptyArray<number> {
  return start <= end
    ? NonEmptyArray.makeBy(end - start + 1, (i) => start + i)
    : [start];
}
