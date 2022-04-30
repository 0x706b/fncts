/**
 * @tsplus getter fncts.ArrayLike asIterable
 */
export function asIterable<A>(self: ArrayLike<A>): Iterable<A> {
  if (Array.isArray(self)) {
    return self;
  }
  return Iterable.make<A>(() => {
    let done = false;
    let i    = 0;
    return {
      next() {
        if (i >= self.length || done) {
          return this.return!();
        }
        return { value: self[i++]!, done: false };
      },
      return(value?: unknown) {
        if (!done) {
          done = true;
        }
        return { done, value };
      },
    };
  });
}
