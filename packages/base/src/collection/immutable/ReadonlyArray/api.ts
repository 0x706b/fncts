import type { ReadonlyArrayF } from "@fncts/base/collection/immutable/ReadonlyArray/definition";
import type { Monoid } from "@fncts/base/typeclass";

import { EitherTag } from "@fncts/base/data/Either";
import { identity, pipe, tuple } from "@fncts/base/data/function";
import * as P from "@fncts/base/typeclass";

/**
 * Aligns two arrays into `These` values, preserving unmatched elements.
 *
 * @tsplus pipeable fncts.ReadonlyArray align
 */
export function align<B>(fb: ReadonlyArray<B>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<These<A, B>> => {
    return self.alignWith(fb, identity);
  };
}

/**
 * Aligns two arrays and maps each aligned slot with `f`.
 *
 * @tsplus pipeable fncts.ReadonlyArray alignWith
 */
export function alignWith<A, B, C>(fb: ReadonlyArray<B>, f: (_: These<A, B>) => C) {
  return (self: ReadonlyArray<A>): ReadonlyArray<C> => {
    const selfArray = self;
    const thatArray = fb;
    const minlen    = Math.min(selfArray.length, thatArray.length);
    const maxlen    = Math.max(selfArray.length, thatArray.length);
    const ret       = Array<C>(maxlen);
    for (let i = 0; i < minlen; i++) {
      ret[i] = f(These.both(selfArray[i]!, thatArray[i]!));
    }
    if (minlen === maxlen) {
      return ret;
    } else if (selfArray.length > thatArray.length) {
      for (let i = minlen; i < maxlen; i++) {
        ret[i] = f(These.left(selfArray[i]!));
      }
    } else {
      for (let i = minlen; i < maxlen; i++) {
        ret[i] = f(These.right(thatArray[i]!));
      }
    }
    return ret;
  };
}

/**
 * Concatenates the current array with a lazily provided fallback array.
 *
 * @tsplus pipeable fncts.ReadonlyArray alt
 */
export function alt<B>(that: Lazy<ReadonlyArray<B>>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A | B> => {
    return (<ReadonlyArray<A | B>>self).concat(that());
  };
}

/**
 * Applies each function in the array to each value in `fa`.
 *
 * @tsplus pipeable fncts.ReadonlyArray ap
 */
export function ap<A>(fa: ReadonlyArray<A>) {
  return <B>(self: ReadonlyArray<(a: A) => B>): ReadonlyArray<B> => {
    return self.flatMap((f) => fa.map(f));
  };
}

/**
 * Appends a value to the end of an array.
 *
 * @tsplus pipeable fncts.ReadonlyArray append
 */
export function append<B>(last: B) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A | B> => {
    const selfArray = self;
    const len       = selfArray.length;
    const r         = Array<A | B>(len + 1);
    r[len]          = last;
    for (let i = 0; i < len; i++) {
      r[i] = selfArray[i]!;
    }
    return r;
  };
}

/**
 * Performs stack-safe breadth-first recursive chaining.
 *
 * @tsplus static fncts.ReadonlyArrayOps chainRecBreadthFirst
 */
export function chainRecBreadthFirst<A, B>(a: A, f: (a: A) => ReadonlyArray<Either<A, B>>): ReadonlyArray<B> {
  const initial                     = f(a);
  const buffer: Array<Either<A, B>> = [];
  const out: Array<B>               = [];

  /** Expands `Left` values and collects `Right` results. */
  function go(e: Either<A, B>): void {
    Either.concrete(e);
    if (e._tag === "Left") {
      f(e.left).forEach((v) => buffer.push(v));
    } else {
      out.push(e.right);
    }
  }

  for (const e of initial) {
    go(e);
  }

  while (buffer.length > 0) {
    go(buffer.shift()!);
  }

  return out;
}

/**
 * Performs stack-safe depth-first recursive chaining.
 *
 * @tsplus static fncts.ReadonlyArrayOps chainRecDepthFirst
 */
export function chainRecDepthFirst<A, B>(a: A, f: (a: A) => ReadonlyArray<Either<A, B>>): ReadonlyArray<B> {
  const buffer   = f(a).slice();
  const out: B[] = [];

  while (buffer.length > 0) {
    const e = buffer.shift()!;
    Either.concrete(e);
    if (e._tag === EitherTag.Left) {
      buffer.unshift(...f(e.left));
    } else {
      out.push(e.right);
    }
  }

  return out;
}

/**
 * A useful recursion pattern for processing a `Array` to produce a new `Array`,
 * often used for "chopping" up the input `Array`. Typically chop is called with some function
 * that will consume an initial prefix of the `Array` and produce a value and the rest of the `Array`.
 *
 * @tsplus pipeable fncts.ReadonlyArray chop
 */
export function chop<A, B>(f: (as: ReadonlyNonEmptyArray<A>) => readonly [B, ReadonlyArray<A>]) {
  return (as: ReadonlyArray<A>): ReadonlyArray<B> => {
    const result: Array<B>   = [];
    let cs: ReadonlyArray<A> = as;
    while (cs.isNonEmpty()) {
      const [b, c] = f(cs);
      result.push(b);
      cs = c;
    }
    return result;
  };
}

/**
 * Collects mapped values while `f` returns `Just`.
 *
 * @tsplus pipeable fncts.ReadonlyArray collectWhile
 */
export function collectWhile<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): ReadonlyArray<B> => {
    const result: Array<B> = [];
    for (let i = 0; i < as.length; i++) {
      const o = f(as[i]!);
      if (o.isJust()) {
        result.push(o.value);
      } else {
        break;
      }
    }
    return result;
  };
}

/**
 * Builds combinations from input arrays, optionally filtering with `g`.
 *
 * @tsplus static fncts.ReadonlyArrayOps comprehension
 */
export function comprehension<A, B, C, D, R>(
  input: [ReadonlyArray<A>, ReadonlyArray<B>, ReadonlyArray<C>, ReadonlyArray<D>],
  f: (a: A, b: B, c: C, d: D) => R,
  g?: (a: A, b: B, c: C, d: D) => boolean,
): ReadonlyArray<R>;
export function comprehension<A, B, C, R>(
  input: [ReadonlyArray<A>, ReadonlyArray<B>, ReadonlyArray<C>],
  f: (a: A, b: B, c: C) => R,
  g?: (a: A, b: B, c: C) => boolean,
): ReadonlyArray<R>;
export function comprehension<A, B, R>(
  input: [ReadonlyArray<A>, ReadonlyArray<B>],
  f: (a: A, b: B) => R,
  g?: (a: A, b: B) => boolean,
): ReadonlyArray<R>;
export function comprehension<A, R>(input: [ReadonlyArray<A>], f: (a: A) => R, g?: (a: A) => boolean): ReadonlyArray<R>;
export function comprehension<A, R>(
  input: ReadonlyArray<ReadonlyArray<A>>,
  f: (...xs: ReadonlyArray<A>) => R,
  g: (...xs: ReadonlyArray<A>) => boolean = () => true,
): ReadonlyArray<R> {
  return Eval.run(comprehensionLoop([], input, f, g));
}

/**
 * Builds the Cartesian-product result recursively for `comprehension`.
 */
function comprehensionLoop<A, R>(
  scope: ReadonlyArray<A>,
  input: ReadonlyArray<ReadonlyArray<A>>,
  f: (...xs: ReadonlyArray<A>) => R,
  g: (...xs: ReadonlyArray<A>) => boolean,
): Eval<ReadonlyArray<R>> {
  if (input.length === 0) {
    return g(...scope) ? Eval.now([f(...scope)]) : Eval.now([]);
  } else {
    return input[0]!
      .traverse(Eval.Applicative)((a) => comprehensionLoop(scope.append(a), input.slice(1), f, g))
      .map((rs) => rs.flatten);
  }
}

/**
 * Concatenates two arrays.
 *
 * @tsplus pipeable fncts.ReadonlyArray concat
 *
 * @tsplus pipeable-operator fncts.ReadonlyArray +
 */
export function concat<B>(that: ReadonlyArray<B>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A | B> => {
    const lenx = self.length;
    if (lenx === 0) {
      return that;
    }
    const leny = that.length;
    if (leny === 0) {
      return self;
    }
    const r = Array<A | B>(lenx + leny);
    for (let i = 0; i < lenx; i++) {
      r[i] = self[i]!;
    }
    for (let i = 0; i < leny; i++) {
      r[i + lenx] = that[i]!;
    }
    return r;
  };
}

/**
 * Computes the Cartesian product as zipped tuples.
 *
 * @tsplus pipeable fncts.ReadonlyArray cross
 */
export function cross<B>(fb: ReadonlyArray<B>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<Zipped.Make<A, B>> => {
    return self.crossWith(fb, (a, b) => Zipped(a, b));
  };
}

/**
 * Computes the Cartesian product and combines pairs with `f`.
 *
 * @tsplus pipeable fncts.ReadonlyArray crossWith
 */
export function crossWith<A, B, C>(fb: ReadonlyArray<B>, f: (a: A, b: B) => C) {
  return (self: ReadonlyArray<A>): ReadonlyArray<C> => {
    return self.flatMap((a) => fb.map((b) => f(a, b)));
  };
}

/**
 * Deletes the element at index `i`.
 *
 * @tsplus pipeable fncts.ReadonlyArray deleteAt
 */
export function deleteAt(i: number) {
  return <A>(as: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> => {
    return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeDeleteAt(i));
  };
}

/**
 * Returns elements in `self` that are not in `ys`.
 *
 * @tsplus pipeable fncts.ReadonlyArray difference
 */
export function difference<A>(ys: ReadonlyArray<A>, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.filter((a) => !ys.elem(a, E));
  };
}
/**
 * Drops the first `n` elements.
 *
 * @tsplus pipeable fncts.ReadonlyArray drop
 */
export function drop(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.slice(n);
  };
}

/**
 * Drops the last `n` elements.
 *
 * @tsplus pipeable fncts.ReadonlyArray dropLast
 */
export function dropLast(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.slice(0, self.length - n);
  };
}

/**
 * Drops a suffix while elements satisfy `p`.
 *
 * @tsplus pipeable fncts.ReadonlyArray dropLastWhile
 */
export function dropLastWhile<A>(p: Predicate<A>) {
  return (as: ReadonlyArray<A>): ReadonlyArray<A> => {
    return as.slice(0, as.spanIndexRight(p) + 1);
  };
}

/**
 * Drops a prefix while elements satisfy `p`.
 *
 * @tsplus pipeable fncts.ReadonlyArray dropWhile
 */
export function dropWhile<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.slice(self.spanIndexLeft(p));
  };
}

/**
 * Test if a value is a member of an array. Takes an `Eq<A>` as a single
 * argument which returns the function to use to search for a value of type `A` in
 * an array of type `ReadonlyArray<A>`.
 *
 * @tsplus pipeable fncts.ReadonlyArray elem
 *
 * @tsplus pipeable fncts.Array elem
 */
export function elem<A>(a: A, /** @tsplus auto */ E: P.Eq<A>) {
  return (as: ReadonlyArray<A>): boolean => {
    const predicate = (element: A) => E.equals(a)(element);
    const len       = as.length;
    for (let i = 0; i < len; i++) {
      if (predicate(as[i]!)) {
        return true;
      }
    }
    return false;
  };
}

/**
 * Checks whether all elements satisfy a predicate.
 *
 * @tsplus pipeable fncts.ReadonlyArray every
 */
export function every<A, B extends A>(p: Refinement<A, B>): (self: ReadonlyArray<A>) => self is ReadonlyArray<B>;
export function every<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => boolean;
export function every<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): boolean => {
    return self.everyWithIndex((_, a) => p(a));
  };
}

/**
 * Checks whether all elements satisfy an index-aware predicate.
 *
 * @tsplus pipeable fncts.ReadonlyArray everyWithIndex
 */
export function everyWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: ReadonlyArray<A>) => self is ReadonlyArray<B>;
export function everyWithIndex<A>(p: PredicateWithIndex<number, A>): (self: ReadonlyArray<A>) => boolean;
export function everyWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: ReadonlyArray<A>): boolean => {
    let result = true;
    let i      = 0;
    while (result && i < self.length) {
      result = p(i, self[i]!);
      i++;
    }
    return result;
  };
}

/**
 * Keeps elements that satisfy a predicate.
 *
 * @tsplus pipeable fncts.ReadonlyArray filter
 */
export function filter<A, B extends A>(p: Refinement<A, B>): (self: ReadonlyArray<A>) => ReadonlyArray<B>;
export function filter<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => ReadonlyArray<A>;
export function filter<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.filterWithIndex((_, a) => p(a));
  };
}

/**
 * Maps elements to `Maybe` values and keeps `Just` results.
 *
 * @tsplus pipeable fncts.ReadonlyArray filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    return self.filterMapWithIndex((_, a) => f(a));
  };
}

/**
 * Maps elements and drops `undefined` results.
 *
 * @tsplus pipeable fncts.Array filterMap
 *
 * @tsplus pipeable fncts.ReadonlyArray filterMap
 */
export function filterMapUndefined<A, B>(f: (a: A) => B | undefined) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    const out: Array<B> = [];
    for (let i = 0; i < self.length; i++) {
      const v = f(self[i]!);
      if (v !== undefined) {
        out.push(v);
      }
    }
    return out;
  };
}

/**
 * Index-aware `filterMap`.
 *
 * @tsplus pipeable fncts.ReadonlyArray filterMapWithIndex
 */
export function filterMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (fa: ReadonlyArray<A>): ReadonlyArray<B> => {
    const result = [];
    for (let i = 0; i < fa.length; i++) {
      const maybeB = f(i, fa[i]!);
      if (maybeB.isJust()) {
        result.push(maybeB.value);
      }
    }
    return result;
  };
}

/**
 * Filters elements using an index-aware predicate.
 *
 * @tsplus pipeable fncts.ReadonlyArray filterWithIndex
 */
export function filterWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: ReadonlyArray<A>) => ReadonlyArray<B>;
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>): (self: ReadonlyArray<A>) => ReadonlyArray<A>;
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    const result: Array<A> = [];
    for (let i = 0; i < self.length; i++) {
      const a = self[i]!;
      if (p(i, a)) {
        result.push(a);
      }
    }
    return result;
  };
}

/**
 * Finds the first element that satisfies a predicate.
 *
 * @tsplus pipeable fncts.ReadonlyArray find
 */
export function find<A, B extends A>(p: Refinement<A, B>): (self: ReadonlyArray<A>) => Maybe<B>;
export function find<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => Maybe<A>;
export function find<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): Maybe<A> => {
    return self.findWithIndex((_, a) => p(a));
  };
}

/**
 * Finds the index of the first element that satisfies a predicate.
 *
 * @tsplus pipeable fncts.ReadonlyArray findIndex
 */
export function findIndex<A>(predicate: Predicate<A>) {
  return (as: ReadonlyArray<A>): Maybe<number> => {
    return as.findMapWithIndex((i, a) => (predicate(a) ? Just(i) : Nothing()));
  };
}

/**
 * Finds the last element that satisfies a predicate.
 *
 * @tsplus pipeable fncts.ReadonlyArray findLast
 */
export function findLast<A, B extends A>(p: Refinement<A, B>): (as: ReadonlyArray<A>) => Maybe<B>;
export function findLast<A>(p: Predicate<A>): (as: ReadonlyArray<A>) => Maybe<A>;
export function findLast<A>(p: Predicate<A>) {
  return (as: ReadonlyArray<A>): Maybe<A> => {
    const len = as.length;
    for (let i = len - 1; i >= 0; i--) {
      if (p(as[i]!)) {
        return Just(as[i]!);
      }
    }
    return Nothing();
  };
}
/**
 * Finds the index of the last element that satisfies a predicate.
 *
 * @tsplus pipeable fncts.ReadonlyArray findLastIndex
 */
export function findLastIndex<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): Maybe<number> => {
    return self.findLastMapWithIndex((i, a) => (p(a) ? Just(i) : Nothing()));
  };
}

/**
 * Applies `f` from right to left and returns the first `Just`.
 *
 * @tsplus pipeable fncts.ReadonlyArray findLastMap
 */
export function findLastMap<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): Maybe<B> => {
    return as.findLastMapWithIndex((_, a) => f(a));
  };
}

/**
 * Index-aware right-to-left `findLastMap`.
 *
 * @tsplus pipeable fncts.ReadonlyArray findLastMapWithIndex
 */
export function findLastMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): Maybe<B> => {
    const len = as.length;
    for (let i = len - 1; i >= 0; i--) {
      const v = f(i, as[i]!);
      if (v.isJust()) {
        return v;
      }
    }
    return Nothing();
  };
}
/**
 * Applies `f` from left to right and returns the first `Just`.
 *
 * @tsplus pipeable fncts.ReadonlyArray findMap
 */
export function findMap<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): Maybe<B> => {
    return as.findMapWithIndex((_, a) => f(a));
  };
}
/**
 * Index-aware `findMap`.
 *
 * @tsplus pipeable fncts.ReadonlyArray findMapWithIndex
 */
export function findMapWithIndex<A, B>(f: (index: number, a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): Maybe<B> => {
    const len = as.length;
    for (let i = 0; i < len; i++) {
      const v = f(i, as[i]!);
      if (v.isJust()) {
        return v;
      }
    }
    return Nothing();
  };
}

/**
 * Finds the first element matching an index-aware predicate.
 *
 * @tsplus pipeable fncts.ReadonlyArray findWithIndex
 */
export function findWithIndex<A, B extends A>(p: RefinementWithIndex<number, A, B>): (as: ReadonlyArray<A>) => Maybe<B>;
export function findWithIndex<A>(p: PredicateWithIndex<number, A>): (as: ReadonlyArray<A>) => Maybe<A>;
export function findWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (as: ReadonlyArray<A>): Maybe<A> => {
    const len = as.length;
    for (let i = 0; i < len; i++) {
      if (p(i, as[i]!)) {
        return Just(as[i]!);
      }
    }
    return Nothing();
  };
}
/**
 * Maps each element to an array and flattens one level.
 *
 * @tsplus pipeable fncts.ReadonlyArray flatMap
 */
export function flatMap<A, B>(f: (a: A) => ReadonlyArray<B>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    return self.flatMapWithIndex((_, a) => f(a));
  };
}
/**
 * Index-aware `flatMap`.
 *
 * @tsplus pipeable fncts.ReadonlyArray flatMapWithIndex
 */
export function flatMapWithIndex<A, B>(f: (i: number, a: A) => ReadonlyArray<B>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    let outLen = 0;
    const len  = self.length;
    const temp = Array<Array<B>>(len);
    for (let i = 0; i < len; i++) {
      const e   = self[i]!;
      const arr = f(i, e);
      outLen   += arr.length;
      temp[i]   = arr! as Array<B>;
    }
    const out = Array<B>(outLen);
    let start = 0;
    for (let i = 0; i < len; i++) {
      const arr = temp[i]!;
      const l   = arr.length;
      for (let j = 0; j < l; j++) {
        out[j + start] = arr[j]!;
      }
      start += l;
    }
    return out;
  };
}

/**
 * Flattens an array of arrays by one level.
 *
 * @tsplus getter fncts.ReadonlyArray flatten
 */
export function flatten<A>(self: ReadonlyArray<ReadonlyArray<A>>): ReadonlyArray<A> {
  return self.flatMap(identity);
}

/**
 * Folds an array using the provided `Monoid`.
 *
 * @tsplus pipeable fncts.ReadonlyArray fold
 */
export function fold<M>(/** @tsplus auto */ M: Monoid<M>) {
  return (self: ReadonlyArray<M>): M => {
    return self.foldLeft(M.nat, (b, a) => M.combine(a)(b));
  };
}

/**
 * Left-associative fold.
 *
 * @tsplus pipeable fncts.ReadonlyArray foldLeft
 *
 * @tsplus pipeable fncts.Array foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
  };
}

/**
 * Left fold that stops when accumulator predicate fails.
 *
 * @tsplus pipeable fncts.ReadonlyArray foldLeftWhile
 *
 * @tsplus pipeable fncts.Array foldLeftWhile
 */
export function foldLeftWhile<A, B>(b: B, p: Predicate<B>, f: (b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    return self.foldLeftWithIndexWhile(b, p, (_, b, a) => f(b, a));
  };
}

/**
 * Index-aware left-associative fold.
 *
 * @tsplus pipeable fncts.ReadonlyArray foldLeftWithIndex
 *
 * @tsplus pipeable fncts.Array foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    const len = self.length;
    let r     = b;
    for (let i = 0; i < len; i++) {
      r = f(i, r, self[i]!);
    }
    return r;
  };
}

/**
 * Index-aware left fold with early termination.
 *
 * @tsplus pipeable fncts.ReadonlyArray foldLeftWithIndexWhile
 *
 * @tsplus pipeable fncts.Array foldLeftWithIndexWhile
 */
export function foldLeftWithIndexWhile<A, B>(b: B, p: Predicate<B>, f: (i: number, b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    let out  = b;
    let cont = p(out);
    for (let i = 0; cont && i < self.length; i++) {
      out  = f(i, out, self[i]!);
      cont = p(out);
    }
    return out;
  };
}

/**
 * Maps each element to a monoid and combines the results.
 *
 * @tsplus pipeable fncts.ReadonlyArray foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: Monoid<M>) {
  return (self: ReadonlyArray<A>): M => {
    return self.foldMapWithIndex((_, a) => f(a), M);
  };
}

/**
 * Index-aware `foldMap`.
 *
 * @tsplus pipeable fncts.ReadonlyArray foldMapWithIndex
 */
export function foldMapWithIndex<A, M>(f: (i: number, a: A) => M, /** @tsplus auto */ M: Monoid<M>) {
  return (self: ReadonlyArray<A>): M => {
    return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(f(i, a))(b));
  };
}

/**
 * Right-associative fold.
 *
 * @tsplus pipeable fncts.ReadonlyArray foldRight
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): B => {
    return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
  };
}

/**
 * Right fold that stops when accumulator predicate fails.
 *
 * @tsplus pipeable fncts.ReadonlyArray foldRighWhile
 */
export function foldRightWhile<A, B>(b: B, p: Predicate<B>, f: (a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): B => {
    return self.foldRightWithIndexWhile(b, p, (_, a, b) => f(a, b));
  };
}

/**
 * Index-aware right-associative fold.
 *
 * @tsplus pipeable fncts.ReadonlyArray foldRightWithIndex
 */
export function foldRightWithIndex<A, B>(b: B, f: (i: number, a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): B => {
    let r = b;
    for (let i = self.length - 1; i >= 0; i--) {
      r = f(i, self[i]!, r);
    }
    return r;
  };
}

/**
 * Index-aware right fold with early termination.
 *
 * @tsplus pipeable fncts.ReadonlyArray foldRightWithIndexWhile
 */
export function foldRightWithIndexWhile<A, B>(b: B, predicate: Predicate<B>, f: (i: number, a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): B => {
    let out  = b;
    let cont = predicate(out);
    for (let i = self.length - 1; cont && i >= 0; i--) {
      out  = f(i, self[i]!, out);
      cont = predicate(out);
    }
    return out;
  };
}

/**
 * Applies `f` to each element for side effects.
 *
 * @tsplus pipeable fncts.ReadonlyArray forEach
 */
export function forEach<A, B>(f: (a: A) => B) {
  return (self: ReadonlyArray<A>): void => {
    return self.forEach(f);
  };
}

/**
 * Wraps a non-array value in an array, preserving arrays as-is.
 *
 * @tsplus static fncts.ArrayOps fromValue
 */
export function fromValue<A>(value: A): A extends Array<any> ? A : A extends ReadonlyArray<any> ? A : ReadonlyArray<A> {
  if (Array.isArray(value)) {
    return value as ReturnType<typeof fromValue<A>>;
  } else {
    return [value] as ReturnType<typeof fromValue<A>>;
  }
}

/**
 * Gets the element at index `i` as a `Maybe`.
 *
 * @tsplus pipeable fncts.ReadonlyArray get
 *
 * @tsplus pipeable fncts.MutableArray get
 */
export function get(i: number) {
  return <A>(self: ReadonlyArray<A>): Maybe<A> => {
    return self.isOutOfBound(i) ? Nothing() : Just(self[i]!);
  };
}

/**
 * Groups adjacent equal elements into non-empty chunks.
 *
 * @tsplus pipeable fncts.ReadonlyArray group
 */
export function group<A>(E: P.Eq<A>): (self: ReadonlyArray<A>) => ReadonlyArray<ReadonlyNonEmptyArray<A>> {
  return chop((self) => {
    const h   = self[0]!;
    const out = [h];
    let i     = 1;
    for (; i < self.length; i++) {
      const a = self[i]!;
      if (E.equals(h)(a)) {
        out.push(a);
      } else {
        break;
      }
    }
    return [out.unsafeAsNonEmptyArray, self.slice(i)];
  });
}

/**
 * Groups elements into a record using a string key selector.
 *
 * @tsplus pipeable fncts.ReadonlyArray groupBy
 */
export function groupBy<A>(f: (a: A) => string) {
  return (self: ReadonlyArray<A>): Readonly<Record<string, ReadonlyNonEmptyArray<A>>> => {
    const out: Record<string, NonEmptyArray<A>> = {};
    for (let i = 0; i < self.length; i++) {
      const a = self[i]!;
      const k = f(a);
      if (Object.prototype.hasOwnProperty.call(out, k)) {
        out[k]!.push(a);
      } else {
        out[k] = [a];
      }
    }
    return Dictionary.get(out).map(ReadonlyNonEmptyArray.from).toRecord;
  };
}

/**
 * Returns the first element as a `Maybe`.
 *
 * @tsplus getter fncts.ReadonlyArray head
 */
export function head<A>(self: ReadonlyArray<A>): Maybe<A> {
  return self.isNonEmpty() ? Just(self[0]) : Nothing();
}

/**
 * Returns all elements except the last as a `Maybe`.
 *
 * @tsplus getter fncts.ReadonlyArray init
 */
export function init<A>(self: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> {
  const len = self.length;
  return len === 0 ? Nothing() : Just(self.slice(0, len - 1));
}

/**
 * Inserts a value at index `i`.
 *
 * @tsplus pipeable fncts.ReadonlyArray insertAt
 */
export function insertAt<A>(i: number, a: A) {
  return (self: ReadonlyArray<A>): Maybe<ReadonlyNonEmptyArray<A>> => {
    return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeInsertAt(i, a));
  };
}

/**
 * Keeps elements present in both arrays.
 *
 * @tsplus pipeable fncts.ReadonlyArray intersection
 */
export function intersection<A>(that: ReadonlyArray<A>, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.filter((a) => that.elem(a, E));
  };
}

/**
 * Inserts `middle` between all adjacent elements.
 *
 * @tsplus pipeable fncts.ReadonlyArray intersperse
 */
export function intersperse<A>(a: A) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    const len = self.length;
    return len === 0 ? self : self.slice(1, len).prependAll(a).prepend(self[0]!);
  };
}

/**
 * Checks whether an array is empty.
 *
 * @tsplus fluent fncts.ReadonlyArray isEmpty
 */
export function isEmpty<A>(self: ReadonlyArray<A>): boolean {
  return self.length === 0;
}

/**
 * Checks whether an array is non-empty.
 *
 * @tsplus fluent fncts.ReadonlyArray isNonEmpty
 */
export function isNonEmpty<A>(self: ReadonlyArray<A>): self is ReadonlyNonEmptyArray<A> {
  return self.length > 0;
}

/**
 * Checks whether index `i` is out of bounds.
 *
 * @tsplus pipeable fncts.ReadonlyArray isOutOfBound
 */
export function isOutOfBound(i: number) {
  return <A>(self: ReadonlyArray<A>): boolean => {
    return i < 0 || i >= self.length;
  };
}

/**
 * Joins elements into a string using `separator`.
 *
 * @tsplus pipeable fncts.ReadonlyArray join
 */
export function join(separator: string) {
  return (self: ReadonlyArray<string>): string => {
    return self.join(separator);
  };
}

/**
 * Returns the last element as a `Maybe`.
 *
 * @tsplus getter fncts.ReadonlyArray last
 */
export function last<A>(self: ReadonlyArray<A>): Maybe<A> {
  return self.get(self.length - 1);
}

/**
 * Collects `Left` values from an array of `Either`.
 *
 * @tsplus getter fncts.ReadonlyArray lefts
 */
export function lefts<E, A>(self: ReadonlyArray<Either<E, A>>): ReadonlyArray<E> {
  const ls: Array<E> = [];
  for (let i = 0; i < self.length; i++) {
    const a = self[i]!;
    Either.concrete(a);
    if (a._tag === EitherTag.Left) {
      ls.push(a.left);
    }
  }
  return ls;
}

/**
 * Returns the array length.
 *
 * @tsplus getter fncts.ReadonlyArray length
 */
export function length<A>(self: ReadonlyArray<A>): number {
  return self.length;
}

/**
 * Maps each element with `f`.
 *
 * @tsplus pipeable fncts.ReadonlyArray map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * Maps while threading an accumulator state.
 *
 * @tsplus pipeable fncts.ReadonlyArray mapAccum
 */
export function mapAccum<A, S, B>(s: S, f: (s: S, a: A) => readonly [B, S]) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<B>, S] => {
    const bs  = Array<B>(self.length);
    let state = s;
    for (let i = 0; i < self.length; i++) {
      const result = f(state, self[i]!);
      bs[i]        = result[0];
      state        = result[1];
    }
    return [bs, state];
  };
}

/**
 * Maps each element with its index.
 *
 * @tsplus pipeable fncts.ReadonlyArray mapWithIndex
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    const len = self.length;
    const bs  = Array<B>(len);
    for (let i = 0; i < len; i++) {
      bs[i] = f(i, self[i]!);
    }
    return bs;
  };
}

/**
 * Modifies the element at index `i` with `f`.
 *
 * @tsplus pipeable fncts.ReadonlyArray modifyAt
 */
export function modifyAt<A>(i: number, f: (a: A) => A) {
  return (self: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> => {
    return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeModifyAt(i, f));
  };
}

/**
 * Creates a mutable shallow copy of the array.
 *
 * @tsplus getter fncts.ReadonlyArray mutableClone
 */
export function mutableClone<A>(self: ReadonlyArray<A>): Array<A> {
  return self.slice(0);
}

/**
 * Applies a mutation to a cloned array and returns it as readonly.
 *
 * @tsplus pipeable fncts.ReadonlyArray mutate
 */
export function mutate<A>(f: (self: Array<A>) => void) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    const mut = mutableClone(self);
    f(mut);
    return mut;
  };
}

/**
 * Splits elements by predicate into excluded and included arrays.
 *
 * @tsplus pipeable fncts.ReadonlyArray partition
 */
export function partition<A, B extends A>(
  p: Refinement<A, B>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<B>];
export function partition<A>(
  p: Predicate<A>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<A>];
export function partition<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] => {
    return self.partitionWithIndex((_, a) => p(a));
  };
}

/**
 * Maps elements to `Either` and partitions `Left` and `Right`.
 *
 * @tsplus pipeable fncts.ReadonlyArray partitionMap
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<B>, ReadonlyArray<C>] => {
    return self.partitionMapWithIndex((_, a) => f(a));
  };
}

/**
 * Index-aware `partitionMap`.
 *
 * @tsplus pipeable fncts.ReadonlyArray partitionMapWithIndex
 */
export function partitionMapWithIndex<A, B, C>(f: (i: number, a: A) => Either<B, C>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<B>, ReadonlyArray<C>] => {
    const left  = [] as Array<B>;
    const right = [] as Array<C>;
    for (let i = 0; i < self.length; i++) {
      const ea = f(i, self[i]!);
      Either.concrete(ea);
      switch (ea._tag) {
        case EitherTag.Left:
          left.push(ea.left);
          break;
        case EitherTag.Right:
          right.push(ea.right);
          break;
      }
    }
    return [left, right];
  };
}

/**
 * Index-aware `partition`.
 *
 * @tsplus pipeable fncts.ReadonlyArray partitionWithIndex
 */
export function partitionWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<B>];
export function partitionWithIndex<A>(
  p: PredicateWithIndex<number, A>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<A>];
export function partitionWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] => {
    const left: Array<A>  = [];
    const right: Array<A> = [];
    for (let i = 0; i < self.length; i++) {
      const a = self[i]!;
      if (p(i, a)) {
        right.push(a);
      } else {
        left.push(a);
      }
    }
    return [left, right];
  };
}

/**
 * Prepends a value to the beginning of an array.
 *
 * @tsplus pipeable fncts.ReadonlyArray prepend
 */
export function prepend<B>(head: B) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A | B> => {
    const len = self.length;
    const out = Array<A | B>(len + 1);
    out[0]    = head;
    for (let i = 0; i < len; i++) {
      out[i + 1] = self[i]!;
    }
    return out;
  };
}

/**
 * Prepends `middle` before every element.
 *
 * @tsplus pipeable fncts.ReadonlyArray prependAll
 *
 * @tsplus pipeable fncts.Array prependAll
 */
export function prependAll<A>(a: A) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    const out: Array<A> = [];
    for (let i = 0; i < self.length; i++) {
      out.push(a, self[i]!);
    }
    return out;
  };
}

/**
 * Returns a reversed copy of the array.
 *
 * @tsplus getter fncts.ReadonlyArray reverse
 */
export function reverse<A>(self: ReadonlyArray<A>): ReadonlyArray<A> {
  if (self.isEmpty()) {
    return self;
  } else if (self.length === 1) {
    return [self[0]!];
  } else {
    const out = Array<A>(self.length);
    for (let j = 0, i = self.length - 1; i >= 0; i--, j++) {
      out[j] = self[i]!;
    }
    return out;
  }
}

/**
 * Collects `Right` values from an array of `Either`.
 *
 * @tsplus getter fncts.ReadonlyArray rights
 */
export function rights<E, A>(self: ReadonlyArray<Either<E, A>>): ReadonlyArray<A> {
  const rs: Array<A> = [];
  for (let i = 0; i < self.length; i++) {
    const a = self[i]!;
    Either.concrete(a);
    if (a._tag === EitherTag.Right) {
      rs.push(a.right);
    }
  }
  return rs;
}

/**
 * Rotates elements by `n` positions.
 *
 * @tsplus pipeable fncts.ReadonlyArray rotate
 */
export function rotate(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => {
    const len = self.length;
    if (n === 0 || len <= 1 || len === Math.abs(n)) {
      return self;
    } else if (n < 0) {
      return self.rotate(len + n);
    } else {
      return self.slice(-n).concat(self.slice(0, len - n));
    }
  };
}

/**
 * Returns intermediate accumulator states of a left fold.
 *
 * @tsplus pipeable fncts.ReadonlyArray scanLeft
 */
export function scanLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    const l = self.length;
    const r = Array(l + 1);
    r[0]    = b;
    for (let i = 0; i < l; i++) {
      r[i + 1] = f(r[i]!, self[i]!);
    }
    return r;
  };
}

/**
 * Returns intermediate accumulator states of a right fold.
 *
 * @tsplus pipeable fncts.ReadonlyArray scanRight
 */
export function scanRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    const l = self.length;
    const r = Array(l + 1);
    r[l]    = b;
    for (let i = l - 1; i >= 0; i--) {
      r[i] = f(self[i]!, r[i + 1]!);
    }
    return r;
  };
}

/**
 * Checks whether at least one element satisfies a predicate.
 *
 * @tsplus pipeable fncts.ReadonlyArray some
 */
export function some<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): self is ReadonlyNonEmptyArray<A> => {
    let result = false;
    let i      = 0;
    while (!result && i < self.length) {
      result = p(self[i]!);
      i++;
    }
    return result;
  };
}

/**
 * Sorts a copy of the array using an `Ord` instance.
 *
 * @tsplus pipeable fncts.ReadonlyArray sort
 */
export function sort<A>(/** @tsplus auto */ O: P.Ord<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.isEmpty() || self.length === 1 ? self : self.slice().sort((a, b) => O.compare(b)(a));
  };
}

/**
 * Sorts using multiple orderings.
 *
 * @tsplus pipeable fncts.ReadonlyArray sortBy
 */
export function sortBy<A>(Os: ReadonlyArray<P.Ord<A>>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.sort(Os.fold(P.Ord.getMonoid()));
  };
}

/**
 * Returns the first index where predicate `p` fails from the left.
 *
 * @tsplus pipeable fncts.ReadonlyArray spanIndexLeft
 */
export function spanIndexLeft<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): number => {
    const l = self.length;
    let i   = 0;
    for (; i < l; i++) {
      if (!p(self[i]!)) {
        break;
      }
    }
    return i;
  };
}
/**
 * Returns the last index where predicate `p` fails from the right.
 *
 * @tsplus pipeable fncts.ReadonlyArray spanIndexRight
 */
export function spanIndexRight<A>(predicate: Predicate<A>) {
  return (as: ReadonlyArray<A>): number => {
    let i = as.length - 1;
    for (; i >= 0; i--) {
      if (!predicate(as[i]!)) {
        break;
      }
    }
    return i;
  };
}
/**
 * Splits at the first element that does not satisfy `p`.
 *
 * @tsplus pipeable fncts.ReadonlyArray spanLeft
 */
export function spanLeft<A, B extends A>(
  p: Refinement<A, B>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<B>, ReadonlyArray<A>];
export function spanLeft<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<A>];
export function spanLeft<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] => {
    const i    = self.spanIndexLeft(p);
    const init = Array<A>(i);
    for (let j = 0; j < i; j++) {
      init[j] = self[j]!;
    }
    const l    = self.length;
    const rest = Array<A>(l - i);
    for (let j = i; j < l; j++) {
      rest[j - i] = self[j]!;
    }
    return [init, rest];
  };
}
/**
 * Splits at the last suffix of elements that satisfy `p`.
 *
 * @tsplus pipeable fncts.ReadonlyArray spanRight
 */
export function spanRight<A, B extends A>(
  p: Refinement<A, B>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<B>];
export function spanRight<A>(
  p: Predicate<A>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<A>];
export function spanRight<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] => {
    const i    = self.spanIndexRight(p);
    const l    = self.length;
    const tail = Array<A>(l - i - 1);
    for (let j = l - 1; j > i; j--) {
      tail[j - i - 1] = self[j]!;
    }
    const rest = Array<A>(i);
    for (let j = i; j >= 0; j--) {
      rest[j] = self[j]!;
    }
    return [rest, tail];
  };
}

/**
 * Returns all elements except the first as a `Maybe`.
 *
 * @tsplus getter fncts.ReadonlyArray tail
 */
export function tail<A>(self: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> {
  return self.isNonEmpty() ? Just(self.slice(1)) : Nothing();
}

/**
 * Takes the first `n` elements.
 *
 * @tsplus pipeable fncts.ReadonlyArray take
 */
export function take(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.slice(0, n);
  };
}

/**
 * Takes the last `n` elements.
 *
 * @tsplus pipeable fncts.ReadonlyArray takeLast
 */
export function takeLast(n: number) {
  return <A>(as: ReadonlyArray<A>): ReadonlyArray<A> => {
    return isEmpty(as) ? [] : as.slice(-n);
  };
}

/**
 * Takes elements from the left while `p` holds.
 *
 * @tsplus pipeable fncts.ReadonlyArray takeWhile
 */
export function takeWhile<A, B extends A>(p: Refinement<A, B>): (self: ReadonlyArray<A>) => ReadonlyArray<B>;
export function takeWhile<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => ReadonlyArray<A>;
export function takeWhile<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    const i    = self.spanIndexLeft(p);
    const init = Array<A>(i);
    for (let j = 0; j < i; j++) {
      init[j] = self[j]!;
    }
    return init;
  };
}

/**
 * Traverses an array with an applicative effect.
 *
 * @tsplus getter fncts.ReadonlyArray traverse
 */
export function traverse_<A>(
  self: ReadonlyArray<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ReadonlyArray<B>> {
  return (G) => (f) => self.traverseWithIndex(G)((_, a) => f(a));
}

/**
 * Index-aware applicative traversal.
 *
 * @tsplus getter fncts.ReadonlyArray traverseWithIndex
 */
export function traverseWithIndex_<A>(
  self: ReadonlyArray<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ReadonlyArray<B>>;
export function traverseWithIndex_<A>(
  self: ReadonlyArray<A>,
): <G>(G: P.Applicative<HKT.F<G>>) => <B>(f: (i: number, a: A) => HKT.FK1<G, B>) => HKT.FK1<G, ReadonlyArray<B>> {
  return (G) => (f) =>
    self.foldLeftWithIndex(G.pure(Array.empty()), (i, fbs, a) =>
      pipe(
        fbs,
        G.zipWith(f(i, a), (bs, b) => bs.append(b)),
      ),
    );
}

/** Applies an indexed effectful map and collects results in order. */
export const traverseWithIndex: P.TraversableWithIndex<ReadonlyArrayF>["traverseWithIndex"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)(f);

/** Applies an effectful map and collects results in order. */
export const traverse: P.Traversable<ReadonlyArrayF>["traverse"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)((_, a) => f(a));

/**
 * Returns the union of two arrays using equality `E`.
 *
 * @tsplus pipeable fncts.ReadonlyArray union
 */
export function union<A>(that: ReadonlyArray<A>, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.concat(that.filter((a) => !self.elem(a, E)));
  };
}

/**
 * Removes duplicate values, keeping the first occurrence.
 *
 * @tsplus pipeable fncts.ReadonlyArray uniq
 */
export function uniq<A>(/** @tsplus auto */ E: P.Eq<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    if (self.length === 1) {
      return self;
    }
    const out = [] as Array<A>;
    const len = self.length;
    for (let i = 0; i < len; i++) {
      const a = self[i]!;
      if (!out.elem(a, E)) {
        out.push(a);
      }
    }
    return out;
  };
}

/**
 * Splits an array into head and tail as a `Maybe`.
 *
 * @tsplus getter fncts.ReadonlyArray unprepend
 */
export function unprepend<A>(self: ReadonlyArray<A>): Maybe<readonly [A, ReadonlyArray<A>]> {
  return self.isNonEmpty() ? Just([self[0]!, self.slice(1)]) : Nothing();
}

/**
 * Casts a readonly array to a mutable array.
 *
 * @tsplus getter fncts.ReadonlyArray unsafeAsMutable
 */
export function unsafeAsMutable<A>(self: ReadonlyArray<A>): Array<A> {
  return self as Array<A>;
}

/**
 * Deletes an element at index `i` without bounds checking.
 *
 * @tsplus pipeable fncts.ReadonlyArray unsafeDeleteAt
 */
export function unsafeDeleteAt(i: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.mutate((xs) => {
      xs.splice(i, 1);
    });
  };
}

/**
 * Inserts a value at index `i` without bounds checking.
 *
 * @tsplus pipeable fncts.ReadonlyArray unsafeInsertAt
 */
export function unsafeInsertAt<A>(i: number, a: A) {
  return (as: ReadonlyArray<A>): ReadonlyNonEmptyArray<A> => {
    return as.mutate((xs) => {
      xs.splice(i, 0, a);
    }) as unknown as ReadonlyNonEmptyArray<A>;
  };
}

/**
 * Modifies an element at index `i` without bounds checking.
 *
 * @tsplus pipeable fncts.ReadonlyArray unsafeModifyAt
 */
export function unsafeModifyAt<A>(i: number, f: (a: A) => A) {
  return (as: ReadonlyArray<A>): ReadonlyArray<A> => {
    const next = f(as[i]!);
    if (as[i] === next) {
      return as;
    }
    return as.mutate((xs) => {
      xs[i] = next;
    });
  };
}

/**
 * Updates an element at index `i` without bounds checking.
 *
 * @tsplus pipeable fncts.ReadonlyArray unsafeUpdateAt
 */
export function unsafeUpdateAt<A>(i: number, a: A) {
  return (as: ReadonlyArray<A>): ReadonlyArray<A> => {
    if (as[i] === a) {
      return as;
    } else {
      return as.mutate((xs) => {
        xs[i] = a;
      });
    }
  };
}

/**
 * Splits an array of tuples into a tuple of arrays.
 *
 * @tsplus getter fncts.ReadonlyArray unzip
 */
export function unzip<A, B>(self: ReadonlyArray<readonly [A, B]>): readonly [ReadonlyArray<A>, ReadonlyArray<B>] {
  const fa = Array<A>(self.length);
  const fb = Array<B>(self.length);

  for (let i = 0; i < self.length; i++) {
    fa[i] = self[i]![0]!;
    fb[i] = self[i]![1]!;
  }

  return [fa, fb];
}

/**
 * Updates the element at index `i`.
 *
 * @tsplus pipeable fncts.ReadonlyArray updateAt
 */
export function updateAt<A>(i: number, a: A) {
  return (as: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> => {
    return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeUpdateAt(i, a));
  };
}

/**
 * Traverses with effects and partitions `Either` results.
 *
 * @tsplus getter fncts.ReadonlyArray wilt
 */
export function wilt_<A>(self: ReadonlyArray<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B, B2>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Either<B, B2>>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, readonly [ReadonlyArray<B>, ReadonlyArray<B2>]> =>
      self.wiltWithIndex(G)((_, a) => f(a));
}

/**
 * Index-aware effectful partitioning traversal.
 *
 * @tsplus getter fncts.ReadonlyArray wiltWithIndex
 */
export function wiltWithIndex_<A>(self: ReadonlyArray<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B, B2>(
      f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Either<B, B2>>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, readonly [ReadonlyArray<B>, ReadonlyArray<B2>]> =>
      self
        .foldLeftWithIndex(G.pure([[] as Array<B>, [] as Array<B2>] as const), (i, fbs, a) =>
          f(i, a).pipe(
            G.zipWith(fbs, (eb, r) =>
              eb.match(
                (b1) => {
                  r[0].push(b1);
                  return r;
                },
                (b2) => {
                  r[1].push(b2);
                  return r;
                },
              ),
            ),
          ),
        )
        .pipe(G.map(([b1s, b2s]) => [b1s, b2s]));
}

/**
 * Traverses with effects and filters `Maybe` results.
 *
 * @tsplus getter fncts.ReadonlyArray wither
 */
export function wither_<A>(self: ReadonlyArray<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Maybe<B>>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ReadonlyArray<B>> =>
      self.witherWithIndex(G)((_, a) => f(a));
}

/**
 * Index-aware effectful filtering traversal.
 *
 * @tsplus getter fncts.ReadonlyArray witherWithIndex
 */
export function witherWithIndex_<A>(self: ReadonlyArray<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B>(
      f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Maybe<B>>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ReadonlyArray<B>> =>
      self
        .foldLeftWithIndex(G.pure([] as Array<B>), (i, b, a) =>
          f(i, a).pipe(
            G.zipWith(b, (maybeB, bs) => {
              if (maybeB.isJust()) {
                bs.push(maybeB.value);
              }
              return bs;
            }),
          ),
        )
        .pipe(G.map((bs) => bs));
}

/** Runs an indexed effectful partition and accumulates left and right outputs. */
export const wiltWithIndex: P.WitherableWithIndex<ReadonlyArrayF>["wiltWithIndex"] = (G) => (f) => (self) =>
  self.wiltWithIndex(G)(f);

/** Runs an effectful partition and accumulates left and right outputs. */
export const wilt: P.WitherableWithIndex<ReadonlyArrayF>["wilt"] = (G) => (f) => (self) =>
  self.wiltWithIndex(G)((_, a) => f(a));

/** Runs an indexed effectful filter and keeps `Just` results. */
export const witherWithIndex: P.WitherableWithIndex<ReadonlyArrayF>["witherWithIndex"] = (G) => (f) => (self) =>
  self.witherWithIndex(G)(f);

/** Runs an effectful filter and keeps `Just` results. */
export const wither: P.Witherable<ReadonlyArrayF>["wither"] = (G) => (f) => (self) =>
  self.witherWithIndex(G)((_, a) => f(a));

/**
 * Zips two arrays into tuples up to the shorter length.
 *
 * @tsplus pipeable fncts.ReadonlyArray zip
 */
export function zip<B>(that: ReadonlyArray<B>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<readonly [A, B]> => {
    return self.zipWith(that, tuple);
  };
}

/**
 * Zips two arrays with a combining function.
 *
 * @tsplus pipeable fncts.ReadonlyArray zipWith
 */
export function zipWith<A, B, C>(fb: ReadonlyArray<B>, f: (a: A, b: B) => C) {
  return (self: ReadonlyArray<A>): ReadonlyArray<C> => {
    const len = Math.min(self.length, fb.length);
    const fc  = Array<C>(len);
    for (let i = 0; i < len; i++) {
      fc[i] = f(self[i]!, fb[i]!);
    }
    return fc;
  };
}
