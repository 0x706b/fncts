export function allocWithHead<A>(
  head: A,
  length: number,
): Array<A> & {
  0: A;
} {
  const as = new Array(length);
  as[0]    = head;
  return as as Array<A> & {
    0: A;
  };
}

/**
 * @tsplus getter fncts.ReadonlyArray unsafeAsNonEmptyArray
 * @tsplus getter fncts.Array unsafeAsNonEmptyArray
 * @tsplus identity
 */
export function unsafeAsNonEmptyArray<A>(self: ReadonlyArray<A>): ReadonlyNonEmptyArray<A> {
  if (self.length === 0) {
    throw new IndexOutOfBoundsError("0 length Array supplied to Array#unsafeAsNonEmpty");
  }
  return self as unknown as ReadonlyNonEmptyArray<A>;
}

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps from
 */
export function from<A>(
  self: ReadonlyArray<A> & {
    readonly 0: A;
  },
): ReadonlyNonEmptyArray<A> {
  return self.unsafeAsNonEmptyArray;
}

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps fromArray
 * @tsplus getter fncts.ImmutableArray toNonEmptyArray
 */
export function fromArray<A>(self: ReadonlyArray<A>): Maybe<ReadonlyNonEmptyArray<A>> {
  return self.isNonEmpty() ? Just(self.unsafeAsNonEmptyArray) : Nothing();
}

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps __call
 */
export function make<A>(...values: NonEmptyArray<A>): ReadonlyNonEmptyArray<A> {
  return values.unsafeAsNonEmptyArray;
}

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps makeBy
 */
export function makeBy<A>(n: number, f: (i: number) => A): ReadonlyNonEmptyArray<A> {
  const len = Math.max(0, Math.floor(n));
  const out = allocWithHead(f(0), len);
  for (let i = 1; i < len; i++) {
    out[i] = f(i);
  }
  return out.unsafeAsNonEmptyArray;
}

/**
 * @tsplus static fncts.ReadonlyNonEmptyArray replicate
 */
export function replicate<A>(n: number, a: A): ReadonlyNonEmptyArray<A> {
  return ReadonlyNonEmptyArray.makeBy(n, () => a);
}

/**
 * @tsplus static fncts.ReadonlyNonEmptyArrayOps range
 */
export function range(start: number, end: number): ReadonlyNonEmptyArray<number> {
  return start <= end ? ReadonlyNonEmptyArray.makeBy(end - start + 1, (i) => start + i) : ReadonlyNonEmptyArray(start);
}
