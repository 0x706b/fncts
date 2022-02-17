import type { MutableArray } from "./definition";

import { Array } from "./definition";

/**
 * @tsplus static fncts.collection.immutable.ArrayOps alloc
 */
export function alloc<A>(length: number): MutableArray<A> {
  return globalThis.Array(length);
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps emptyMutable
 */
export function emptyMutable<A>(): MutableArray<A> {
  return [];
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps empty
 */
export function empty<A>(): Array<A> {
  return [];
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps __call
 */
export function fromValues<A>(...values: Array<A>): Array<A> {
  return values;
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps from
 */
export function from<A>(iterable: Iterable<A>): Array<A>;
export function from<A>(array: ArrayLike<A>): Array<A>;
export function from<A>(_: Iterable<A> | ArrayLike<A>): Array<A> {
  return globalThis.Array.from(_);
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps makeBy
 */
export function makeBy<A>(n: number, f: (i: number) => A): Array<A> {
  const j   = Math.max(0, Math.floor(n));
  const out = [] as MutableArray<A>;
  for (let i = 0; i < j; i++) {
    out.push(f(i));
  }
  return out;
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps range
 */
export function range(start: number, end: number): Array<number> {
  return Array.makeBy(end - start + 1, (i) => start + i);
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps replicate
 */
export function replicate<A>(n: number, a: A): Array<A> {
  return Array.makeBy(n, () => a);
}
