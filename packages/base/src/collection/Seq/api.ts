import type * as P from "@fncts/base/typeclass";

import { Seq } from "@fncts/base/collection/Seq/definition";
import { tuple } from "@fncts/base/data/function";

/**
 * @tsplus fluent fncts.Seq ap
 */
export function ap_<A, B>(self: Seq<(a: A) => B>, fa: Seq<A>): Seq<B> {
  return self.chain((f) => fa.map(f));
}

/**
 * @tsplus fluent fncts.Seq append
 */
export function append_<A, B>(self: Seq<A>, b: B): Seq<A | B> {
  return Seq.make<A | B>(() => {
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
 * @tsplus getter fncts.Seq asSeq
 */
export function asSeq<A>(self: Seq<A>): Seq<A> {
  return self;
}

/**
 * @tsplus fluent fncts.Seq chain
 */
export function chain_<A, B>(self: Seq<A>, f: (a: A) => Seq<B>): Seq<B> {
  return Seq.make<B>(() => {
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
 * @tsplus fluent fncts.Seq concat
 */
export function concat_<A>(self: Seq<A>, ib: Seq<A>): Seq<A> {
  return Seq.make(() => {
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
 * @tsplus fluent fncts.Seq corresponds
 */
export function corresponds_<A, B>(left: Seq<A>, right: Seq<B>, f: (a: A, b: B) => boolean): boolean {
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
 * @tsplus fluent fncts.Seq crossWith
 */
export function crossWith_<A, B, C>(self: Seq<A>, fb: Seq<B>, f: (a: A, b: B) => C): Seq<C> {
  return self.chain((a) => fb.map((b) => f(a, b)));
}

/**
 * @tsplus fluent fncts.Seq every
 */
export function every_<A, B extends A>(self: Seq<A>, p: Refinement<A, B>): boolean;
export function every_<A>(self: Seq<A>, p: Predicate<A>): boolean;
export function every_<A>(self: Seq<A>, p: Predicate<A>): boolean {
  return self.everyWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.Seq everyWithIndex
 */
export function everyWithIndex_<A, B extends A>(self: Seq<A>, p: RefinementWithIndex<number, A, B>): boolean;
export function everyWithIndex_<A>(self: Seq<A>, p: PredicateWithIndex<number, A>): boolean;
export function everyWithIndex_<A>(self: Seq<A>, p: PredicateWithIndex<number, A>): boolean {
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
 * @tsplus fluent fncts.Seq filter
 */
export function filter_<A, B extends A>(self: Seq<A>, p: Refinement<A, B>): Seq<B>;
export function filter_<A>(self: Seq<A>, p: Predicate<A>): Seq<A>;
export function filter_<A>(self: Seq<A>, p: Predicate<A>): Seq<A> {
  return self.filterWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.Seq filterMap
 */
export function filterMap_<A, B>(self: Seq<A>, f: (a: A) => Maybe<B>): Seq<B> {
  return self.filterMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.Seq filterMapWithIndex
 */
export function filterMapWithIndex_<A, B>(self: Seq<A>, f: (i: number, a: A) => Maybe<B>): Seq<B> {
  return Seq.make<B>(() => {
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
 * @tsplus fluent fncts.Seq filterWithIndex
 */
export function filterWithIndex_<A, B extends A>(self: Seq<A>, p: RefinementWithIndex<number, A, B>): Seq<B>;
export function filterWithIndex_<A>(self: Seq<A>, p: PredicateWithIndex<number, A>): Seq<A>;
export function filterWithIndex_<A>(self: Seq<A>, p: PredicateWithIndex<number, A>): Seq<A> {
  return Seq.make<A>(() => {
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
 * @tsplus fluent fncts.Seq find
 */
export function find_<A, B extends A>(ia: Seq<A>, refinement: Refinement<A, B>): Maybe<B>;
export function find_<A>(ia: Seq<A>, predicate: Predicate<A>): Maybe<A>;
export function find_<A>(ia: Seq<A>, predicate: Predicate<A>): Maybe<A> {
  for (const value of ia) {
    if (predicate(value)) {
      return Just(value);
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.Seq foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(fa: Seq<A>, b: B, f: (i: number, b: B, a: A) => B): B {
  let res = b;
  let i   = -1;
  for (const value of fa) {
    i  += 1;
    res = f(i, res, value);
  }
  return res;
}

/**
 * @tsplus fluent fncts.Seq foldLeft
 */
export function foldLeft_<A, B>(self: Seq<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @constrained
 */
export function foldMap_<M>(M: P.Monoid<M>) {
  return <A>(self: Seq<A>, f: (a: A) => M): M => self.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @tsplus getter fncts.Seq foldMap
 */
export function foldMapSelf<A>(self: Seq<A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (a: A) => M): M =>
      self.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @constrained
 */
export function foldMapWithIndex_<M>(M: P.Monoid<M>) {
  return <A>(self: Seq<A>, f: (i: number, a: A) => M): M => {
    let res = M.nat;
    let n   = -1;
    for (const value of self) {
      n  += 1;
      res = M.combine_(res, f(n, value));
    }
    return res;
  };
}

/**
 * @tsplus getter fncts.Seq foldMapWithIndex
 */
export function foldMapWithIndexSelf<A>(self: Seq<A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (i: number, a: A) => M): M =>
      foldMapWithIndex_(M)(self, f);
}

/**
 * @tsplus fluent fncts.Seq foldRightWithIndex
 */
export function foldRightWithIndex_<A, B>(
  self: Seq<A>,
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
 * @tsplus fluent fncts.Seq foldRight
 */
export function foldRight_<A, B>(self: Seq<A>, b: Eval<B>, f: (a: A, b: Eval<B>) => Eval<B>): Eval<B> {
  return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.Seq map
 */
export function map_<A, B>(self: Seq<A>, f: (a: A) => B): Seq<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.Seq mapWithIndex
 */
export function mapWithIndex_<A, B>(self: Seq<A>, f: (i: number, a: A) => B): Seq<B> {
  return Seq.make<B>(() => {
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
  return h === "Left" && bc._tag === "Left"
    ? { emit: true, value: bc.left }
    : h === "Right" && bc._tag === "Right"
    ? { emit: true, value: bc.right }
    : { emit: false };
}

function partitionMapWithIndexIterator<A, B, C>(
  fa: Seq<A>,
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
 * @tsplus fluent fncts.Seq partitionMap
 */
export function partitionMap_<A, B, C>(self: Seq<A>, f: (a: A) => Either<B, C>): readonly [Seq<B>, Seq<C>] {
  return self.partitionMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.Seq partitionMapWithIndex
 */
export function partitionMapWithIndex_<A, B, C>(
  fa: Seq<A>,
  f: (i: number, a: A) => Either<B, C>,
): readonly [Seq<B>, Seq<C>] {
  return tuple(
    Seq.make(() => partitionMapWithIndexIterator(fa, f, "Left")) as Seq<B>,
    Seq.make(() => partitionMapWithIndexIterator(fa, f, "Right")) as Seq<C>,
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

function partitionWithIndexIterator<A>(fa: Seq<A>, predicate: PredicateWithIndex<number, A>, h: boolean): Iterator<A> {
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
 * @tsplus fluent fncts.Seq partition
 */
export function partition_<A, B extends A>(self: Seq<A>, p: Refinement<A, B>): readonly [Seq<A>, Seq<B>];
export function partition_<A>(self: Seq<A>, p: Predicate<A>): readonly [Seq<A>, Seq<A>];
export function partition_<A>(self: Seq<A>, p: Predicate<A>): readonly [Seq<A>, Seq<A>] {
  return self.partitionWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.Seq partitionWithIndex
 */
export function partitionWithIndex_<A, B extends A>(
  self: Seq<A>,
  p: RefinementWithIndex<number, A, B>,
): readonly [Seq<A>, Seq<B>];
export function partitionWithIndex_<A>(self: Seq<A>, p: PredicateWithIndex<number, A>): readonly [Seq<A>, Seq<A>];
export function partitionWithIndex_<A>(self: Seq<A>, p: PredicateWithIndex<number, A>): readonly [Seq<A>, Seq<A>] {
  return tuple(
    Seq.make(() => partitionWithIndexIterator(self, p, false)),
    Seq.make(() => partitionWithIndexIterator(self, p, true)),
  );
}

/**
 * @tsplus getter fncts.Seq size
 */
export function size<A>(self: Seq<A>): number {
  let len = 0;
  for (const _ of self) {
    len += 1;
  }
  return len;
}

/**
 * @tsplus fluent fncts.Seq take
 */
export function take<A>(self: Seq<A>, n: number): Seq<A> {
  return Seq.make<A>(() => {
    let done       = false;
    const i        = 0;
    let value: IteratorResult<A>;
    const iterator = self[Symbol.iterator]();
    return {
      next() {
        if (done || i > n) {
          return this.return!();
        }
        value = iterator.next();
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
 * @tsplus fluent fncts.Seq zipWith
 */
export function zipWith_<A, B, C>(self: Seq<A>, fb: Seq<B>, f: (a: A, b: B) => C): Seq<C> {
  return Seq.make<C>(() => {
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
 * @tsplus getter fncts.Seq zipWithIndex
 */
export function zipWithIndex<A>(self: Seq<A>): Seq<readonly [number, A]> {
  return Seq.make<readonly [number, A]>(() => {
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
