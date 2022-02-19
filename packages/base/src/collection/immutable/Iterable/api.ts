import type { Either } from "../../../data/Either";
import type { Maybe } from "../../../data/Maybe";
import type { Predicate, PredicateWithIndex } from "../../../data/Predicate";
import type { Refinement, RefinementWithIndex } from "../../../data/Refinement";
import type * as P from "../../../prelude";

import { Eval } from "../../../control/Eval";
import { tuple } from "../../../data/function";
import { Iterable } from "./definition";

/**
 * @tsplus fluent fncts.collection.immutable.Iterable ap
 */
export function ap_<A, B>(
  self: Iterable<(a: A) => B>,
  fa: Iterable<A>
): Iterable<B> {
  return self.chain((f) => fa.map(f));
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable chain
 */
export function chain_<A, B>(
  self: Iterable<A>,
  f: (a: A) => Iterable<B>
): Iterable<B> {
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
 * @tsplus fluent fncts.collection.immutable.Iterable concat
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
 * @tsplus fluent fncts.collection.immutable.Iterable corresponds
 */
export function corresponds_<A, B>(
  left: Iterable<A>,
  right: Iterable<B>,
  f: (a: A, b: B) => boolean
): boolean {
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
 * @tsplus fluent fncts.collection.immutable.Iterable crossWith
 */
export function crossWith_<A, B, C>(
  self: Iterable<A>,
  fb: Iterable<B>,
  f: (a: A, b: B) => C
): Iterable<C> {
  return self.chain((a) => fb.map((b) => f(a, b)));
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable filter
 */
export function filter_<A, B extends A>(
  self: Iterable<A>,
  p: Refinement<A, B>
): Iterable<B>;
export function filter_<A>(self: Iterable<A>, p: Predicate<A>): Iterable<A>;
export function filter_<A>(self: Iterable<A>, p: Predicate<A>): Iterable<A> {
  return self.filterWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable filterMap
 */
export function filterMap_<A, B>(
  self: Iterable<A>,
  f: (a: A) => Maybe<B>
): Iterable<B> {
  return self.filterMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable filterMapWithIndex
 */
export function filterMapWithIndex_<A, B>(
  self: Iterable<A>,
  f: (i: number, a: A) => Maybe<B>
): Iterable<B> {
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
 * @tsplus fluent fncts.collection.immutable.Iterable filterWithIndex
 */
export function filterWithIndex_<A, B extends A>(
  self: Iterable<A>,
  p: RefinementWithIndex<number, A, B>
): Iterable<B>;
export function filterWithIndex_<A>(
  self: Iterable<A>,
  p: PredicateWithIndex<number, A>
): Iterable<A>;
export function filterWithIndex_<A>(
  self: Iterable<A>,
  p: PredicateWithIndex<number, A>
): Iterable<A> {
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
 * @tsplus fluent fncts.collection.immutable.Iterable foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(
  fa: Iterable<A>,
  b: B,
  f: (i: number, b: B, a: A) => B
): B {
  let res = b;
  let i   = -1;
  for (const value of fa) {
    i  += 1;
    res = f(i, res, value);
  }
  return res;
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable foldLeft
 */
export function foldLeft_<A, B>(
  self: Iterable<A>,
  b: B,
  f: (b: B, a: A) => B
): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @constrained
 */
export function foldMap_<M>(M: P.Monoid<M>) {
  return <A>(self: Iterable<A>, f: (a: A) => M): M =>
    self.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @tsplus getter fncts.collection.immutable.Iterable foldMap
 */
export function foldMapSelf<A>(self: Iterable<A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (a: A) => M): M =>
      self.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @constrained
 */
export function foldMapWithIndex_<M>(M: P.Monoid<M>) {
  return <A>(self: Iterable<A>, f: (i: number, a: A) => M): M => {
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
 * @tsplus getter fncts.collection.immutable.Iterable foldMapWithIndex
 */
export function foldMapWithIndexSelf<A>(self: Iterable<A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (i: number, a: A) => M): M =>
      foldMapWithIndex_(M)(self, f);
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable foldRightWithIndex
 */
export function foldRightWithIndex_<A, B>(
  self: Iterable<A>,
  b: Eval<B>,
  f: (i: number, a: A, b: Eval<B>) => Eval<B>
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
 * @tsplus fluent fncts.collection.immutable.Iterable foldRight
 */
export function foldRight_<A, B>(
  self: Iterable<A>,
  b: Eval<B>,
  f: (a: A, b: Eval<B>) => Eval<B>
): Eval<B> {
  return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable map
 */
export function map_<A, B>(self: Iterable<A>, f: (a: A) => B): Iterable<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable mapWithIndex
 */
export function mapWithIndex_<A, B>(
  self: Iterable<A>,
  f: (i: number, a: A) => B
): Iterable<B> {
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
  h: "Left" | "Right"
): PartitionHandleResult<B | C> {
  const bc = f(i, a);
  return h === "Left" && bc._tag === "Left"
    ? { emit: true, value: bc.left }
    : h === "Right" && bc._tag === "Right"
    ? { emit: true, value: bc.right }
    : { emit: false };
}

function partitionMapWithIndexIterator<A, B, C>(
  fa: Iterable<A>,
  f: (i: number, a: A) => Either<B, C>,
  h: "Left" | "Right"
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
 * @tsplus fluent fncts.collection.immutable.Iterable partitionMap
 */
export function partitionMap_<A, B, C>(
  self: Iterable<A>,
  f: (a: A) => Either<B, C>
): readonly [Iterable<B>, Iterable<C>] {
  return self.partitionMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable partitionMapWithIndex
 */
export function partitionMapWithIndex_<A, B, C>(
  fa: Iterable<A>,
  f: (i: number, a: A) => Either<B, C>
): readonly [Iterable<B>, Iterable<C>] {
  return tuple(
    Iterable.make(() =>
      partitionMapWithIndexIterator(fa, f, "Left")
    ) as Iterable<B>,
    Iterable.make(() =>
      partitionMapWithIndexIterator(fa, f, "Right")
    ) as Iterable<C>
  );
}

function handlePartition<A>(
  predicate: PredicateWithIndex<number, A>,
  i: number,
  a: A,
  h: boolean
): PartitionHandleResult<A> {
  return h === predicate(i, a) ? { emit: true, value: a } : { emit: false };
}

function partitionWithIndexIterator<A>(
  fa: Iterable<A>,
  predicate: PredicateWithIndex<number, A>,
  h: boolean
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
 * @tsplus fluent fncts.collection.immutable.Iterable partition
 */
export function partition_<A, B extends A>(
  self: Iterable<A>,
  p: Refinement<A, B>
): readonly [Iterable<A>, Iterable<B>];
export function partition_<A>(
  self: Iterable<A>,
  p: Predicate<A>
): readonly [Iterable<A>, Iterable<A>];
export function partition_<A>(
  self: Iterable<A>,
  p: Predicate<A>
): readonly [Iterable<A>, Iterable<A>] {
  return self.partitionWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable partitionWithIndex
 */
export function partitionWithIndex_<A, B extends A>(
  self: Iterable<A>,
  p: RefinementWithIndex<number, A, B>
): readonly [Iterable<A>, Iterable<B>];
export function partitionWithIndex_<A>(
  self: Iterable<A>,
  p: PredicateWithIndex<number, A>
): readonly [Iterable<A>, Iterable<A>];
export function partitionWithIndex_<A>(
  self: Iterable<A>,
  p: PredicateWithIndex<number, A>
): readonly [Iterable<A>, Iterable<A>] {
  return tuple(
    Iterable.make(() => partitionWithIndexIterator(self, p, false)),
    Iterable.make(() => partitionWithIndexIterator(self, p, true))
  );
}

/**
 * @tsplus getter fncts.collection.immutable.Iterable size
 */
export function size<A>(self: Iterable<A>): number {
  let len = 0;
  for (const _ of self) {
    len += 1;
  }
  return len;
}

/**
 * @tsplus fluent fncts.collection.immutable.Iterable zipWith
 */
export function zipWith_<A, B, C>(
  self: Iterable<A>,
  fb: Iterable<B>,
  f: (a: A, b: B) => C
): Iterable<C> {
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
 * @tsplus getter fncts.collection.immutable.Iterable zipWithIndex
 */
export function zipWithIndex<A>(
  self: Iterable<A>
): Iterable<readonly [number, A]> {
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

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst ap_
 */
export function ap<A>(fa: Iterable<A>) {
  return <B>(self: Iterable<(a: A) => B>): Iterable<B> => ap_(self, fa);
}
/**
 * @tsplus dataFirst chain_
 */
export function chain<A, B>(f: (a: A) => Iterable<B>) {
  return (self: Iterable<A>): Iterable<B> => chain_(self, f);
}
/**
 * @tsplus dataFirst concat_
 */
export function concat<A>(ib: Iterable<A>) {
  return (self: Iterable<A>): Iterable<A> => concat_(self, ib);
}
/**
 * @tsplus dataFirst corresponds_
 */
export function corresponds<A, B>(
  right: Iterable<B>,
  f: (a: A, b: B) => boolean
) {
  return (left: Iterable<A>): boolean => corresponds_(left, right, f);
}
/**
 * @tsplus dataFirst crossWith_
 */
export function crossWith<A, B, C>(fb: Iterable<B>, f: (a: A, b: B) => C) {
  return (self: Iterable<A>): Iterable<C> => crossWith_(self, fb, f);
}
/**
 * @tsplus dataFirst filter_
 */
export function filter<A, B extends A>(
  p: Refinement<A, B>
): (self: Iterable<A>) => Iterable<B>;
/**
 * @tsplus dataFirst filter_
 */
export function filter<A>(p: Predicate<A>): (self: Iterable<A>) => Iterable<A>;
/**
 * @tsplus dataFirst filter_
 */
export function filter<A>(p: Predicate<A>) {
  return (self: Iterable<A>): Iterable<A> => filter_(self, p);
}
/**
 * @tsplus dataFirst filterMap_
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: Iterable<A>): Iterable<B> => filterMap_(self, f);
}
/**
 * @tsplus dataFirst filterMapWithIndex_
 */
export function filterMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (self: Iterable<A>): Iterable<B> => filterMapWithIndex_(self, f);
}
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>
): (self: Iterable<A>) => Iterable<B>;
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A>(
  p: PredicateWithIndex<number, A>
): (self: Iterable<A>) => Iterable<A>;
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: Iterable<A>): Iterable<A> => filterWithIndex_(self, p);
}
/**
 * @tsplus dataFirst foldLeftWithIndex_
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (fa: Iterable<A>): B => foldLeftWithIndex_(fa, b, f);
}
/**
 * @tsplus dataFirst foldLeft_
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: Iterable<A>): B => foldLeft_(self, b, f);
}
/**
 * @tsplus dataFirst foldRightWithIndex_
 */
export function foldRightWithIndex<A, B>(
  b: Eval<B>,
  f: (i: number, a: A, b: Eval<B>) => Eval<B>
) {
  return (self: Iterable<A>): Eval<B> => foldRightWithIndex_(self, b, f);
}
/**
 * @tsplus dataFirst foldRight_
 */
export function foldRight<A, B>(b: Eval<B>, f: (a: A, b: Eval<B>) => Eval<B>) {
  return (self: Iterable<A>): Eval<B> => foldRight_(self, b, f);
}
/**
 * @tsplus dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Iterable<A>): Iterable<B> => map_(self, f);
}
/**
 * @tsplus dataFirst mapWithIndex_
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: Iterable<A>): Iterable<B> => mapWithIndex_(self, f);
}
/**
 * @tsplus dataFirst partitionMap_
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: Iterable<A>): readonly [Iterable<B>, Iterable<C>] =>
    partitionMap_(self, f);
}
/**
 * @tsplus dataFirst partitionMapWithIndex_
 */
export function partitionMapWithIndex<A, B, C>(
  f: (i: number, a: A) => Either<B, C>
) {
  return (fa: Iterable<A>): readonly [Iterable<B>, Iterable<C>] =>
    partitionMapWithIndex_(fa, f);
}
/**
 * @tsplus dataFirst partition_
 */
export function partition<A, B extends A>(
  p: Refinement<A, B>
): (self: Iterable<A>) => readonly [Iterable<A>, Iterable<B>];
/**
 * @tsplus dataFirst partition_
 */
export function partition<A>(
  p: Predicate<A>
): (self: Iterable<A>) => readonly [Iterable<A>, Iterable<A>];
/**
 * @tsplus dataFirst partition_
 */
export function partition<A>(p: Predicate<A>) {
  return (self: Iterable<A>): readonly [Iterable<A>, Iterable<A>] =>
    partition_(self, p);
}
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>
): (self: Iterable<A>) => readonly [Iterable<A>, Iterable<B>];
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A>(
  p: PredicateWithIndex<number, A>
): (self: Iterable<A>) => readonly [Iterable<A>, Iterable<A>];
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: Iterable<A>): readonly [Iterable<A>, Iterable<A>] =>
    partitionWithIndex_(self, p);
}
/**
 * @tsplus dataFirst zipWith_
 */
export function zipWith<A, B, C>(fb: Iterable<B>, f: (a: A, b: B) => C) {
  return (self: Iterable<A>): Iterable<C> => zipWith_(self, fb, f);
}
/**
 * @constrained
 * @tsplus dataFirst foldMap_
 */
export function foldMap<M>(M: P.Monoid<M>) {
  return <A>(f: (a: A) => M) =>
    (self: Iterable<A>) =>
      foldMap_(M)(self, f);
}
/**
 * @constrained
 * @tsplus dataFirst foldMapWithIndex_
 */
export function foldMapWithIndex<M>(M: P.Monoid<M>) {
  return <A>(f: (i: number, a: A) => M) =>
    (self: Iterable<A>) =>
      foldMapWithIndex_(M)(self, f);
}
// codegen:end
