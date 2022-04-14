export function allocWithHead<A>(head: A, length: number): Array<A> & { 0: A } {
  const as = new Array(length);
  as[0]    = head;
  return as as Array<A> & { 0: A };
}

/**
 * @tsplus getter fncts.base.ReadonlyArray unsafeAsNonEmptyArray
 * @tsplus getter fncts.base.Array unsafeAsNonEmptyArray
 */
export function unsafeAsNonEmptyArray<A>(self: ReadonlyArray<A>): ImmutableNonEmptyArray<A> {
  if (self.length === 0) {
    throw new IndexOutOfBoundsError("0 length Array supplied to Array#unsafeAsNonEmpty");
  }
  return new ImmutableNonEmptyArray(self as ReadonlyArray<A> & { readonly 0: A });
}

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps from
 */
export function from<A>(self: ReadonlyArray<A> & { readonly 0: A }): ImmutableNonEmptyArray<A> {
  return new ImmutableNonEmptyArray(self);
}

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps fromArray
 * @tsplus getter fncts.ImmutableArray toNonEmptyArray
 */
export function fromArray<A>(self: ImmutableArray<A>): Maybe<ImmutableNonEmptyArray<A>> {
  return self.isNonEmpty() ? Just(self) : Nothing();
}

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps __call
 */
export function make<A>(...values: NonEmptyArray<A>): ImmutableNonEmptyArray<A> {
  return new ImmutableNonEmptyArray(values);
}

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps makeBy
 */
export function makeBy<A>(n: number, f: (i: number) => A): ImmutableNonEmptyArray<A> {
  const len = Math.max(0, Math.floor(n));
  const out = allocWithHead(f(0), len);
  for (let i = 1; i < len; i++) {
    out.push(f(i));
  }
  return new ImmutableNonEmptyArray(out);
}

/**
 * @tsplus static fncts.ImmutableNonEmptyArray replicate
 */
export function replicate<A>(n: number, a: A): ImmutableNonEmptyArray<A> {
  return ImmutableNonEmptyArray.makeBy(n, () => a);
}

/**
 * @tsplus static fncts.ImmutableNonEmptyArrayOps range
 */
export function range(start: number, end: number): ImmutableNonEmptyArray<number> {
  return start <= end
    ? ImmutableNonEmptyArray.makeBy(end - start + 1, (i) => start + i)
    : ImmutableNonEmptyArray(start);
}
