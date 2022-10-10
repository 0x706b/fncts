import type { ImmutableArrayF } from "@fncts/base/collection/immutable/ImmutableArray/definition";
import type { Monoid } from "@fncts/base/typeclass";

import { EitherTag } from "@fncts/base/data/Either";
import { identity, pipe, tuple } from "@fncts/base/data/function";
import * as P from "@fncts/base/typeclass";

/**
 * @tsplus pipeable fncts.ImmutableArray alignWith
 */
export function alignWith<A, B, C>(fb: ImmutableArray<B>, f: (_: These<A, B>) => C) {
  return (self: ImmutableArray<A>): ImmutableArray<C> => {
    const selfArray = self._array;
    const thatArray = fb._array;
    const minlen    = Math.min(selfArray.length, thatArray.length);
    const maxlen    = Math.max(selfArray.length, thatArray.length);
    const ret       = Array<C>(maxlen);
    for (let i = 0; i < minlen; i++) {
      ret[i] = f(These.both(selfArray[i]!, thatArray[i]!));
    }
    if (minlen === maxlen) {
      return ret.asImmutableArray;
    } else if (selfArray.length > thatArray.length) {
      for (let i = minlen; i < maxlen; i++) {
        ret[i] = f(These.left(selfArray[i]!));
      }
    } else {
      for (let i = minlen; i < maxlen; i++) {
        ret[i] = f(These.right(thatArray[i]!));
      }
    }
    return ret.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray align
 */
export function align<B>(fb: ImmutableArray<B>) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<These<A, B>> => {
    return self.alignWith(fb, identity);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray alt
 */
export function alt<B>(that: Lazy<ImmutableArray<B>>) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<A | B> => {
    return self.concat(that());
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray ap
 */
export function ap<A>(fa: ImmutableArray<A>) {
  return <B>(self: ImmutableArray<(a: A) => B>): ImmutableArray<B> => {
    return self.flatMap((f) => fa.map(f));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray append
 */
export function append<B>(last: B) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<A | B> => {
    const selfArray = self._array;
    const len       = selfArray.length;
    const r         = Array<A | B>(len + 1);
    r[len]          = last;
    for (let i = 0; i < len; i++) {
      r[i] = selfArray[i]!;
    }
    return r.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray crossWith
 */
export function crossWith<A, B, C>(fb: ImmutableArray<B>, f: (a: A, b: B) => C) {
  return (self: ImmutableArray<A>): ImmutableArray<C> => {
    return self.flatMap((a) => fb.map((b) => f(a, b)));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray cross
 */
export function cross<B>(fb: ImmutableArray<B>) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<Zipped.Make<A, B>> => {
    return self.crossWith(fb, (a, b) => Zipped(a, b));
  };
}

/**
 * @tsplus static fncts.ImmutableArrayOps chainRecDepthFirst
 */
export function chainRecDepthFirst<A, B>(a: A, f: (a: A) => ImmutableArray<Either<A, B>>): ImmutableArray<B> {
  const buffer   = f(a).slice().unsafeAsMutable;
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

  return out.asImmutableArray;
}

/**
 * @tsplus static fncts.ImmutableArrayOps chainRecBreadthFirst
 */
export function chainRecBreadthFirst<A, B>(a: A, f: (a: A) => ImmutableArray<Either<A, B>>): ImmutableArray<B> {
  const initial                     = f(a);
  const buffer: Array<Either<A, B>> = [];
  const out: Array<B>               = [];

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

  return out.asImmutableArray;
}

/**
 * @tsplus pipeable fncts.ImmutableArray flatMapWithIndex
 */
export function flatMapWithIndex<A, B>(f: (i: number, a: A) => ImmutableArray<B>) {
  return (self: ImmutableArray<A>): ImmutableArray<B> => {
    let outLen      = 0;
    const selfArray = self._array;
    const len       = selfArray.length;
    const temp      = Array<Array<B>>(len);
    for (let i = 0; i < len; i++) {
      const e   = selfArray[i]!;
      const arr = f(i, e)._array;
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
    return out.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray flatMap
 */
export function flatMap<A, B>(f: (a: A) => ImmutableArray<B>) {
  return (self: ImmutableArray<A>): ImmutableArray<B> => {
    return self.flatMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus getter fncts.ImmutableArray flatten
 */
export function flatten<A>(self: ImmutableArray<ImmutableArray<A>>): ImmutableArray<A> {
  return self.flatMap(identity);
}

/**
 * A useful recursion pattern for processing a `Array` to produce a new `Array`,
 * often used for "chopping" up the input `Array`. Typically chop is called with some function
 * that will consume an initial prefix of the `Array` and produce a value and the rest of the `Array`.
 *
 * @tsplus pipeable fncts.ImmutableArray chop
 */
export function chop<A, B>(f: (as: ImmutableNonEmptyArray<A>) => readonly [B, ImmutableArray<A>]) {
  return (as: ImmutableArray<A>): ImmutableArray<B> => {
    const result: Array<B>    = [];
    let cs: ImmutableArray<A> = as;
    while (cs.isNonEmpty()) {
      const [b, c] = f(cs);
      result.push(b);
      cs = c;
    }
    return result.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray collectWhile
 */
export function collectWhile<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ImmutableArray<A>): ImmutableArray<B> => {
    const result: Array<B> = [];
    for (let i = 0; i < as.length; i++) {
      const o = f(as._array[i]!);
      if (o.isJust()) {
        result.push(o.value);
      } else {
        break;
      }
    }
    return result.asImmutableArray;
  };
}

function comprehensionLoop<A, R>(
  scope: ImmutableArray<A>,
  input: ReadonlyArray<ImmutableArray<A>>,
  f: (...xs: ReadonlyArray<A>) => R,
  g: (...xs: ReadonlyArray<A>) => boolean,
): Eval<ImmutableArray<R>> {
  if (input.length === 0) {
    return g(...scope) ? Eval.now(ImmutableArray(f(...scope))) : Eval.now(ImmutableArray.empty());
  } else {
    return input[0]!
      .traverse(Eval.Applicative)((a) => comprehensionLoop(scope.append(a), input.slice(1), f, g))
      .map((rs) => rs.flatten);
  }
}

/**
 * @tsplus static fncts.ImmutableArrayOps comprehension
 */
export function comprehension<A, B, C, D, R>(
  input: [ImmutableArray<A>, ImmutableArray<B>, ImmutableArray<C>, ImmutableArray<D>],
  f: (a: A, b: B, c: C, d: D) => R,
  g?: (a: A, b: B, c: C, d: D) => boolean,
): ImmutableArray<R>;
export function comprehension<A, B, C, R>(
  input: [ImmutableArray<A>, ImmutableArray<B>, ImmutableArray<C>],
  f: (a: A, b: B, c: C) => R,
  g?: (a: A, b: B, c: C) => boolean,
): ImmutableArray<R>;
export function comprehension<A, B, R>(
  input: [ImmutableArray<A>, ImmutableArray<B>],
  f: (a: A, b: B) => R,
  g?: (a: A, b: B) => boolean,
): ImmutableArray<R>;
export function comprehension<A, R>(
  input: [ImmutableArray<A>],
  f: (a: A) => R,
  g?: (a: A) => boolean,
): ImmutableArray<R>;
export function comprehension<A, R>(
  input: ReadonlyArray<ImmutableArray<A>>,
  f: (...xs: ReadonlyArray<A>) => R,
  g: (...xs: ReadonlyArray<A>) => boolean = () => true,
): ImmutableArray<R> {
  return Eval.run(comprehensionLoop(ImmutableArray.empty(), input, f, g));
}

/**
 * @tsplus pipeable fncts.ImmutableArray concat
 * @tsplus pipeable-operator fncts.ImmutableArray +
 */
export function concat<B>(that: ImmutableArray<B>) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<A | B> => {
    const lenx = self._array.length;
    if (lenx === 0) {
      return that;
    }
    const leny = that._array.length;
    if (leny === 0) {
      return self;
    }
    const r = Array<A | B>(lenx + leny);
    for (let i = 0; i < lenx; i++) {
      r[i] = self._array[i]!;
    }
    for (let i = 0; i < leny; i++) {
      r[i + lenx] = that._array[i]!;
    }
    return r.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray deleteAt
 */
export function deleteAt(i: number) {
  return <A>(as: ImmutableArray<A>): Maybe<ImmutableArray<A>> => {
    return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeDeleteAt(i));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray difference
 */
export function difference<A>(ys: ImmutableArray<A>, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.filter((a) => !ys.elem(a, E));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray drop
 */
export function drop(n: number) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.slice(n);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray dropLast
 */
export function dropLast(n: number) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.slice(0, self.length - n);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray dropWhile
 */
export function dropWhile<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.slice(self.spanIndexLeft(p));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray dropLastWhile
 */
export function dropLastWhile<A>(p: Predicate<A>) {
  return (as: ImmutableArray<A>): ImmutableArray<A> => {
    return as.slice(0, as.spanIndexRight(p) + 1);
  };
}

/**
 * Test if a value is a member of an array. Takes an `Eq<A>` as a single
 * argument which returns the function to use to search for a value of type `A` in
 * an array of type `ImmutableArray<A>`.
 *
 * @tsplus pipeable fncts.ImmutableArray elem
 */
export function elem<A>(a: A, /** @tsplus auto */ E: P.Eq<A>) {
  return (as: ImmutableArray<A>): boolean => {
    const predicate = (element: A) => E.equals(element, a);
    const len       = as.length;
    for (let i = 0; i < len; i++) {
      if (predicate(as._array[i]!)) {
        return true;
      }
    }
    return false;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray every
 */
export function every<A, B extends A>(p: Refinement<A, B>): (self: ImmutableArray<A>) => self is ImmutableArray<B>;
export function every<A>(p: Predicate<A>): (self: ImmutableArray<A>) => boolean;
export function every<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): boolean => {
    return self.everyWithIndex((_, a) => p(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray everyWithIndex
 */
export function everyWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: ImmutableArray<A>) => self is ImmutableArray<B>;
export function everyWithIndex<A>(p: PredicateWithIndex<number, A>): (self: ImmutableArray<A>) => boolean;
export function everyWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: ImmutableArray<A>): boolean => {
    let result = true;
    let i      = 0;
    while (result && i < self.length) {
      result = p(i, self._array[i]!);
      i++;
    }
    return result;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray exists
 */
export function exists<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): self is ImmutableNonEmptyArray<A> => {
    let result = false;
    let i      = 0;
    while (!result && i < self.length) {
      result = p(self._array[i]!);
      i++;
    }
    return result;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray filter
 */
export function filter<A, B extends A>(p: Refinement<A, B>): (self: ImmutableArray<A>) => ImmutableArray<B>;
export function filter<A>(p: Predicate<A>): (self: ImmutableArray<A>) => ImmutableArray<A>;
export function filter<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.filterWithIndex((_, a) => p(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray filterWithIndex
 */
export function filterWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: ImmutableArray<A>) => ImmutableArray<B>;
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>): (self: ImmutableArray<A>) => ImmutableArray<A>;
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    const result: Array<A> = [];
    for (let i = 0; i < self.length; i++) {
      const a = self._array[i]!;
      if (p(i, a)) {
        result.push(a);
      }
    }
    return result.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray filterMapWithIndex
 */
export function filterMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (fa: ImmutableArray<A>): ImmutableArray<B> => {
    const result = [];
    for (let i = 0; i < fa.length; i++) {
      const maybeB = f(i, fa[i]!);
      if (maybeB.isJust()) {
        result.push(maybeB.value);
      }
    }
    return result.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: ImmutableArray<A>): ImmutableArray<B> => {
    return self.filterMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray find
 */
export function find<A, B extends A>(p: Refinement<A, B>): (self: ImmutableArray<A>) => Maybe<B>;
export function find<A>(p: Predicate<A>): (self: ImmutableArray<A>) => Maybe<A>;
export function find<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): Maybe<A> => {
    return self.findWithIndex((_, a) => p(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray findIndex
 */
export function findIndex<A>(predicate: Predicate<A>) {
  return (as: ImmutableArray<A>): Maybe<number> => {
    return as.findMapWithIndex((i, a) => (predicate(a) ? Just(i) : Nothing()));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray findWithIndex
 */
export function findWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (as: ImmutableArray<A>) => Maybe<B>;
export function findWithIndex<A>(p: PredicateWithIndex<number, A>): (as: ImmutableArray<A>) => Maybe<A>;
export function findWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (as: ImmutableArray<A>): Maybe<A> => {
    const len = as.length;
    for (let i = 0; i < len; i++) {
      if (p(i, as._array[i]!)) {
        return Just(as._array[i]!);
      }
    }
    return Nothing();
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray findMap
 */
export function findMap<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ImmutableArray<A>): Maybe<B> => {
    return as.findMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray findMapWithIndex
 */
export function findMapWithIndex<A, B>(f: (index: number, a: A) => Maybe<B>) {
  return (as: ImmutableArray<A>): Maybe<B> => {
    const len = as.length;
    for (let i = 0; i < len; i++) {
      const v = f(i, as._array[i]!);
      if (v.isJust()) {
        return v;
      }
    }
    return Nothing();
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray findLast
 */
export function findLast<A, B extends A>(p: Refinement<A, B>): (as: ImmutableArray<A>) => Maybe<B>;
export function findLast<A>(p: Predicate<A>): (as: ImmutableArray<A>) => Maybe<A>;
export function findLast<A>(p: Predicate<A>) {
  return (as: ImmutableArray<A>): Maybe<A> => {
    const len = as.length;
    for (let i = len - 1; i >= 0; i--) {
      if (p(as._array[i]!)) {
        return Just(as._array[i]!);
      }
    }
    return Nothing();
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray findLastIndex
 */
export function findLastIndex<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): Maybe<number> => {
    return self.findLastMapWithIndex((i, a) => (p(a) ? Just(i) : Nothing()));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray findLastMap
 */
export function findLastMap<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ImmutableArray<A>): Maybe<B> => {
    return as.findLastMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray findLastMapWithIndex
 */
export function findLastMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (as: ImmutableArray<A>): Maybe<B> => {
    const len = as.length;
    for (let i = len - 1; i >= 0; i--) {
      const v = f(i, as._array[i]!);
      if (v.isJust()) {
        return v;
      }
    }
    return Nothing();
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray foldLeftWithIndex
 * @tsplus pipeable fncts.MutableArray foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: ImmutableArray<A>): B => {
    const len = self.length;
    let r     = b;
    for (let i = 0; i < len; i++) {
      r = f(i, r, self._array[i]!);
    }
    return r;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray foldLeft
 * @tsplus pipeable fncts.MutableArray foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ImmutableArray<A>): B => {
    return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray foldLeftWhile
 * @tsplus pipeable fncts.MutableArray foldLeftWhile
 */
export function foldLeftWhile<A, B>(b: B, p: Predicate<B>, f: (b: B, a: A) => B) {
  return (self: ImmutableArray<A>): B => {
    return self.foldLeftWithIndexWhile(b, p, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray foldLeftWithIndexWhile
 * @tsplus pipeable fncts.MutableArray foldLeftWithIndexWhile
 */
export function foldLeftWithIndexWhile<A, B>(b: B, p: Predicate<B>, f: (i: number, b: B, a: A) => B) {
  return (self: ImmutableArray<A>): B => {
    let out  = b;
    let cont = p(out);
    for (let i = 0; cont && i < self.length; i++) {
      out  = f(i, out, self._array[i]!);
      cont = p(out);
    }
    return out;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray fold
 */
export function fold<M>(/** @tsplus auto */ M: Monoid<M>) {
  return (self: ImmutableArray<M>): M => {
    return self.foldLeft(M.nat, M.combine);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray foldMapWithIndex
 */
export function foldMapWithIndex<A, M>(f: (i: number, a: A) => M, /** @tsplus auto */ M: Monoid<M>) {
  return (self: ImmutableArray<A>): M => {
    return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(b, f(i, a)));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: Monoid<M>) {
  return (self: ImmutableArray<A>): M => {
    return self.foldMapWithIndex((_, a) => f(a), M);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray foldRightWithIndex
 */
export function foldRightWithIndex<A, B>(b: B, f: (i: number, a: A, b: B) => B) {
  return (self: ImmutableArray<A>): B => {
    let r = b;
    for (let i = self.length - 1; i >= 0; i--) {
      r = f(i, self._array[i]!, r);
    }
    return r;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray foldRight
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: ImmutableArray<A>): B => {
    return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray foldRighWhile
 */
export function foldRightWhile<A, B>(b: B, p: Predicate<B>, f: (a: A, b: B) => B) {
  return (self: ImmutableArray<A>): B => {
    return self.foldRightWithIndexWhile(b, p, (_, a, b) => f(a, b));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray foldRightWithIndexWhile
 */
export function foldRightWithIndexWhile<A, B>(b: B, predicate: Predicate<B>, f: (i: number, a: A, b: B) => B) {
  return (self: ImmutableArray<A>): B => {
    let out  = b;
    let cont = predicate(out);
    for (let i = self.length - 1; cont && i >= 0; i--) {
      out  = f(i, self._array[i]!, out);
      cont = predicate(out);
    }
    return out;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray forEach
 */
export function forEach<A, B>(f: (a: A) => B) {
  return (self: ImmutableArray<A>): void => {
    return self.forEach(f);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray get
 * @tsplus pipeable fncts.MutableArray get
 */
export function get(i: number) {
  return <A>(self: ImmutableArray<A>): Maybe<A> => {
    return self.isOutOfBound(i) ? Nothing() : Just(self._array[i]!);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray group
 */
export function group<A>(E: P.Eq<A>): (self: ImmutableArray<A>) => ImmutableArray<ImmutableNonEmptyArray<A>> {
  return chop((self) => {
    const h   = self._array[0]!;
    const out = [h];
    let i     = 1;
    for (; i < self.length; i++) {
      const a = self._array[i]!;
      if (E.equals(a, h)) {
        out.push(a);
      } else {
        break;
      }
    }
    return [out.unsafeAsNonEmptyArray, self.slice(i)];
  });
}

/**
 * @tsplus pipeable fncts.ImmutableArray groupBy
 */
export function groupBy<A>(f: (a: A) => string) {
  return (self: ImmutableArray<A>): Readonly<Record<string, ImmutableNonEmptyArray<A>>> => {
    const out: Record<string, NonEmptyArray<A>> = {};
    for (let i = 0; i < self.length; i++) {
      const a = self._array[i]!;
      const k = f(a);
      if (Object.prototype.hasOwnProperty.call(out, k)) {
        out[k]!.push(a);
      } else {
        out[k] = [a];
      }
    }
    return Dictionary.get(out).map(ImmutableNonEmptyArray.from).toRecord;
  };
}

/**
 * @tsplus getter fncts.ImmutableArray head
 */
export function head<A>(self: ImmutableArray<A>): Maybe<A> {
  return self.isNonEmpty() ? Just(self._array[0]) : Nothing();
}

/**
 * @tsplus getter fncts.ImmutableArray init
 */
export function init<A>(self: ImmutableArray<A>): Maybe<ImmutableArray<A>> {
  const len = self.length;
  return len === 0 ? Nothing() : Just(self.slice(0, len - 1));
}

/**
 * @tsplus pipeable fncts.ImmutableArray insertAt
 */
export function insertAt<A>(i: number, a: A) {
  return (self: ImmutableArray<A>): Maybe<ImmutableNonEmptyArray<A>> => {
    return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeInsertAt(i, a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray intersection
 */
export function intersection<A>(that: ImmutableArray<A>, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.filter((a) => that.elem(a, E));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray intersperse
 */
export function intersperse<A>(a: A) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    const len = self.length;
    return len === 0 ? self : self.slice(1, len).prependAll(a).prepend(self[0]!);
  };
}

/**
 * @tsplus fluent fncts.ImmutableArray isEmpty
 */
export function isEmpty<A>(self: ImmutableArray<A>): boolean {
  return self.length === 0;
}

/**
 * @tsplus pipeable fncts.ImmutableArray isOutOfBound
 */
export function isOutOfBound(i: number) {
  return <A>(self: ImmutableArray<A>): boolean => {
    return i < 0 || i >= self.length;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray join
 */
export function join(separator: string) {
  return (self: ImmutableArray<string>): string => {
    return self._array.join(separator);
  };
}

/**
 * @tsplus getter fncts.ImmutableArray last
 */
export function last<A>(self: ImmutableArray<A>): Maybe<A> {
  return self.get(self.length - 1);
}

/**
 * @tsplus getter fncts.ImmutableArray length
 */
export function length<A>(self: ImmutableArray<A>): number {
  return self._array.length;
}

/**
 * @tsplus getter fncts.ImmutableArray lefts
 */
export function lefts<E, A>(self: ImmutableArray<Either<E, A>>): ImmutableArray<E> {
  const ls: Array<E> = [];
  for (let i = 0; i < self.length; i++) {
    const a = self._array[i]!;
    Either.concrete(a);
    if (a._tag === EitherTag.Left) {
      ls.push(a.left);
    }
  }
  return ls.asImmutableArray;
}

/**
 * @tsplus pipeable fncts.ImmutableArray map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: ImmutableArray<A>): ImmutableArray<B> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray mapAccum
 */
export function mapAccum<A, S, B>(s: S, f: (s: S, a: A) => readonly [B, S]) {
  return (self: ImmutableArray<A>): readonly [ImmutableArray<B>, S] => {
    const bs  = Array<B>(self.length);
    let state = s;
    for (let i = 0; i < self.length; i++) {
      const result = f(state, self._array[i]!);
      bs[i]        = result[0];
      state        = result[1];
    }
    return [bs.asImmutableArray, state];
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray mapWithIndex
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: ImmutableArray<A>): ImmutableArray<B> => {
    const len = self._array.length;
    const bs  = Array<B>(len);
    for (let i = 0; i < len; i++) {
      bs[i] = f(i, self._array[i]!);
    }
    return bs.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray modifyAt
 */
export function modifyAt<A>(i: number, f: (a: A) => A) {
  return (self: ImmutableArray<A>): Maybe<ImmutableArray<A>> => {
    return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeModifyAt(i, f));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray mutate
 */
export function mutate<A>(f: (self: Array<A>) => void) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    const mut = mutableClone(self);
    f(mut);
    return mut.asImmutableArray;
  };
}

/**
 * @tsplus getter fncts.ImmutableArray mutableClone
 */
export function mutableClone<A>(self: ImmutableArray<A>): Array<A> {
  return self.slice(0)._array as Array<A>;
}

/**
 * @tsplus pipeable fncts.ImmutableArray partitionWithIndex
 */
export function partitionWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: ImmutableArray<A>) => readonly [ImmutableArray<A>, ImmutableArray<B>];
export function partitionWithIndex<A>(
  p: PredicateWithIndex<number, A>,
): (self: ImmutableArray<A>) => readonly [ImmutableArray<A>, ImmutableArray<A>];
export function partitionWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: ImmutableArray<A>): readonly [ImmutableArray<A>, ImmutableArray<A>] => {
    const left: Array<A>  = [];
    const right: Array<A> = [];
    for (let i = 0; i < self.length; i++) {
      const a = self._array[i]!;
      if (p(i, a)) {
        right.push(a);
      } else {
        left.push(a);
      }
    }
    return [left.asImmutableArray, right.asImmutableArray];
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray partition
 */
export function partition<A, B extends A>(
  p: Refinement<A, B>,
): (self: ImmutableArray<A>) => readonly [ImmutableArray<A>, ImmutableArray<B>];
export function partition<A>(
  p: Predicate<A>,
): (self: ImmutableArray<A>) => readonly [ImmutableArray<A>, ImmutableArray<A>];
export function partition<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): readonly [ImmutableArray<A>, ImmutableArray<A>] => {
    return self.partitionWithIndex((_, a) => p(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray partitionMapWithIndex
 */
export function partitionMapWithIndex<A, B, C>(f: (i: number, a: A) => Either<B, C>) {
  return (self: ImmutableArray<A>): readonly [ImmutableArray<B>, ImmutableArray<C>] => {
    const left  = [] as Array<B>;
    const right = [] as Array<C>;
    for (let i = 0; i < self.length; i++) {
      const ea = f(i, self._array[i]!);
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
    return [left.asImmutableArray, right.asImmutableArray];
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray partitionMap
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: ImmutableArray<A>): readonly [ImmutableArray<B>, ImmutableArray<C>] => {
    return self.partitionMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray prepend
 */
export function prepend<B>(head: B) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<A | B> => {
    const len = self.length;
    const out = Array<A | B>(len + 1);
    out[0]    = head;
    for (let i = 0; i < len; i++) {
      out[i + 1] = self._array[i]!;
    }
    return out.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray prependAll
 */
export function prependAll<A>(a: A) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    const out: Array<A> = [];
    for (let i = 0; i < self.length; i++) {
      out.push(a, self._array[i]!);
    }
    return out.asImmutableArray;
  };
}

/**
 * @tsplus getter fncts.ImmutableArray reverse
 */
export function reverse<A>(self: ImmutableArray<A>): ImmutableArray<A> {
  if (self.isEmpty()) {
    return self;
  } else if (self.length === 1) {
    return ImmutableArray(self._array[0]!);
  } else {
    const out = Array<A>(self.length);
    for (let j = 0, i = self.length - 1; i >= 0; i--, j++) {
      out[j] = self._array[i]!;
    }
    return out.asImmutableArray;
  }
}

/**
 * @tsplus getter fncts.ImmutableArray rights
 */
export function rights<E, A>(self: ImmutableArray<Either<E, A>>): ImmutableArray<A> {
  const rs: Array<A> = [];
  for (let i = 0; i < self.length; i++) {
    const a = self._array[i]!;
    Either.concrete(a);
    if (a._tag === EitherTag.Right) {
      rs.push(a.right);
    }
  }
  return rs.asImmutableArray;
}

/**
 * @tsplus pipeable fncts.ImmutableArray rotate
 */
export function rotate(n: number) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<A> => {
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
 * @tsplus pipeable fncts.ImmutableArray scanLeft
 */
export function scanLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ImmutableArray<A>): ImmutableArray<B> => {
    const l = self.length;
    const r = Array(l + 1);
    r[0]    = b;
    for (let i = 0; i < l; i++) {
      r[i + 1] = f(r[i]!, self._array[i]!);
    }
    return r.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray scanRight
 */
export function scanRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: ImmutableArray<A>): ImmutableArray<B> => {
    const l = self.length;
    const r = Array(l + 1);
    r[l]    = b;
    for (let i = l - 1; i >= 0; i--) {
      r[i] = f(self._array[i]!, r[i + 1]!);
    }
    return r.asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray sort
 */
export function sort<A>(/** @tsplus auto */ O: P.Ord<A>) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.isEmpty() || self.length === 1 ? self : self._array.slice().sort(O.compare).asImmutableArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray sortBy
 */
export function sortBy<A>(Os: ImmutableArray<P.Ord<A>>) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.sort(Os.fold(P.Ord.getMonoid()));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray spanLeft
 */
export function spanLeft<A, B extends A>(
  p: Refinement<A, B>,
): (self: ImmutableArray<A>) => readonly [ImmutableArray<B>, ImmutableArray<A>];
export function spanLeft<A>(
  p: Predicate<A>,
): (self: ImmutableArray<A>) => readonly [ImmutableArray<A>, ImmutableArray<A>];
export function spanLeft<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): readonly [ImmutableArray<A>, ImmutableArray<A>] => {
    const i    = self.spanIndexLeft(p);
    const init = Array<A>(i);
    for (let j = 0; j < i; j++) {
      init[j] = self._array[j]!;
    }
    const l    = self.length;
    const rest = Array<A>(l - i);
    for (let j = i; j < l; j++) {
      rest[j - i] = self._array[j]!;
    }
    return [init.asImmutableArray, rest.asImmutableArray];
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray spanRight
 */
export function spanRight<A, B extends A>(
  p: Refinement<A, B>,
): (self: ImmutableArray<A>) => readonly [ImmutableArray<A>, ImmutableArray<B>];
export function spanRight<A>(
  p: Predicate<A>,
): (self: ImmutableArray<A>) => readonly [ImmutableArray<A>, ImmutableArray<A>];
export function spanRight<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): readonly [ImmutableArray<A>, ImmutableArray<A>] => {
    const i    = self.spanIndexRight(p);
    const l    = self.length;
    const tail = Array<A>(l - i - 1);
    for (let j = l - 1; j > i; j--) {
      tail[j - i - 1] = self._array[j]!;
    }
    const rest = Array<A>(i);
    for (let j = i; j >= 0; j--) {
      rest[j] = self._array[j]!;
    }
    return [rest.asImmutableArray, tail.asImmutableArray];
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray spanIndexLeft
 */
export function spanIndexLeft<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): number => {
    const l = self.length;
    let i   = 0;
    for (; i < l; i++) {
      if (!p(self._array[i]!)) {
        break;
      }
    }
    return i;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray spanIndexRight
 */
export function spanIndexRight<A>(predicate: Predicate<A>) {
  return (as: ImmutableArray<A>): number => {
    let i = as.length - 1;
    for (; i >= 0; i--) {
      if (!predicate(as._array[i]!)) {
        break;
      }
    }
    return i;
  };
}

/**
 * @tsplus getter fncts.ImmutableArray tail
 */
export function tail<A>(self: ImmutableArray<A>): Maybe<ImmutableArray<A>> {
  return self.isNonEmpty() ? Just(self.slice(1)) : Nothing();
}

/**
 * @tsplus pipeable fncts.ImmutableArray take
 */
export function take(n: number) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.slice(0, n);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray takeLast
 */
export function takeLast(n: number) {
  return <A>(as: ImmutableArray<A>): ImmutableArray<A> => {
    return isEmpty(as) ? ImmutableArray.empty() : as.slice(-n);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray takeWhile
 */
export function takeWhile<A, B extends A>(p: Refinement<A, B>): (self: ImmutableArray<A>) => ImmutableArray<B>;
export function takeWhile<A>(p: Predicate<A>): (self: ImmutableArray<A>) => ImmutableArray<A>;
export function takeWhile<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    const i    = self.spanIndexLeft(p);
    const init = Array<A>(i);
    for (let j = 0; j < i; j++) {
      init[j] = self._array[j]!;
    }
    return init.asImmutableArray;
  };
}

/**
 * @tsplus getter fncts.ImmutableArray traverseWithIndex
 */
export function _traverseWithIndex<A>(
  self: ImmutableArray<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ImmutableArray<B>>;
export function _traverseWithIndex<A>(
  self: ImmutableArray<A>,
): <G>(G: P.Applicative<HKT.F<G>>) => <B>(f: (i: number, a: A) => HKT.FK1<G, B>) => HKT.FK1<G, ImmutableArray<B>> {
  return (G) => (f) =>
    self.foldLeftWithIndex(G.pure(ImmutableArray.empty()), (i, fbs, a) =>
      pipe(
        fbs,
        G.zipWith(f(i, a), (bs, b) => bs.append(b)),
      ),
    );
}

/**
 * @tsplus getter fncts.ImmutableArray traverse
 */
export function _traverse<A>(
  self: ImmutableArray<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ImmutableArray<B>> {
  return (G) => (f) => self.traverseWithIndex(G)((_, a) => f(a));
}

export const traverseWithIndex: P.TraversableWithIndex<ImmutableArrayF>["traverseWithIndex"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)(f);

export const traverse: P.Traversable<ImmutableArrayF>["traverse"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)((_, a) => f(a));

/**
 * @tsplus pipeable fncts.ImmutableArray union
 */
export function union<A>(that: ImmutableArray<A>, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.concat(that.filter((a) => !self.elem(a, E)));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray uniq
 */
export function uniq<A>(/** @tsplus auto */ E: P.Eq<A>) {
  return (self: ImmutableArray<A>): ImmutableArray<A> => {
    if (self.length === 1) {
      return self;
    }
    const out = [] as Array<A>;
    const len = self.length;
    for (let i = 0; i < len; i++) {
      const a = self._array[i]!;
      if (!out.asImmutableArray.elem(a, E)) {
        out.push(a);
      }
    }
    return out.asImmutableArray;
  };
}

/**
 * @tsplus getter fncts.ImmutableArray unprepend
 */
export function unprepend<A>(self: ImmutableArray<A>): Maybe<readonly [A, ImmutableArray<A>]> {
  return self.isNonEmpty() ? Just([self[0]!, self.slice(1)]) : Nothing();
}

/**
 * @tsplus index fncts.ImmutableArray
 */
export function unsafeGet<A>(self: ImmutableArray<A>, i: number): A | undefined {
  return self._array[i];
}

/**
 * @tsplus getter fncts.ImmutableArray unsafeAsMutable
 */
export function unsafeAsMutable<A>(self: ImmutableArray<A>): Array<A> {
  return self._array as Array<A>;
}

/**
 * @tsplus pipeable fncts.ImmutableArray unsafeDeleteAt
 */
export function unsafeDeleteAt(i: number) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<A> => {
    return self.mutate((xs) => {
      xs.splice(i, 1);
    });
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray unsafeInsertAt
 */
export function unsafeInsertAt<A>(i: number, a: A) {
  return (as: ImmutableArray<A>): ImmutableNonEmptyArray<A> => {
    return as.mutate((xs) => {
      xs.splice(i, 0, a);
    }) as unknown as ImmutableNonEmptyArray<A>;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray unsafeModifyAt
 */
export function unsafeModifyAt<A>(i: number, f: (a: A) => A) {
  return (as: ImmutableArray<A>): ImmutableArray<A> => {
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
 * @tsplus pipeable fncts.ImmutableArray unsafeUpdateAt
 */
export function unsafeUpdateAt<A>(i: number, a: A) {
  return (as: ImmutableArray<A>): ImmutableArray<A> => {
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
 * @tsplus getter fncts.ImmutableArray unzip
 */
export function unzip<A, B>(self: ImmutableArray<readonly [A, B]>): readonly [ImmutableArray<A>, ImmutableArray<B>] {
  const fa = Array<A>(self.length);
  const fb = Array<B>(self.length);

  for (let i = 0; i < self.length; i++) {
    fa[i] = self._array[i]![0]!;
    fb[i] = self._array[i]![1]!;
  }

  return [fa.asImmutableArray, fb.asImmutableArray];
}

/**
 * @tsplus pipeable fncts.ImmutableArray updateAt
 */
export function updateAt<A>(i: number, a: A) {
  return (as: ImmutableArray<A>): Maybe<ImmutableArray<A>> => {
    return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeUpdateAt(i, a));
  };
}

/**
 * @tsplus getter fncts.ImmutableArray wiltWithIndex
 */
export function _wiltWithIndex<A>(self: ImmutableArray<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B, B2>(
      f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Either<B, B2>>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, readonly [ImmutableArray<B>, ImmutableArray<B2>]> =>
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
        .pipe(G.map(([b1s, b2s]) => [b1s.asImmutableArray, b2s.asImmutableArray]));
}

/**
 * @tsplus getter fncts.ImmutableArray wilt
 */
export function _wilt<A>(self: ImmutableArray<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B, B2>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Either<B, B2>>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, readonly [ImmutableArray<B>, ImmutableArray<B2>]> =>
      self.wiltWithIndex(G)((_, a) => f(a));
}

/**
 * @tsplus getter fncts.ImmutableArray witherWithIndex
 */
export function _witherWithIndex<A>(self: ImmutableArray<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B>(
      f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Maybe<B>>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ImmutableArray<B>> =>
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
        .pipe(G.map((bs) => bs.asImmutableArray));
}

/**
 * @tsplus getter fncts.ImmutableArray wither
 */
export function _wither<A>(self: ImmutableArray<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Maybe<B>>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ImmutableArray<B>> =>
      self.witherWithIndex(G)((_, a) => f(a));
}

export const wiltWithIndex: P.WitherableWithIndex<ImmutableArrayF>["wiltWithIndex"] = (G) => (f) => (self) =>
  self.wiltWithIndex(G)(f);

export const wilt: P.WitherableWithIndex<ImmutableArrayF>["wilt"] = (G) => (f) => (self) =>
  self.wiltWithIndex(G)((_, a) => f(a));

export const witherWithIndex: P.WitherableWithIndex<ImmutableArrayF>["witherWithIndex"] = (G) => (f) => (self) =>
  self.witherWithIndex(G)(f);

export const wither: P.Witherable<ImmutableArrayF>["wither"] = (G) => (f) => (self) =>
  self.witherWithIndex(G)((_, a) => f(a));

/**
 * @tsplus pipeable fncts.ImmutableArray zip
 */
export function zip<B>(that: ImmutableArray<B>) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<readonly [A, B]> => {
    return self.zipWith(that, tuple);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableArray zipWith
 */
export function zipWith<A, B, C>(fb: ImmutableArray<B>, f: (a: A, b: B) => C) {
  return (self: ImmutableArray<A>): ImmutableArray<C> => {
    const len = Math.min(self.length, fb.length);
    const fc  = Array<C>(len);
    for (let i = 0; i < len; i++) {
      fc[i] = f(self._array[i]!, fb._array[i]!);
    }
    return fc.asImmutableArray;
  };
}
