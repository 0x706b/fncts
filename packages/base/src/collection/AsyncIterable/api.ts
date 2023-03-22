/**
 * @tsplus static fncts.AsyncIterableOps __call
 */
export function asyncIterable<A>(iterator: Lazy<AsyncIterator<A>>): AsyncIterable<A> {
  return {
    [Symbol.asyncIterator]() {
      return iterator();
    },
  };
}

/**
 * @tsplus static fncts.AsyncIterableOps from
 */
export function from<A>(iterable: Iterable<A>): AsyncIterable<A> {
  return AsyncIterable(async function* () {
    for (const value of iterable) {
      yield value;
    }
  });
}

/**
 * @tsplus static fncts.AsyncIterableOps fromValues
 */
export function fromValues<A extends ReadonlyArray<any>>(...values: A): AsyncIterable<A[number]> {
  return AsyncIterable.from(values);
}

/**
 * @tsplus pipeable fncts.AsyncIterable filterWithIndex
 */
export function filterWithIndex<A, B extends A>(
  refinement: RefinementWithIndex<number, A, B>,
): (self: AsyncIterable<A>) => AsyncIterable<B>;
export function filterWithIndex<A>(
  predicate: PredicateWithIndex<number, A>,
): (self: AsyncIterable<A>) => AsyncIterable<A>;
export function filterWithIndex<A>(predicate: PredicateWithIndex<number, A>) {
  return (self: AsyncIterable<A>): AsyncIterable<A> => {
    return AsyncIterable<A>(async function* () {
      let i          = -1;
      const iterator = self[Symbol.asyncIterator]();
      while (true) {
        const result = await iterator.next();
        if (result.done) {
          break;
        }
        i++;
        if (predicate(i, result.value)) {
          yield result.value;
        }
      }
    });
  };
}

/**
 * @tsplus pipeable fncts.AsyncIterable filter
 */
export function filter<A, B extends A>(refinement: Refinement<A, B>): (self: AsyncIterable<A>) => AsyncIterable<B>;
export function filter<A>(predicate: Predicate<A>): (self: AsyncIterable<A>) => AsyncIterable<A>;
export function filter<A>(predicate: Predicate<A>) {
  return (self: AsyncIterable<A>): AsyncIterable<A> => {
    return self.filterWithIndex((_, a) => predicate(a));
  };
}

/**
 * @tsplus pipeable fncts.AsyncIterable mapWithIndex
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: AsyncIterable<A>): AsyncIterable<B> => {
    return AsyncIterable<B>(() => {
      let done = false;
      let n    = 0;
      const ia = self[Symbol.asyncIterator]();
      return {
        async next() {
          if (done) {
            return this.return!();
          }
          return ia.next().then((result) => {
            if (result.done) {
              return this.return!();
            }
            return { done: false, value: f(n++, result.value) };
          });
        },
        return(value?: unknown) {
          if (!done) {
            done = true;
            if (typeof ia.return === "function") {
              ia.return(value);
            }
          }
          return Promise.resolve({ done: true, value });
        },
      };
    });
  };
}

/**
 * @tsplus pipeable fncts.AsyncIterable map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: AsyncIterable<A>): AsyncIterable<B> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.AsyncIterable mapPromiseWithIndex
 */
export function mapPromiseWithIndex<A, B>(f: (i: number, a: A) => Promise<B>) {
  return (self: AsyncIterable<A>): AsyncIterable<B> => {
    return AsyncIterable<B>(() => {
      let done = false;
      let n    = 0;
      const ia = self[Symbol.asyncIterator]();
      return {
        async next() {
          if (done) {
            return this.return!();
          }
          return ia.next().then((result) => {
            if (result.done) {
              return this.return!();
            }
            return f(n++, result.value).then((value) => ({ done: false, value }));
          });
        },
        return(value?: unknown) {
          if (!done) {
            done = true;
            if (typeof ia.return === "function") {
              ia.return();
            }
          }
          return Promise.resolve({ done: true, value });
        },
      };
    });
  };
}

/**
 * @tsplus pipeable fncts.AsyncIterable mapPromise
 */
export function mapPromise<A, B>(f: (a: A) => Promise<B>) {
  return (self: AsyncIterable<A>): AsyncIterable<B> => {
    return self.mapPromiseWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.AsyncIterable zipWith
 */
export function zipWith<A, B, C>(that: AsyncIterable<B>, f: (a: A, b: B) => C) {
  return (self: AsyncIterable<A>): AsyncIterable<C> => {
    return AsyncIterable<C>(() => {
      let done = false;
      const ia = self[Symbol.asyncIterator]();
      const ib = that[Symbol.asyncIterator]();
      return {
        async next() {
          if (done) {
            return this.return!();
          }

          const [va, vb] = await Promise.all([ia.next(), ib.next()]);
          return va.done || vb.done ? this.return!() : { done: false, value: f(va.value, vb.value) };
        },
        return(value?: unknown) {
          if (!done) {
            done = true;
            if (typeof ia.return === "function") {
              ia.return();
            }
            if (typeof ib.return === "function") {
              ib.return();
            }
          }
          return Promise.resolve({ done: true, value });
        },
      };
    });
  };
}

/**
 * @tsplus pipeable fncts.AsyncIterable zipWithPromise
 */
export function zipWithPromise<A, B, C>(that: AsyncIterable<B>, f: (a: A, b: B) => Promise<C>) {
  return (self: AsyncIterable<A>): AsyncIterable<C> => {
    return AsyncIterable<C>(() => {
      let done = false;
      const ia = self[Symbol.asyncIterator]();
      const ib = that[Symbol.asyncIterator]();
      return {
        async next() {
          if (done) {
            return this.return!();
          }

          const [va, vb] = await Promise.all([ia.next(), ib.next()]);
          return va.done || vb.done ? this.return!() : { done: false, value: await f(va.value, vb.value) };
        },
        return(value?: unknown) {
          if (!done) {
            done = true;
            if (typeof ia.return === "function") {
              ia.return();
            }
            if (typeof ib.return === "function") {
              ib.return();
            }
          }
          return Promise.resolve({ done: true, value });
        },
      };
    });
  };
}
