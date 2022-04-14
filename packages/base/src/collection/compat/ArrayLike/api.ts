/**
 * @tsplus getter fncts.ArrayLike asSeq
 */
export function asSeq<A>(self: ArrayLike<A>): Seq<A> {
  if (Array.isArray(self)) {
    return self;
  }
  return Seq.make<A>(() => {
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
