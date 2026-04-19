/**
 * Returns an empty array.
 *
 * @tsplus static fncts.ArrayOps empty
 */
export function empty<A = never>(): ReadonlyArray<A> {
  return [];
}

/**
 * Builds an array of length `n` by mapping each index.
 *
 * @tsplus static fncts.ArrayOps makeBy
 */
export function makeBy<A>(n: number, f: (i: number) => A): ReadonlyArray<A> {
  const j   = Math.max(0, Math.floor(n));
  const out = Array(n);
  for (let i = 0; i < j; i++) {
    out[i] = f(i);
  }
  return out;
}

/**
 * Builds an inclusive range from `start` to `end`.
 *
 * @tsplus static fncts.ArrayOps range
 */
export function range(start: number, end: number): ReadonlyArray<number> {
  return Array.makeBy(end - start + 1, (i) => start + i);
}

/**
 * Builds an array of length `n` filled with `a`.
 *
 * @tsplus static fncts.ArrayOps replicate
 */
export function replicate<A>(n: number, a: A): ReadonlyArray<A> {
  return Array.makeBy(n, () => a);
}

/**
 * Builds an array from the provided values.
 *
 * @tsplus static fncts.ArrayOps __call
 */
export function make<A>(...values: ReadonlyArray<A>): ReadonlyArray<A> {
  return values;
}

/**
 * Treats a mutable array as readonly without copying.
 *
 * @tsplus getter fncts.Array asReadonlyArray
 *
 * @tsplus macro identity
 */
export function asReadonlyArray<A>(self: Array<A>): ReadonlyArray<A> {
  return self;
}
