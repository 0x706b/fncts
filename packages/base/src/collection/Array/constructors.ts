import { ReadonlyArray } from "./definition";

/**
 * @tsplus static fncts.collection.immutable.ArrayOps empty
 */
export function empty<A>(): ReadonlyArray<A> {
  return [];
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps makeBy
 */
export function makeBy<A>(n: number, f: (i: number) => A): ReadonlyArray<A> {
  const j   = Math.max(0, Math.floor(n));
  const out = [];
  for (let i = 0; i < j; i++) {
    out.push(f(i));
  }
  return out;
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps range
 */
export function range(start: number, end: number): ReadonlyArray<number> {
  return ReadonlyArray.makeBy(end - start + 1, (i) => start + i);
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps replicate
 */
export function replicate<A>(n: number, a: A): ReadonlyArray<A> {
  return ReadonlyArray.makeBy(n, () => a);
}
