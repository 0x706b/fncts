import type * as P from "@fncts/base/typeclass";

import { Iterable } from "@fncts/base/collection/Iterable/definition";
import { tuple } from "@fncts/base/data/function";

/**
 * @tsplus fluent fncts.Iterable ap
 */
export function ap_<A, B>(self: Iterable<(a: A) => B>, fa: Iterable<A>): Iterable<B> {
  return self.flatMap((f) => fa.map(f));
}

/**
 * @tsplus fluent fncts.Iterable append
 */
export function append_<A, B>(self: Iterable<A>, b: B): Iterable<A | B> {
  return Iterable.make<A | B>(() => {
    let done = false;
    const ia = self[Symbol.iterator]();
    let va: IteratorResult<A>;
    return {
      next() {
        if (done) {
          return this.return!();
        }
        va = ia.next();
        if (va.done) {
          done = true;
          return { done: false, value: b };
        }
        return { done, value: va.value };
      },
      return(value?: unknown) {
        done = true;
        if (!done) {
          done = true;
        }
        if (typeof ia.return === "function") {
          ia.return();
        }
        return { done, value };
      },
    };
  });
}

/**
 * @tsplus getter fncts.Iterable asIterable
 */
export function asIterable<A>(self: Iterable<A>): Iterable<A> {
  return self;
}

/**
 * @tsplus fluent fncts.Iterable flatMap
 */
export function flatMap_<A, B>(self: Iterable<A>, f: (a: A) => Iterable<B>): Iterable<B> {
  return Iterable.make<B>(() => {
    const ia = self[Symbol.iterator]();
    let ib: Iterator<B>;
    let va: IteratorResult<A>;
    let vb: IteratorResult<B>;
    let done = false;

    const pullA = (onDone: () => IteratorResult<B>): IteratorResult<B> => {
      va = ia.next();
      if (va.done) {
        return onDone();
      }
      ib = f(va.value)[Symbol.iterator]();
      return pullB(onDone);
    };
    const pullB = (onDone: () => IteratorResult<B>): IteratorResult<B> => {
      if (!ib) {
        return pullA(onDone);
      }
      vb = ib!.next();
      if (!vb.done) {
        return { done, value: vb.value };
      }
      return pullA(onDone);
    };

    return {
      next() {
        if (done) {
          return this.return!();
        }
        return pullB(() => this.return!());
      },
      return(value?: unknown) {
        if (!done) {
          done = true;
          if (typeof ia.return === "function") {
            ia.return();
          }
          if (ib && typeof ib.return === "function") {
            ib.return();
          }
        }
        return { done, value };
      },
    };
  });
}

/**
 * @tsplus fluent fncts.Iterable concat
 */
export function concat_<A>(self: Iterable<A>, ib: Iterable<A>): Iterable<A> {
  return Iterable.make(() => {
    const iterA = self[Symbol.iterator]();
    let doneA   = false;
    let iterB: Iterator<A>;
    return {
      next() {
        if (!doneA) {
          const r = iterA.next();
          if (r.done) {
            doneA = true;
            iterB = ib[Symbol.iterator]();
            return iterB.next();
          }
          return r;
        }
        return iterB.next();
      },
    };
  });
}

/**
 * @tsplus fluent fncts.Iterable corresponds
 */
export function corresponds_<A, B>(left: Iterable<A>, right: Iterable<B>, f: (a: A, b: B) => boolean): boolean {
  const leftIterator  = left[Symbol.iterator]();
  const rightIterator = right[Symbol.iterator]();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const lnext = leftIterator.next();
    const rnext = rightIterator.next();
    if (lnext.done !== rnext.done) {
      return false;
    }
    if (lnext.done) {
      return true;
    }
    if (!f(lnext.value, rnext.value)) {
      return false;
    }
  }
}

/**
 * @tsplus fluent fncts.Iterable crossWith
 */
export function crossWith_<A, B, C>(self: Iterable<A>, fb: Iterable<B>, f: (a: A, b: B) => C): Iterable<C> {
  return self.flatMap((a) => fb.map((b) => f(a, b)));
}

/**
 * @tsplus fluent fncts.Iterable every
 */
export function every_<A, B extends A>(self: Iterable<A>, p: Refinement<A, B>): boolean;
export function every_<A>(self: Iterable<A>, p: Predicate<A>): boolean;
export function every_<A>(self: Iterable<A>, p: Predicate<A>): boolean {
  return self.everyWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.Iterable everyWithIndex
 */
export function everyWithIndex_<A, B extends A>(self: Iterable<A>, p: RefinementWithIndex<number, A, B>): boolean;
export function everyWithIndex_<A>(self: Iterable<A>, p: PredicateWithIndex<number, A>): boolean;
export function everyWithIndex_<A>(self: Iterable<A>, p: PredicateWithIndex<number, A>): boolean {
  const iterator = self[Symbol.iterator]();
  let i          = 0;
  let next: IteratorResult<A>;
  while (!(next = iterator.next()).done) {
    if (!p(i, next.value)) {
      if (typeof iterator.return === "function") {
        iterator.return();
      }
      return false;
    }
    i++;
  }
  return true;
}

/**
 * @tsplus fluent fncts.Iterable filter
 */
export function filter_<A, B extends A>(self: Iterable<A>, p: Refinement<A, B>): Iterable<B>;
export function filter_<A>(self: Iterable<A>, p: Predicate<A>): Iterable<A>;
export function filter_<A>(self: Iterable<A>, p: Predicate<A>): Iterable<A> {
  return self.filterWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.Iterable filterMap
 */
export function filterMap_<A, B>(self: Iterable<A>, f: (a: A) => Maybe<B>): Iterable<B> {
  return self.filterMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.Iterable filterMapWithIndex
 */
export function filterMapWithIndex_<A, B>(self: Iterable<A>, f: (i: number, a: A) => Maybe<B>): Iterable<B> {
  return Iterable.make<B>(() => {
    let i    = 0;
    const ia = self[Symbol.iterator]();
    let va: IteratorResult<A>;
    let done = false;
    return {
      next() {
        if (done) {
          this.return!();
        }
        // eslint-disable-next-line no-constant-condition
        while (true) {
          va = ia.next();
          if (va.done) {
            return this.return!();
          }
          const mb = f(i++, va.value);
          if (mb.isJust()) {
            return { done, value: mb.value };
          }
        }
      },
      return(value?: unknown) {
        if (!done) {
          done = true;
          if (typeof ia.return === "function") {
            ia.return();
          }
        }
        return { done, value };
      },
    };
  });
}

/**
 * @tsplus fluent fncts.Iterable filterWithIndex
 */
export function filterWithIndex_<A, B extends A>(self: Iterable<A>, p: RefinementWithIndex<number, A, B>): Iterable<B>;
export function filterWithIndex_<A>(self: Iterable<A>, p: PredicateWithIndex<number, A>): Iterable<A>;
export function filterWithIndex_<A>(self: Iterable<A>, p: PredicateWithIndex<number, A>): Iterable<A> {
  return Iterable.make<A>(() => {
    let done = false;
    let i    = 0;
    const ia = self[Symbol.iterator]();
    let va: IteratorResult<A>;
    return {
      next() {
        if (done) {
          return this.return!();
        }
        // eslint-disable-next-line no-constant-condition
        while (true) {
          va = ia.next();
          if (va.done) return this.return!();
          if (p(i++, va.value)) return { done, value: va.value };
        }
      },
      return(value?: unknown) {
        if (!done) {
          done = true;
          if (typeof ia.return === "function") {
            ia.return();
          }
        }
        return { done, value };
      },
    };
  });
}

/**
 * @tsplus fluent fncts.Iterable find
 */
export function find_<A, B extends A>(ia: Iterable<A>, refinement: Refinement<A, B>): Maybe<B>;
export function find_<A>(ia: Iterable<A>, predicate: Predicate<A>): Maybe<A>;
export function find_<A>(ia: Iterable<A>, predicate: Predicate<A>): Maybe<A> {
  for (const value of ia) {
    if (predicate(value)) {
      return Just(value);
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.Iterable findIndex
 */
export function findIndex<A>(self: Iterable<A>, p: Predicate<A>): number {
  let i = 0;
  for (const value of self) {
    if (p(value)) {
      return i;
    }
    i++;
  }
  return -1;
}

/**
 * @tsplus fluent fncts.Iterable foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(fa: Iterable<A>, b: B, f: (i: number, b: B, a: A) => B): B {
  let res = b;
  let i   = -1;
  for (const value of fa) {
    i  += 1;
    res = f(i, res, value);
  }
  return res;
}

/**
 * @tsplus fluent fncts.Iterable foldLeft
 */
export function foldLeft_<A, B>(self: Iterable<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.Iterable foldMap
 */
export function foldMap_<A, M>(self: Iterable<A>, f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>): M {
  return self.foldMapWithIndex((_, a) => f(a), M);
}

/**
 * @tsplus fluent fncts.Iterable foldMapWithIndex
 */
export function foldMapWithIndex_<A, M>(
  self: Iterable<A>,
  f: (i: number, a: A) => M,
  /** @tsplus auto */ M: P.Monoid<M>,
): M {
  let res = M.nat;
  let n   = -1;
  for (const value of self) {
    n  += 1;
    res = M.combine(res, f(n, value));
  }
  return res;
}

/**
 * @tsplus fluent fncts.Iterable foldRightWithIndex
 */
export function foldRightWithIndex_<A, B>(
  self: Iterable<A>,
  b: Eval<B>,
  f: (i: number, a: A, b: Eval<B>) => Eval<B>,
): Eval<B> {
  let i             = 0;
  const iterator    = self[Symbol.iterator]();
  const go: Eval<B> = Eval.defer(() => {
    const { value: current, done } = iterator.next();
    if (done) {
      return b;
    } else {
      return f(i++, current, go);
    }
  });
  return go;
}

/**
 * @tsplus fluent fncts.Iterable foldRight
 */
export function foldRight_<A, B>(self: Iterable<A>, b: Eval<B>, f: (a: A, b: Eval<B>) => Eval<B>): Eval<B> {
  return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.Iterable map
 */
export function map_<A, B>(self: Iterable<A>, f: (a: A) => B): Iterable<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.Iterable mapWithIndex
 */
export function mapWithIndex_<A, B>(self: Iterable<A>, f: (i: number, a: A) => B): Iterable<B> {
  return Iterable.make<B>(() => {
    const ia = self[Symbol.iterator]();
    let i    = 0;
    let done = false;
    let va: IteratorResult<A>;
    return {
      next() {
        if (done) {
          return this.return!();
        }
        va = ia.next();
        if (va.done) {
          return this.return!();
        }
        return { done, value: f(i++, va.value) };
      },
      return(value?: unknown) {
        if (!done) {
          done = true;
          if (typeof ia.return === "function") {
            ia.return();
          }
        }
        return { done, value };
      },
    };
  });
}

type PartitionHandleResult<A> = { emit: true; value: A } | { emit: false };

function handlePartitionMap<A, B, C>(
  f: (i: number, a: A) => Either<B, C>,
  i: number,
  a: A,
  h: "Left" | "Right",
): PartitionHandleResult<B | C> {
  const bc = f(i, a);
  Either.concrete(bc);
  return h === "Left" && bc._tag === "Left"
    ? { emit: true, value: bc.left }
    : h === "Right" && bc._tag === "Right"
    ? { emit: true, value: bc.right }
    : { emit: false };
}

function partitionMapWithIndexIterator<A, B, C>(
  fa: Iterable<A>,
  f: (i: number, a: A) => Either<B, C>,
  h: "Left" | "Right",
): Iterator<B | C> {
  const ia = fa[Symbol.iterator]();
  let i    = 0;
  let done = false;
  let va: IteratorResult<A>;
  return {
    next() {
      if (done) {
        return this.return!();
      }
      // eslint-disable-next-line no-constant-condition
      while (true) {
        va = ia.next();
        if (va.done) {
          return this.return!();
        }
        const ra = handlePartitionMap(f, i++, va.value, h);
        if (ra.emit) {
          return { done, value: ra.value };
        }
      }
    },
    return(value?: unknown) {
      if (!done) {
        done = true;
        if (typeof ia.return === "function") {
          ia.return();
        }
      }
      return { done, value };
    },
  };
}

/**
 * @tsplus fluent fncts.Iterable partitionMap
 */
export function partitionMap_<A, B, C>(
  self: Iterable<A>,
  f: (a: A) => Either<B, C>,
): readonly [Iterable<B>, Iterable<C>] {
  return self.partitionMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.Iterable partitionMapWithIndex
 */
export function partitionMapWithIndex_<A, B, C>(
  fa: Iterable<A>,
  f: (i: number, a: A) => Either<B, C>,
): readonly [Iterable<B>, Iterable<C>] {
  return tuple(
    Iterable.make(() => partitionMapWithIndexIterator(fa, f, "Left")) as Iterable<B>,
    Iterable.make(() => partitionMapWithIndexIterator(fa, f, "Right")) as Iterable<C>,
  );
}

function handlePartition<A>(
  predicate: PredicateWithIndex<number, A>,
  i: number,
  a: A,
  h: boolean,
): PartitionHandleResult<A> {
  return h === predicate(i, a) ? { emit: true, value: a } : { emit: false };
}

function partitionWithIndexIterator<A>(
  fa: Iterable<A>,
  predicate: PredicateWithIndex<number, A>,
  h: boolean,
): Iterator<A> {
  const ia = fa[Symbol.iterator]();
  let i    = 0;
  let done = false;
  let va: IteratorResult<A>;
  return {
    next() {
      if (done) {
        return this.return!();
      }
      // eslint-disable-next-line no-constant-condition
      while (true) {
        va = ia.next();
        if (va.done) {
          return this.return!();
        }
        const ra = handlePartition(predicate, i++, va.value, h);
        if (ra.emit) {
          return { done, value: ra.value };
        }
      }
    },
    return(value?: unknown) {
      if (!done) {
        done = true;
        if (typeof ia.return === "function") {
          ia.return();
        }
      }
      return { done, value };
    },
  };
}

/**
 * @tsplus fluent fncts.Iterable partition
 */
export function partition_<A, B extends A>(self: Iterable<A>, p: Refinement<A, B>): readonly [Iterable<A>, Iterable<B>];
export function partition_<A>(self: Iterable<A>, p: Predicate<A>): readonly [Iterable<A>, Iterable<A>];
export function partition_<A>(self: Iterable<A>, p: Predicate<A>): readonly [Iterable<A>, Iterable<A>] {
  return self.partitionWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.Iterable partitionWithIndex
 */
export function partitionWithIndex_<A, B extends A>(
  self: Iterable<A>,
  p: RefinementWithIndex<number, A, B>,
): readonly [Iterable<A>, Iterable<B>];
export function partitionWithIndex_<A>(
  self: Iterable<A>,
  p: PredicateWithIndex<number, A>,
): readonly [Iterable<A>, Iterable<A>];
export function partitionWithIndex_<A>(
  self: Iterable<A>,
  p: PredicateWithIndex<number, A>,
): readonly [Iterable<A>, Iterable<A>] {
  return tuple(
    Iterable.make(() => partitionWithIndexIterator(self, p, false)),
    Iterable.make(() => partitionWithIndexIterator(self, p, true)),
  );
}

/**
 * @tsplus getter fncts.Iterable size
 */
export function size<A>(self: Iterable<A>): number {
  let len = 0;
  for (const _ of self) {
    len += 1;
  }
  return len;
}

/**
 * @tsplus getter fncts.Iterable sum
 */
export function sum(self: Iterable<number>): number {
  return self.foldLeft(0, (b, a) => b + a);
}

/**
 * @tsplus fluent fncts.Iterable take
 */
export function take<A>(self: Iterable<A>, n: number): Iterable<A> {
  return Iterable.make<A>(() => {
    let done       = false;
    let i          = 0;
    let value: IteratorResult<A>;
    const iterator = self[Symbol.iterator]();
    return {
      next() {
        if (done || i >= n) {
          return this.return!();
        }
        value = iterator.next();
        i++;
        if (value.done) {
          this.return!();
        }
        return value;
      },
      return(value?: unknown) {
        if (!done) {
          done = true;
          if (typeof iterator.return === "function") {
            iterator.return();
          }
        }
        return { done: true, value };
      },
    };
  });
}

/**
 * @tsplus fluent fncts.Iterable zipWith
 */
export function zipWith_<A, B, C>(self: Iterable<A>, fb: Iterable<B>, f: (a: A, b: B) => C): Iterable<C> {
  return Iterable.make<C>(() => {
    let done = false;
    const ia = self[Symbol.iterator]();
    const ib = fb[Symbol.iterator]();
    return {
      next() {
        if (done) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return this.return!();
        }

        const va = ia.next();
        const vb = ib.next();

        return va.done || vb.done
          ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.return!()
          : { done: false, value: f(va.value, vb.value) };
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

        return { done: true, value };
      },
    };
  });
}

/**
 * @tsplus getter fncts.Iterable zipWithIndex
 */
export function zipWithIndex<A>(self: Iterable<A>): Iterable<readonly [number, A]> {
  return Iterable.make<readonly [number, A]>(() => {
    let n          = 0;
    let done       = false;
    const iterator = self[Symbol.iterator]();
    return {
      next() {
        if (done) {
          this.return!();
        }
        const v = iterator.next();
        return v.done ? this.return!() : { done: false, value: [n++, v.value] };
      },
      return(value?: unknown) {
        if (!done) {
          done = true;
          if (typeof iterator.return === "function") {
            iterator.return();
          }
        }
        return { done: true, value };
      },
    };
  });
}
