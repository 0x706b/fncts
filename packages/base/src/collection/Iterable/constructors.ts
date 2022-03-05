import { Iterable } from "./definition";

/**
 * @tsplus static fncts.collection.immutable.IterableOps make
 */
export function mkIterable<A>(iterator: () => Iterator<A>): Iterable<A> {
  return {
    [Symbol.iterator]: iterator,
  };
}

/**
 * @tsplus static fncts.collection.immutable.IterableOps empty
 */
export function empty<A>(): Iterable<A> {
  return Iterable.make<A>(() => ({
    next() {
      return { done: true, value: undefined };
    },
  }));
}

/**
 * @tsplus static fncts.collection.immutable.IterableOps single
 */
export function single<A>(a: A): Iterable<A> {
  return Iterable.make<A>(() => {
    let done = false;
    return {
      next() {
        if (done) {
          return this.return!();
        }
        done = true;
        return { done: false, value: a };
      },
      return(value?: unknown) {
        if (!done) {
          done = true;
        }
        return { done: true, value };
      },
    };
  });
}

/**
 * @tsplus static fncts.collection.immutable.IterableOps makeBy
 */
export function makeBy<A>(n: number, f: (i: number) => A): Iterable<A> {
  return Iterable.make<A>(() => {
    let i    = 0;
    let done = false;
    return {
      next() {
        return !done && i < n ? { done, value: f(i++) } : this.return!();
      },
      return(value?: unknown) {
        if (!done) {
          done = true;
        }
        return { done: true, value };
      },
    };
  });
}

/**
 * @tsplus static fncts.collection.immutable.IterableOps range
 */
export function range(start: number, end: number): Iterable<number> {
  return makeBy(end - start + 1, (i) => start + i);
}
