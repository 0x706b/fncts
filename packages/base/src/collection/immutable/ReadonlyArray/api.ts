import type { ReadonlyArrayF } from "@fncts/base/collection/immutable/ReadonlyArray/definition";
import type { Monoid } from "@fncts/base/typeclass";

import { EitherTag } from "@fncts/base/data/Either";
import { identity, pipe, tuple } from "@fncts/base/data/function";
import * as P from "@fncts/base/typeclass";

/**
 * @tsplus pipeable fncts.ReadonlyArray align
 * @tsplus pipeable fncts.Array align
 */
export function align<B>(fb: ReadonlyArray<B>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<These<A, B>> => {
    return self.alignWith(fb, identity);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray alignWith
 * @tsplus pipeable fncts.Array alignWith
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
 * @tsplus pipeable fncts.ReadonlyArray alt
 * @tsplus pipeable fncts.Array alt
 */
export function alt<B>(that: Lazy<ReadonlyArray<B>>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A | B> => {
    return (<ReadonlyArray<A | B>>self).concat(that());
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray ap
 * @tsplus pipeable fncts.Array ap
 */
export function ap<A>(fa: ReadonlyArray<A>) {
  return <B>(self: ReadonlyArray<(a: A) => B>): ReadonlyArray<B> => {
    return self.flatMap((f) => fa.map(f));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray append
 * @tsplus pipeable fncts.Array append
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
 * @tsplus static fncts.ReadonlyArrayOps chainRecBreadthFirst
 * @tsplus static fncts.ArrayOps chainRecBreadthFirst
 */
export function chainRecBreadthFirst<A, B>(a: A, f: (a: A) => ReadonlyArray<Either<A, B>>): ReadonlyArray<B> {
  const initial                     = f(a);
  const buffer: Array<Either<A, B>> = [];
  const out: Array<B>               = [];

  function go(e: Either<A, B>): void {
    Either.concrete(e);
    if (e._tag === EitherTag.Left) {
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
 * @tsplus static fncts.ReadonlyArrayOps chainRecDepthFirst
 * @tsplus static fncts.ArrayOps chainRecDepthFirst
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
 * @tsplus pipeable fncts.Array chop
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
 * @tsplus pipeable fncts.ReadonlyArray collectWhile
 * @tsplus pipeable fncts.Array collectWhile
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
 * @tsplus static fncts.ReadonlyArrayOps comprehension
 * @tsplus static fncts.ArrayOps comprehension
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
      .traverse(Eval.Applicative)((a) => comprehensionLoop(scope.prepend(a), input.slice(1), f, g))
      .map((rs) => rs.flatten);
  }
}

/**
 * @tsplus pipeable fncts.ReadonlyArray concat
 * @tsplus pipeable fncts.Array concat
 * @tsplus pipeable-operator fncts.ReadonlyArray +
 * @tsplus pipeable-operator fncts.Array +
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
 * @tsplus pipeable fncts.ReadonlyArray cross
 * @tsplus pipeable fncts.Array cross
 */
export function cross<B>(fb: ReadonlyArray<B>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<Zipped.Make<A, B>> => {
    return self.crossWith(fb, (a, b) => Zipped(a, b));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray crossWith
 * @tsplus pipeable fncts.Array crossWith
 */
export function crossWith<A, B, C>(fb: ReadonlyArray<B>, f: (a: A, b: B) => C) {
  return (self: ReadonlyArray<A>): ReadonlyArray<C> => {
    return self.flatMap((a) => fb.map((b) => f(a, b)));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray deleteAt
 * @tsplus pipeable fncts.Array deleteAt
 */
export function deleteAt(i: number) {
  return <A>(as: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> => {
    return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeDeleteAt(i));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray difference
 * @tsplus pipeable fncts.Array difference
 */
export function difference<A>(ys: ReadonlyArray<A>, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.filter((a) => !ys.elem(a, E));
  };
}
/**
 * @tsplus pipeable fncts.ReadonlyArray drop
 * @tsplus pipeable fncts.Array drop
 */
export function drop(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.slice(n);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray dropLast
 * @tsplus pipeable fncts.Array dropLast
 */
export function dropLast(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.slice(0, self.length - n);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray dropLastWhile
 * @tsplus pipeable fncts.Array dropLastWhile
 */
export function dropLastWhile<A>(p: Predicate<A>) {
  return (as: ReadonlyArray<A>): ReadonlyArray<A> => {
    return as.slice(0, as.spanIndexRight(p) + 1);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray dropWhile
 * @tsplus pipeable fncts.Array dropWhile
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
 * @tsplus pipeable fncts.ReadonlyArray every
 * @tsplus pipeable fncts.Array every
 */
export function every<A, B extends A>(p: Refinement<A, B>): (self: ReadonlyArray<A>) => self is ReadonlyArray<B>;
export function every<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => boolean;
export function every<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): boolean => {
    return self.everyWithIndex((_, a) => p(a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray everyWithIndex
 * @tsplus pipeable fncts.Array everyWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray filter
 * @tsplus pipeable fncts.Array filter
 */
export function filter<A, B extends A>(p: Refinement<A, B>): (self: ReadonlyArray<A>) => ReadonlyArray<B>;
export function filter<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => ReadonlyArray<A>;
export function filter<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.filterWithIndex((_, a) => p(a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray filterMap
 * @tsplus pipeable fncts.Array filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    return self.filterMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.Array filterMap
 * @tsplus pipeable fncts.ReadonlyArray filterMap
 * @tsplus pipeable fncts.Array filterMap
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
 * @tsplus pipeable fncts.ReadonlyArray filterMapWithIndex
 * @tsplus pipeable fncts.Array filterMapWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray filterWithIndex
 * @tsplus pipeable fncts.Array filterWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray find
 * @tsplus pipeable fncts.Array find
 */
export function find<A, B extends A>(p: Refinement<A, B>): (self: ReadonlyArray<A>) => Maybe<B>;
export function find<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => Maybe<A>;
export function find<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): Maybe<A> => {
    return self.findWithIndex((_, a) => p(a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray findIndex
 * @tsplus pipeable fncts.Array findIndex
 */
export function findIndex<A>(predicate: Predicate<A>) {
  return (as: ReadonlyArray<A>): Maybe<number> => {
    return as.findMapWithIndex((i, a) => (predicate(a) ? Just(i) : Nothing()));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray findLast
 * @tsplus pipeable fncts.Array findLast
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
 * @tsplus pipeable fncts.ReadonlyArray findLastIndex
 * @tsplus pipeable fncts.Array findLastIndex
 */
export function findLastIndex<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): Maybe<number> => {
    return self.findLastMapWithIndex((i, a) => (p(a) ? Just(i) : Nothing()));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray findLastMap
 * @tsplus pipeable fncts.Array findLastMap
 */
export function findLastMap<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): Maybe<B> => {
    return as.findLastMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray findLastMapWithIndex
 * @tsplus pipeable fncts.Array findLastMapWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray findMap
 * @tsplus pipeable fncts.Array findMap
 */
export function findMap<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): Maybe<B> => {
    return as.findMapWithIndex((_, a) => f(a));
  };
}
/**
 * @tsplus pipeable fncts.ReadonlyArray findMapWithIndex
 * @tsplus pipeable fncts.Array findMapWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray findWithIndex
 * @tsplus pipeable fncts.Array findWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray flatMap
 * @tsplus pipeable fncts.Array flatMap
 */
export function flatMap<A, B>(f: (a: A) => ReadonlyArray<B>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    return self.flatMapWithIndex((_, a) => f(a));
  };
}
/**
 * @tsplus pipeable fncts.ReadonlyArray flatMapWithIndex
 * @tsplus pipeable fncts.Array flatMapWithIndex
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
 * @tsplus getter fncts.ReadonlyArray flatten
 * @tsplus getter fncts.Array flatten
 */
export function flatten<A>(self: ReadonlyArray<ReadonlyArray<A>>): ReadonlyArray<A> {
  return self.flatMap(identity);
}

/**
 * @tsplus pipeable fncts.ReadonlyArray fold
 * @tsplus pipeable fncts.Array fold
 */
export function fold<M>(/** @tsplus auto */ M: Monoid<M>) {
  return (self: ReadonlyArray<M>): M => {
    return self.foldLeft(M.nat, (b, a) => M.combine(a)(b));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray foldLeft
 * @tsplus pipeable fncts.Array foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray foldLeftWhile
 * @tsplus pipeable fncts.Array foldLeftWhile
 */
export function foldLeftWhile<A, B>(b: B, p: Predicate<B>, f: (b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    return self.foldLeftWithIndexWhile(b, p, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray foldLeftWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray foldLeftWithIndexWhile
 * @tsplus pipeable fncts.Array foldLeftWithIndexWhile
 */
export function foldLeftWithIndexWhile<A, B>(b: B, p: Predicate<B>, f: (i: number, b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    let out = b;
    for (let i = 0; i < self.length && p(out); i++) {
      out = f(i, out, self[i]!);
    }
    return out;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray foldMap
 * @tsplus pipeable fncts.Array foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: Monoid<M>) {
  return (self: ReadonlyArray<A>): M => {
    return self.foldMapWithIndex((_, a) => f(a), M);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray foldMapWithIndex
 * @tsplus pipeable fncts.Array foldMapWithIndex
 */
export function foldMapWithIndex<A, M>(f: (i: number, a: A) => M, /** @tsplus auto */ M: Monoid<M>) {
  return (self: ReadonlyArray<A>): M => {
    return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(f(i, a))(b));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray foldRight
 * @tsplus pipeable fncts.Array foldRight
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): B => {
    return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray foldRighWhile
 * @tsplus pipeable fncts.Array foldRighWhile
 */
export function foldRightWhile<A, B>(b: B, p: Predicate<B>, f: (a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): B => {
    return self.foldRightWithIndexWhile(b, p, (_, a, b) => f(a, b));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray foldRightWithIndex
 * @tsplus pipeable fncts.Array foldRightWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray foldRightWithIndexWhile
 * @tsplus pipeable fncts.Array foldRightWithIndexWhile
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
 * @tsplus pipeable fncts.ReadonlyArray forEach
 * @tsplus pipeable fncts.Array forEach
 */
export function forEach<A, B>(f: (a: A) => B) {
  return (self: ReadonlyArray<A>): void => {
    return self.forEach(f);
  };
}

/**
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
 * @tsplus pipeable fncts.ReadonlyArray get
 * @tsplus pipeable fncts.Array get
 * @tsplus pipeable fncts.MutableArray get
 */
export function get(i: number) {
  return <A>(self: ReadonlyArray<A>): Maybe<A> => {
    return self.isOutOfBound(i) ? Nothing() : Just(self[i]!);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray group
 * @tsplus pipeable fncts.Array group
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
 * @tsplus pipeable fncts.ReadonlyArray groupBy
 * @tsplus pipeable fncts.Array groupBy
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
 * @tsplus getter fncts.ReadonlyArray head
 * @tsplus getter fncts.Array head
 */
export function head<A>(self: ReadonlyArray<A>): Maybe<A> {
  return self.isNonEmpty() ? Just(self[0]) : Nothing();
}

/**
 * @tsplus getter fncts.ReadonlyArray init
 * @tsplus getter fncts.Array init
 */
export function init<A>(self: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> {
  const len = self.length;
  return len === 0 ? Nothing() : Just(self.slice(0, len - 1));
}

/**
 * @tsplus pipeable fncts.ReadonlyArray insertAt
 * @tsplus pipeable fncts.Array insertAt
 */
export function insertAt<A>(i: number, a: A) {
  return (self: ReadonlyArray<A>): Maybe<ReadonlyNonEmptyArray<A>> => {
    return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeInsertAt(i, a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray intersection
 * @tsplus pipeable fncts.Array intersection
 */
export function intersection<A>(that: ReadonlyArray<A>, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.filter((a) => that.elem(a, E));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray intersperse
 * @tsplus pipeable fncts.Array intersperse
 */
export function intersperse<A>(a: A) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    const len = self.length;
    return len === 0 ? self : self.slice(1, len).prependAll(a).prepend(self[0]!);
  };
}

/**
 * @tsplus fluent fncts.Array isEmpty
 * @tsplus fluent fncts.ReadonlyArray isEmpty
 * @tsplus fluent fncts.Array isEmpty
 */
export function isEmpty<A>(self: ReadonlyArray<A>): boolean {
  return self.length === 0;
}

/**
 * @tsplus fluent fncts.Array isNonEmpty
 * @tsplus fluent fncts.ReadonlyArray isNonEmpty
 * @tsplus fluent fncts.Array isNonEmpty
 */
export function isNonEmpty<A>(self: ReadonlyArray<A>): self is ReadonlyNonEmptyArray<A> {
  return self.length > 0;
}

/**
 * @tsplus pipeable fncts.ReadonlyArray isOutOfBound
 * @tsplus pipeable fncts.Array isOutOfBound
 */
export function isOutOfBound(i: number) {
  return <A>(self: ReadonlyArray<A>): boolean => {
    return i < 0 || i >= self.length;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray join
 * @tsplus pipeable fncts.Array join
 */
export function join(separator: string) {
  return (self: ReadonlyArray<string>): string => {
    return self.join(separator);
  };
}

/**
 * @tsplus getter fncts.ReadonlyArray last
 * @tsplus getter fncts.Array last
 */
export function last<A>(self: ReadonlyArray<A>): Maybe<A> {
  return self.get(self.length - 1);
}

/**
 * @tsplus getter fncts.ReadonlyArray lefts
 * @tsplus getter fncts.Array lefts
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
 * @tsplus getter fncts.ReadonlyArray length
 * @tsplus getter fncts.Array length
 */
export function length<A>(self: ReadonlyArray<A>): number {
  return self.length;
}

/**
 * @tsplus pipeable fncts.ReadonlyArray map
 * @tsplus pipeable fncts.Array map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray mapAccum
 * @tsplus pipeable fncts.Array mapAccum
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
 * @tsplus pipeable fncts.ReadonlyArray mapWithIndex
 * @tsplus pipeable fncts.Array mapWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray modifyAt
 * @tsplus pipeable fncts.Array modifyAt
 */
export function modifyAt<A>(i: number, f: (a: A) => A) {
  return (self: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> => {
    return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeModifyAt(i, f));
  };
}

/**
 * @tsplus getter fncts.ReadonlyArray mutableClone
 * @tsplus getter fncts.Array mutableClone
 */
export function mutableClone<A>(self: ReadonlyArray<A>): Array<A> {
  return self.slice(0);
}

/**
 * @tsplus pipeable fncts.ReadonlyArray mutate
 * @tsplus pipeable fncts.Array mutate
 */
export function mutate<A>(f: (self: Array<A>) => void) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    const mut = mutableClone(self);
    f(mut);
    return mut;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray partition
 * @tsplus pipeable fncts.Array partition
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
 * @tsplus pipeable fncts.ReadonlyArray partitionMap
 * @tsplus pipeable fncts.Array partitionMap
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<B>, ReadonlyArray<C>] => {
    return self.partitionMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray partitionMapWithIndex
 * @tsplus pipeable fncts.Array partitionMapWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray partitionWithIndex
 * @tsplus pipeable fncts.Array partitionWithIndex
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
 * @tsplus pipeable fncts.ReadonlyArray prepend
 * @tsplus pipeable fncts.Array prepend
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
 * @tsplus pipeable fncts.ReadonlyArray prependAll
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
 * @tsplus getter fncts.ReadonlyArray reverse
 * @tsplus getter fncts.Array reverse
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
 * @tsplus getter fncts.ReadonlyArray rights
 * @tsplus getter fncts.Array rights
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
 * @tsplus pipeable fncts.ReadonlyArray rotate
 * @tsplus pipeable fncts.Array rotate
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
 * @tsplus pipeable fncts.ReadonlyArray scanLeft
 * @tsplus pipeable fncts.Array scanLeft
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
 * @tsplus pipeable fncts.ReadonlyArray scanRight
 * @tsplus pipeable fncts.Array scanRight
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
 * @tsplus pipeable fncts.ReadonlyArray some
 * @tsplus pipeable fncts.Array some
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
 * @tsplus pipeable fncts.ReadonlyArray sort
 */
export function sort<A>(/** @tsplus auto */ O: P.Ord<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.isEmpty() || self.length === 1 ? self : self.slice().sort((a, b) => O.compare(b)(a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray sortBy
 */
export function sortBy<A>(Os: ReadonlyArray<P.Ord<A>>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.sort(Os.fold(P.Ord.getMonoid()));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray spanIndexLeft
 * @tsplus pipeable fncts.Array spanIndexLeft
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
 * @tsplus pipeable fncts.ReadonlyArray spanIndexRight
 * @tsplus pipeable fncts.Array spanIndexRight
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
 * @tsplus pipeable fncts.ReadonlyArray spanLeft
 * @tsplus pipeable fncts.Array spanLeft
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
 * @tsplus pipeable fncts.ReadonlyArray spanRight
 * @tsplus pipeable fncts.Array spanRight
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
 * @tsplus getter fncts.ReadonlyArray tail
 * @tsplus getter fncts.Array tail
 */
export function tail<A>(self: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> {
  return self.isNonEmpty() ? Just(self.slice(1)) : Nothing();
}

/**
 * @tsplus pipeable fncts.ReadonlyArray take
 * @tsplus pipeable fncts.Array take
 */
export function take(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.slice(0, n);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray takeLast
 * @tsplus pipeable fncts.Array takeLast
 */
export function takeLast(n: number) {
  return <A>(as: ReadonlyArray<A>): ReadonlyArray<A> => {
    return isEmpty(as) ? [] : as.slice(-n);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray takeWhile
 * @tsplus pipeable fncts.Array takeWhile
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
 * @tsplus getter fncts.ReadonlyArray traverse
 * @tsplus getter fncts.Array traverse
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
 * @tsplus getter fncts.ReadonlyArray traverseWithIndex
 * @tsplus getter fncts.Array traverseWithIndex
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

export const traverseWithIndex: P.TraversableWithIndex<ReadonlyArrayF>["traverseWithIndex"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)(f);

export const traverse: P.Traversable<ReadonlyArrayF>["traverse"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)((_, a) => f(a));

/**
 * @tsplus pipeable fncts.ReadonlyArray union
 * @tsplus pipeable fncts.Array union
 */
export function union<A>(that: ReadonlyArray<A>, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.concat(that.filter((a) => !self.elem(a, E)));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray uniq
 * @tsplus pipeable fncts.Array uniq
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
 * @tsplus getter fncts.ReadonlyArray unprepend
 * @tsplus getter fncts.Array unprepend
 */
export function unprepend<A>(self: ReadonlyArray<A>): Maybe<readonly [A, ReadonlyArray<A>]> {
  return self.isNonEmpty() ? Just([self[0]!, self.slice(1)]) : Nothing();
}

/**
 * @tsplus getter fncts.ReadonlyArray unsafeAsMutable
 * @tsplus getter fncts.Array unsafeAsMutable
 */
export function unsafeAsMutable<A>(self: ReadonlyArray<A>): Array<A> {
  return self as Array<A>;
}

/**
 * @tsplus pipeable fncts.ReadonlyArray unsafeDeleteAt
 * @tsplus pipeable fncts.Array unsafeDeleteAt
 */
export function unsafeDeleteAt(i: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => {
    return self.mutate((xs) => {
      xs.splice(i, 1);
    });
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray unsafeInsertAt
 * @tsplus pipeable fncts.Array unsafeInsertAt
 */
export function unsafeInsertAt<A>(i: number, a: A) {
  return (as: ReadonlyArray<A>): ReadonlyNonEmptyArray<A> => {
    return as.mutate((xs) => {
      xs.splice(i, 0, a);
    }) as unknown as ReadonlyNonEmptyArray<A>;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray unsafeModifyAt
 * @tsplus pipeable fncts.Array unsafeModifyAt
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
 * @tsplus pipeable fncts.ReadonlyArray unsafeUpdateAt
 * @tsplus pipeable fncts.Array unsafeUpdateAt
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
 * @tsplus getter fncts.ReadonlyArray unzip
 * @tsplus getter fncts.Array unzip
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
 * @tsplus pipeable fncts.ReadonlyArray updateAt
 * @tsplus pipeable fncts.Array updateAt
 */
export function updateAt<A>(i: number, a: A) {
  return (as: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> => {
    return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeUpdateAt(i, a));
  };
}

/**
 * @tsplus getter fncts.ReadonlyArray wilt
 * @tsplus getter fncts.Array wilt
 */
export function wilt_<A>(self: ReadonlyArray<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B, B2>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Either<B, B2>>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, readonly [ReadonlyArray<B>, ReadonlyArray<B2>]> =>
      self.wiltWithIndex(G)((_, a) => f(a));
}

/**
 * @tsplus getter fncts.ReadonlyArray wiltWithIndex
 * @tsplus getter fncts.Array wiltWithIndex
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
 * @tsplus getter fncts.ReadonlyArray wither
 * @tsplus getter fncts.Array wither
 */
export function wither_<A>(self: ReadonlyArray<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Maybe<B>>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ReadonlyArray<B>> =>
      self.witherWithIndex(G)((_, a) => f(a));
}

/**
 * @tsplus getter fncts.ReadonlyArray witherWithIndex
 * @tsplus getter fncts.Array witherWithIndex
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

export const wiltWithIndex: P.WitherableWithIndex<ReadonlyArrayF>["wiltWithIndex"] = (G) => (f) => (self) =>
  self.wiltWithIndex(G)(f);

export const wilt: P.WitherableWithIndex<ReadonlyArrayF>["wilt"] = (G) => (f) => (self) =>
  self.wiltWithIndex(G)((_, a) => f(a));

export const witherWithIndex: P.WitherableWithIndex<ReadonlyArrayF>["witherWithIndex"] = (G) => (f) => (self) =>
  self.witherWithIndex(G)(f);

export const wither: P.Witherable<ReadonlyArrayF>["wither"] = (G) => (f) => (self) =>
  self.witherWithIndex(G)((_, a) => f(a));

/**
 * @tsplus getter fncts.Array toIterable
 * @tsplus getter fncts.ReadonlyArray toIterable
 * @tsplus getter fncts.Array toIterable
 */
export function toIterable<A>(self: ReadonlyArray<A>): Iterable<A> {
  return self;
}

/**
 * @tsplus pipeable fncts.ReadonlyArray zip
 * @tsplus pipeable fncts.Array zip
 */
export function zip<B>(that: ReadonlyArray<B>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<readonly [A, B]> => {
    return self.zipWith(that, tuple);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyArray zipWith
 * @tsplus pipeable fncts.Array zipWith
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
