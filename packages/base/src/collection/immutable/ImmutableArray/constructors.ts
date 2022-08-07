/**
 * @tsplus getter fncts.ReadonlyArray asImmutableArray
 * @tsplus getter fncts.Array asImmutableArray
 */
export function asImmutableArray<A>(self: ReadonlyArray<A>): ImmutableArray<A> {
  return new ImmutableArray(self);
}

/**
 * @tsplus static fncts.ImmutableArrayOps empty
 */
export function empty<A = never>(): ImmutableArray<A> {
  return new ImmutableArray([]);
}

/**
 * @tsplus static fncts.ImmutableArrayOps makeBy
 */
export function makeBy<A>(n: number, f: (i: number) => A): ImmutableArray<A> {
  const j   = Math.max(0, Math.floor(n));
  const out = [];
  for (let i = 0; i < j; i++) {
    out.push(f(i));
  }
  return out.asImmutableArray;
}

/**
 * @tsplus static fncts.ImmutableArrayOps range
 */
export function range(start: number, end: number): ImmutableArray<number> {
  return ImmutableArray.makeBy(end - start + 1, (i) => start + i);
}

/**
 * @tsplus static fncts.ImmutableArrayOps replicate
 */
export function replicate<A>(n: number, a: A): ImmutableArray<A> {
  return ImmutableArray.makeBy(n, () => a);
}

/**
 * @tsplus static fncts.ImmutableArrayOps __call
 */
export function make<A>(...values: ReadonlyArray<A>): ImmutableArray<A> {
  return new ImmutableArray(values);
}
