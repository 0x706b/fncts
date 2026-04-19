import { isPromiseLike } from "@fncts/base/data/Equatable";
import { isPromise } from "@fncts/base/util/predicates";

/**
 * Create an `AsyncIterable` from an async iterator factory.
 *
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
 * Lift a synchronous iterable into an `AsyncIterable`.
 *
 * @tsplus static fncts.AsyncIterableOps from
 */
export function from<A>(iterable: Iterable<A>): AsyncIterable<A> {
  return AsyncIterable((): AsyncIterator<A> => {
    let done = false;
    const ia = iterable[Symbol.iterator]();
    let value: IteratorResult<A>;
    return {
      next() {
        if (done) {
          return this.return!();
        }
        value = ia.next();
        if (value.done) {
          this.return!();
        }
        return Promise.resolve(value);
      },
      return() {
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
}

/**
 * Create an `AsyncIterable` from a list of values.
 *
 * @tsplus static fncts.AsyncIterableOps fromValues
 */
export function fromValues<A extends ReadonlyArray<any>>(...values: A): AsyncIterable<A[number]> {
  return AsyncIterable.from(values);
}

/**
 * Map with index and discard `Nothing` results.
 *
 * @tsplus pipeable fncts.AsyncIterable filterMapWithIndex
 */
export function filterMapWithIndex<A, B>(f: (index: number, a: A) => Maybe<B>) {
  return (self: AsyncIterable<A>): AsyncIterable<B> => {
    return AsyncIterable<B>(() => {
      let done       = false;
      let i          = -1;
      const iterator = self[Symbol.asyncIterator]();
      let lastValue: B;

      /**
       * Pull the next matching value from the source iterator.
       */
      function getNextValue(): Promise<IteratorResult<B>> {
        i++;
        return iterator.next().then((result) => {
          if (result.done) {
            return iteratorReturn();
          }

          const value = f(i, result.value);

          return value.match(
            () => getNextValue(),
            (b) => {
              lastValue = b;
              return { done: false, value: b };
            },
          );
        });
      }

      /**
       * Close iteration and return the final iterator result.
       */
      function iteratorReturn() {
        if (!done) {
          done = true;
          if (typeof iterator.return === "function") {
            iterator.return();
          }
        }

        return Promise.resolve({ done: true, value: lastValue });
      }

      return {
        async next() {
          if (done) {
            return this.return!();
          }

          return getNextValue();
        },
        return: iteratorReturn,
      };
    });
  };
}

/**
 * Filter values using an index-aware predicate.
 *
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
    return AsyncIterable<A>(() => {
      let done       = false;
      let i          = -1;
      const iterator = self[Symbol.asyncIterator]();
      let lastValue: A;

      /**
       * Pull the next value that satisfies the predicate.
       */
      function getNextValue(value: any): Promise<IteratorResult<A>> {
        i++;
        return iterator.next(value).then((result) => {
          if (result.done) {
            return iteratorReturn(value);
          }

          if (predicate(i, result.value)) {
            lastValue = result.value;
            return { done: false, value: result.value };
          } else {
            return getNextValue(value);
          }
        });
      }

      /**
       * Close iteration and propagate the optional return value.
       */
      function iteratorReturn(value: any) {
        if (!done) {
          done = true;
          if (typeof iterator.return === "function") {
            iterator.return(value);
          }
        }

        return Promise.resolve({ done, value: lastValue });
      }

      return {
        async next(value) {
          if (done) {
            return this.return!(value);
          }

          return getNextValue(value);
        },
        return: iteratorReturn,
      };
    });
  };
}

/**
 * Filter values using a predicate.
 *
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
 * Map values with access to their index.
 *
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
 * Map values.
 *
 * @tsplus pipeable fncts.AsyncIterable map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: AsyncIterable<A>): AsyncIterable<B> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * Map values with index using an async mapping function.
 *
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
 * Map values using an async mapping function.
 *
 * @tsplus pipeable fncts.AsyncIterable mapPromise
 */
export function mapPromise<A, B>(f: (a: A) => Promise<B>) {
  return (self: AsyncIterable<A>): AsyncIterable<B> => {
    return self.mapPromiseWithIndex((_, a) => f(a));
  };
}

/**
 * Zip two async iterables with a synchronous combining function.
 *
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

          return Promise.all([ia.next(), ib.next()]).then(([va, vb]) => {
            return va.done || vb.done ? this.return!() : { done: false, value: f(va.value, vb.value) };
          });
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
 * Zip two async iterables with an async combining function.
 *
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

/**
 * Left-fold values with index, allowing async accumulation.
 *
 * @tsplus pipeable fncts.AsyncIterable foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B | PromiseLike<B>) {
  return (self: AsyncIterable<A>): Promise<B> => {
    let res        = b;
    let i          = -1;
    const iterator = self[Symbol.asyncIterator]();

    /**
     * Recursively pull elements and update the accumulator.
     */
    function pull(): Promise<B> {
      return iterator.next().then((result) => {
        i++;
        if (result.done) {
          return res;
        } else {
          const r = f(i, res, result.value);

          if (isObject(r) && typeof r.then === "function") {
            return r.then((b) => {
              res = b;
              return pull();
            });
          } else {
            res = r as B;
            return pull();
          }
        }
      });
    }

    return pull();
  };
}
