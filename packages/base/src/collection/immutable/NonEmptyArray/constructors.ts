/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps allocWithHead
 */
export function allocWithHead<A>(head: A, length: number): NonEmptyArray<A> {
  const as = new globalThis.Array(length) as NonEmptyArray<A>;
  as[0]    = head;
  return as;
}

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps fromArray
 * @tsplus getter fncts.collection.immutable.Array toNonEmptyArray
 */
export function fromArray<A>(self: ReadonlyArray<A>): Maybe<ReadonlyNonEmptyArray<A>> {
  return self.isNonEmpty() ? Just(self) : Nothing();
}

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps __call
 */
export function make<A>(...as: readonly [A, ...Array<A>]): ReadonlyNonEmptyArray<A> {
  return as;
}

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps makeBy
 */
export function makeBy<A>(n: number, f: (i: number) => A): ReadonlyNonEmptyArray<A> {
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
export function replicate<A>(n: number, a: A): ReadonlyNonEmptyArray<A> {
  return NonEmptyArray.makeBy(n, () => a);
}

/**
 * @tsplus static fncts.collection.immutable.NonEmptyArrayOps range
 */
export function range(start: number, end: number): ReadonlyNonEmptyArray<number> {
  return start <= end ? NonEmptyArray.makeBy(end - start + 1, (i) => start + i) : [start];
}
