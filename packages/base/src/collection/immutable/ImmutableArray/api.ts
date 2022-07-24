import type { ImmutableArrayF } from "@fncts/base/collection/immutable/ImmutableArray/definition";
import type { Monoid } from "@fncts/base/typeclass";

import { EitherTag } from "@fncts/base/data/Either";
import { identity, tuple } from "@fncts/base/data/function";
import * as P from "@fncts/base/typeclass";

/**
 * @tsplus fluent fncts.ImmutableArray alignWith
 */
export function alignWith_<A, B, C>(
  self: ImmutableArray<A>,
  fb: ImmutableArray<B>,
  f: (_: These<A, B>) => C,
): ImmutableArray<C> {
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
}

/**
 * @tsplus fluent fncts.ImmutableArray align
 */
export function align_<A, B>(self: ImmutableArray<A>, fb: ImmutableArray<B>): ImmutableArray<These<A, B>> {
  return self.alignWith(fb, identity);
}

/**
 * @tsplus fluent fncts.ImmutableArray alt
 */
export function alt_<A, B>(self: ImmutableArray<A>, that: Lazy<ImmutableArray<B>>): ImmutableArray<A | B> {
  return self.concat(that());
}

/**
 * @tsplus fluent fncts.ImmutableArray ap
 */
export function ap_<A, B>(self: ImmutableArray<(a: A) => B>, fa: ImmutableArray<A>): ImmutableArray<B> {
  return self.flatMap((f) => fa.map(f));
}

/**
 * @tsplus fluent fncts.ImmutableArray append
 */
export function append_<A, B>(self: ImmutableArray<A>, last: B): ImmutableArray<A | B> {
  const selfArray = self._array;
  const len       = selfArray.length;
  const r         = Array<A | B>(len + 1);
  r[len]          = last;
  for (let i = 0; i < len; i++) {
    r[i] = selfArray[i]!;
  }
  return r.asImmutableArray;
}

/**
 * @tsplus fluent fncts.ImmutableArray crossWith
 */
export function crossWith_<A, B, C>(
  self: ImmutableArray<A>,
  fb: ImmutableArray<B>,
  f: (a: A, b: B) => C,
): ImmutableArray<C> {
  return self.flatMap((a) => fb.map((b) => f(a, b)));
}

/**
 * @tsplus fluent fncts.ImmutableArray cross
 */
export function cross_<A, B>(self: ImmutableArray<A>, fb: ImmutableArray<B>): ImmutableArray<Zipped.Make<A, B>> {
  return self.crossWith(fb, (a, b) => Zipped(a, b));
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
 * @tsplus fluent fncts.ImmutableArray flatMapWithIndex
 */
export function flatMapWithIndex_<A, B>(
  self: ImmutableArray<A>,
  f: (i: number, a: A) => ImmutableArray<B>,
): ImmutableArray<B> {
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
}

/**
 * @tsplus fluent fncts.ImmutableArray flatMap
 */
export function flatMap_<A, B>(self: ImmutableArray<A>, f: (a: A) => ImmutableArray<B>): ImmutableArray<B> {
  return self.flatMapWithIndex((_, a) => f(a));
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
 * @tsplus fluent fncts.ImmutableArray chop
 */
export function chop_<A, B>(
  as: ImmutableArray<A>,
  f: (as: ImmutableNonEmptyArray<A>) => readonly [B, ImmutableArray<A>],
): ImmutableArray<B> {
  const result: Array<B>    = [];
  let cs: ImmutableArray<A> = as;
  while (cs.isNonEmpty()) {
    const [b, c] = f(cs);
    result.push(b);
    cs = c;
  }
  return result.asImmutableArray;
}

export const chop = Pipeable(chop_);

/**
 * @tsplus fluent fncts.ImmutableArray collectWhile
 */
export function collectWhile_<A, B>(as: ImmutableArray<A>, f: (a: A) => Maybe<B>): ImmutableArray<B> {
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
    return input[0]!.traverse((a) => comprehensionLoop(scope.append(a), input.slice(1), f, g)).map((rs) => rs.flatten);
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
 * @tsplus fluent fncts.ImmutableArray concat
 * @tsplus operator fncts.ImmutableArray +
 */
export function concat_<A, B>(self: ImmutableArray<A>, that: ImmutableArray<B>): ImmutableArray<A | B> {
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
}

/**
 * @tsplus fluent fncts.ImmutableArray deleteAt
 */
export function deleteAt_<A>(as: ImmutableArray<A>, i: number): Maybe<ImmutableArray<A>> {
  return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeDeleteAt(i));
}

/**
 * @tsplus fluent fncts.ImmutableArray difference
 */
export function difference_<A>(
  self: ImmutableArray<A>,
  ys: ImmutableArray<A>,
  /** @tsplus auto */ E: P.Eq<A>,
): ImmutableArray<A> {
  return self.filter((a) => !ys.elem(a, E));
}

/**
 * @tsplus fluent fncts.ImmutableArray drop
 */
export function drop_<A>(self: ImmutableArray<A>, n: number): ImmutableArray<A> {
  return self.slice(n);
}

/**
 * @tsplus fluent fncts.ImmutableArray dropLast
 */
export function dropLast_<A>(self: ImmutableArray<A>, n: number): ImmutableArray<A> {
  return self.slice(0, self.length - n);
}

/**
 * @tsplus fluent fncts.ImmutableArray dropWhile
 */
export function dropWhile_<A>(self: ImmutableArray<A>, p: Predicate<A>): ImmutableArray<A> {
  return self.slice(self.spanIndexLeft(p));
}

/**
 * @tsplus fluent fncts.ImmutableArray dropLastWhile
 */
export function dropLastWhile_<A>(as: ImmutableArray<A>, p: Predicate<A>): ImmutableArray<A> {
  return as.slice(0, as.spanIndexRight(p) + 1);
}

/**
 * Test if a value is a member of an array. Takes an `Eq<A>` as a single
 * argument which returns the function to use to search for a value of type `A` in
 * an array of type `ImmutableArray<A>`.
 *
 * @tsplus fluent fncts.ImmutableArray elem
 */
export function elem_<A>(as: ImmutableArray<A>, a: A, /** @tsplus auto */ E: P.Eq<A>): boolean {
  const predicate = (element: A) => E.equals(element, a);
  const len       = as.length;
  for (let i = 0; i < len; i++) {
    if (predicate(as._array[i]!)) {
      return true;
    }
  }
  return false;
}

/**
 * @tsplus fluent fncts.ImmutableArray every
 */
export function every_<A, B extends A>(self: ImmutableArray<A>, p: Refinement<A, B>): self is ImmutableArray<B>;
export function every_<A>(self: ImmutableArray<A>, p: Predicate<A>): boolean;
export function every_<A>(self: ImmutableArray<A>, p: Predicate<A>): boolean {
  return self.everyWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.ImmutableArray everyWithIndex
 */
export function everyWithIndex_<A, B extends A>(
  self: ImmutableArray<A>,
  p: RefinementWithIndex<number, A, B>,
): self is ImmutableArray<B>;
export function everyWithIndex_<A>(self: ImmutableArray<A>, p: PredicateWithIndex<number, A>): boolean;
export function everyWithIndex_<A>(self: ImmutableArray<A>, p: PredicateWithIndex<number, A>): boolean {
  let result = true;
  let i      = 0;
  while (result && i < self.length) {
    result = p(i, self._array[i]!);
    i++;
  }
  return result;
}

/**
 * @tsplus fluent fncts.ImmutableArray exists
 */
export function exists_<A>(self: ImmutableArray<A>, p: Predicate<A>): self is ImmutableNonEmptyArray<A> {
  let result = false;
  let i      = 0;
  while (!result && i < self.length) {
    result = p(self._array[i]!);
    i++;
  }
  return result;
}

/**
 * @tsplus fluent fncts.ImmutableArray filter
 */
export function filter_<A, B extends A>(self: ImmutableArray<A>, p: Refinement<A, B>): ImmutableArray<B>;
export function filter_<A>(self: ImmutableArray<A>, p: Predicate<A>): ImmutableArray<A>;
export function filter_<A>(self: ImmutableArray<A>, p: Predicate<A>): ImmutableArray<A> {
  return self.filterWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.ImmutableArray filterWithIndex
 */
export function filterWithIndex_<A, B extends A>(
  self: ImmutableArray<A>,
  p: RefinementWithIndex<number, A, B>,
): ImmutableArray<B>;
export function filterWithIndex_<A>(self: ImmutableArray<A>, p: PredicateWithIndex<number, A>): ImmutableArray<A>;
export function filterWithIndex_<A>(self: ImmutableArray<A>, p: PredicateWithIndex<number, A>): ImmutableArray<A> {
  const result: Array<A> = [];
  for (let i = 0; i < self.length; i++) {
    const a = self._array[i]!;
    if (p(i, a)) {
      result.push(a);
    }
  }
  return result.asImmutableArray;
}

/**
 * @tsplus fluent fncts.ImmutableArray filterMapWithIndex
 */
export function filterMapWithIndex_<A, B>(fa: ImmutableArray<A>, f: (i: number, a: A) => Maybe<B>): ImmutableArray<B> {
  const result = [];
  for (let i = 0; i < fa.length; i++) {
    const maybeB = f(i, fa[i]!);
    if (maybeB.isJust()) {
      result.push(maybeB.value);
    }
  }
  return result.asImmutableArray;
}

/**
 * @tsplus fluent fncts.ImmutableArray filterMap
 */
export function filterMap_<A, B>(self: ImmutableArray<A>, f: (a: A) => Maybe<B>): ImmutableArray<B> {
  return self.filterMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.ImmutableArray find
 */
export function find_<A, B extends A>(self: ImmutableArray<A>, p: Refinement<A, B>): Maybe<B>;
export function find_<A>(self: ImmutableArray<A>, p: Predicate<A>): Maybe<A>;
export function find_<A>(self: ImmutableArray<A>, p: Predicate<A>): Maybe<A> {
  return self.findWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.ImmutableArray findIndex
 */
export function findIndex_<A>(as: ImmutableArray<A>, predicate: Predicate<A>): Maybe<number> {
  return as.findMapWithIndex((i, a) => (predicate(a) ? Just(i) : Nothing()));
}

/**
 * @tsplus fluent fncts.ImmutableArray findWithIndex
 */
export function findWithIndex_<A, B extends A>(as: ImmutableArray<A>, p: RefinementWithIndex<number, A, B>): Maybe<B>;
export function findWithIndex_<A>(as: ImmutableArray<A>, p: PredicateWithIndex<number, A>): Maybe<A>;
export function findWithIndex_<A>(as: ImmutableArray<A>, p: PredicateWithIndex<number, A>): Maybe<A> {
  const len = as.length;
  for (let i = 0; i < len; i++) {
    if (p(i, as._array[i]!)) {
      return Just(as._array[i]!);
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.ImmutableArray findMap
 */
export function findMap_<A, B>(as: ImmutableArray<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  return as.findMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.ImmutableArray findMapWithIndex
 */
export function findMapWithIndex_<A, B>(as: ImmutableArray<A>, f: (index: number, a: A) => Maybe<B>): Maybe<B> {
  const len = as.length;
  for (let i = 0; i < len; i++) {
    const v = f(i, as._array[i]!);
    if (v.isJust()) {
      return v;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.ImmutableArray findLast
 */
export function findLast_<A, B extends A>(as: ImmutableArray<A>, p: Refinement<A, B>): Maybe<B>;
export function findLast_<A>(as: ImmutableArray<A>, p: Predicate<A>): Maybe<A>;
export function findLast_<A>(as: ImmutableArray<A>, p: Predicate<A>): Maybe<A> {
  const len = as.length;
  for (let i = len - 1; i >= 0; i--) {
    if (p(as._array[i]!)) {
      return Just(as._array[i]!);
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.ImmutableArray findLastIndex
 */
export function findLastIndex_<A>(self: ImmutableArray<A>, p: Predicate<A>): Maybe<number> {
  return self.findLastMapWithIndex((i, a) => (p(a) ? Just(i) : Nothing()));
}

/**
 * @tsplus fluent fncts.ImmutableArray findLastMap
 */
export function findLastMap_<A, B>(as: ImmutableArray<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  return as.findLastMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.ImmutableArray findLastMapWithIndex
 */
export function findLastMapWithIndex_<A, B>(as: ImmutableArray<A>, f: (i: number, a: A) => Maybe<B>): Maybe<B> {
  const len = as.length;
  for (let i = len - 1; i >= 0; i--) {
    const v = f(i, as._array[i]!);
    if (v.isJust()) {
      return v;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.ImmutableArray foldLeftWithIndex
 * @tsplus fluent fncts.base.MutableArray foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(self: ImmutableArray<A>, b: B, f: (i: number, b: B, a: A) => B): B {
  const len = self.length;
  let r     = b;
  for (let i = 0; i < len; i++) {
    r = f(i, r, self._array[i]!);
  }
  return r;
}

/**
 * @tsplus fluent fncts.ImmutableArray foldLeft
 * @tsplus fluent fncts.base.MutableArray foldLeft
 */
export function foldLeft_<A, B>(self: ImmutableArray<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.ImmutableArray foldLeftWhile
 * @tsplus fluent fncts.base.MutableArray foldLeftWhile
 */
export function foldLeftWhile_<A, B>(self: ImmutableArray<A>, b: B, p: Predicate<B>, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndexWhile(b, p, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.ImmutableArray foldLeftWithIndexWhile
 * @tsplus fluent fncts.base.MutableArray foldLeftWithIndexWhile
 */
export function foldLeftWithIndexWhile_<A, B>(
  self: ImmutableArray<A>,
  b: B,
  p: Predicate<B>,
  f: (i: number, b: B, a: A) => B,
): B {
  let out  = b;
  let cont = p(out);
  for (let i = 0; cont && i < self.length; i++) {
    out  = f(i, out, self._array[i]!);
    cont = p(out);
  }
  return out;
}

/**
 * @tsplus fluent fncts.ImmutableArray fold
 */
export function fold<M>(self: ImmutableArray<M>, /** @tsplus auto */ M: Monoid<M>): M {
  return self.foldLeft(M.nat, M.combine);
}

/**
 * @tsplus fluent fncts.ImmutableArray foldMapWithIndex
 */
export function foldMapWithIndex_<A, M>(
  self: ImmutableArray<A>,
  f: (i: number, a: A) => M,
  /** @tsplus auto */ M: Monoid<M>,
): M {
  return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(b, f(i, a)));
}

/**
 * @tsplus fluent fncts.ImmutableArray foldMap
 */
export function foldMap_<A, M>(self: ImmutableArray<A>, f: (a: A) => M, /** @tsplus auto */ M: Monoid<M>): M {
  return self.foldMapWithIndex((_, a) => f(a), M);
}

/**
 * @tsplus fluent fncts.ImmutableArray foldRightWithIndex
 */
export function foldRightWithIndex_<A, B>(self: ImmutableArray<A>, b: B, f: (i: number, a: A, b: B) => B): B {
  let r = b;
  for (let i = self.length - 1; i >= 0; i--) {
    r = f(i, self._array[i]!, r);
  }
  return r;
}

/**
 * @tsplus fluent fncts.ImmutableArray foldRight
 */
export function foldRight_<A, B>(self: ImmutableArray<A>, b: B, f: (a: A, b: B) => B): B {
  return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.ImmutableArray foldRighWhile
 */
export function foldRightWhile_<A, B>(self: ImmutableArray<A>, b: B, p: Predicate<B>, f: (a: A, b: B) => B): B {
  return self.foldRightWithIndexWhile(b, p, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.ImmutableArray foldRightWithIndexWhile
 */
export function foldRightWithIndexWhile_<A, B>(
  self: ImmutableArray<A>,
  b: B,
  predicate: Predicate<B>,
  f: (i: number, a: A, b: B) => B,
): B {
  let out  = b;
  let cont = predicate(out);
  for (let i = self.length - 1; cont && i >= 0; i--) {
    out  = f(i, self._array[i]!, out);
    cont = predicate(out);
  }
  return out;
}

/**
 * @tsplus fluent fncts.ImmutableArray forEach
 */
export function forEach_<A, B>(self: ImmutableArray<A>, f: (a: A) => B): void {
  return self.forEach(f);
}

/**
 * @tsplus fluent fncts.ImmutableArray get
 * @tsplus fluent fncts.base.MutableArray get
 */
export function get_<A>(self: ImmutableArray<A>, i: number): Maybe<A> {
  return self.isOutOfBound(i) ? Nothing() : Just(self._array[i]!);
}

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
 * @tsplus fluent fncts.ImmutableArray group
 */
export function chopSelf<A>(self: ImmutableArray<A>, E: P.Eq<A>): ImmutableArray<ImmutableNonEmptyArray<A>> {
  return group(E)(self);
}

/**
 * @tsplus fluent fncts.ImmutableArray groupBy
 */
export function groupBy_<A>(
  self: ImmutableArray<A>,
  f: (a: A) => string,
): Readonly<Record<string, ImmutableNonEmptyArray<A>>> {
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
 * @tsplus fluent fncts.ImmutableArray insertAt
 */
export function insertAt_<A>(self: ImmutableArray<A>, i: number, a: A): Maybe<ImmutableNonEmptyArray<A>> {
  return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeInsertAt(i, a));
}

/**
 * @tsplus fluent fncts.ImmutableArray intersection
 */
export function intersection_<A>(
  self: ImmutableArray<A>,
  that: ImmutableArray<A>,
  /** @tsplus auto */ E: P.Eq<A>,
): ImmutableArray<A> {
  return self.filter((a) => that.elem(a, E));
}

export function intersperse_<A>(self: ImmutableArray<A>, a: A): ImmutableArray<A> {
  const len = self.length;
  return len === 0 ? self : self.slice(1, len).prependAll(a).prepend(self[0]!);
}

/**
 * @tsplus fluent fncts.ImmutableArray isEmpty
 */
export function isEmpty<A>(self: ImmutableArray<A>): boolean {
  return self.length === 0;
}

/**
 * @tsplus fluent fncts.ImmutableArray isOutOfBound
 */
export function isOutOfBound_<A>(self: ImmutableArray<A>, i: number): boolean {
  return i < 0 || i >= self.length;
}

/**
 * @tsplus fluent fncts.ImmutableArray join
 */
export function join(self: ImmutableArray<string>, separator: string): string {
  return self._array.join(separator);
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
 * @tsplus fluent fncts.ImmutableArray map
 */
export function map_<A, B>(self: ImmutableArray<A>, f: (a: A) => B): ImmutableArray<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.ImmutableArray mapAccum
 */
export function mapAccum_<A, S, B>(
  self: ImmutableArray<A>,
  s: S,
  f: (s: S, a: A) => readonly [B, S],
): readonly [ImmutableArray<B>, S] {
  const bs  = Array<B>(self.length);
  let state = s;
  for (let i = 0; i < self.length; i++) {
    const result = f(state, self._array[i]!);
    bs[i]        = result[0];
    state        = result[1];
  }
  return [bs.asImmutableArray, state];
}

/**
 * @tsplus fluent fncts.ImmutableArray mapWithIndex
 */
export function mapWithIndex_<A, B>(self: ImmutableArray<A>, f: (i: number, a: A) => B): ImmutableArray<B> {
  const len = self._array.length;
  const bs  = Array<B>(len);
  for (let i = 0; i < len; i++) {
    bs[i] = f(i, self._array[i]!);
  }
  return bs.asImmutableArray;
}

/**
 * @tsplus fluent fncts.ImmutableArray modifyAt
 */
export function modifyAt_<A>(self: ImmutableArray<A>, i: number, f: (a: A) => A): Maybe<ImmutableArray<A>> {
  return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeModifyAt(i, f));
}

/**
 * @tsplus fluent fncts.ImmutableArray mutate
 */
export function mutate_<A>(self: ImmutableArray<A>, f: (self: Array<A>) => void): ImmutableArray<A> {
  const mut = mutableClone(self);
  f(mut);
  return mut.asImmutableArray;
}

/**
 * @tsplus getter fncts.ImmutableArray mutableClone
 */
export function mutableClone<A>(self: ImmutableArray<A>): Array<A> {
  return self.slice(0)._array as Array<A>;
}

/**
 * @tsplus fluent fncts.ImmutableArray partitionWithIndex
 */
export function partitionWithIndex_<A, B extends A>(
  self: ImmutableArray<A>,
  p: RefinementWithIndex<number, A, B>,
): readonly [ImmutableArray<A>, ImmutableArray<B>];
export function partitionWithIndex_<A>(
  self: ImmutableArray<A>,
  p: PredicateWithIndex<number, A>,
): readonly [ImmutableArray<A>, ImmutableArray<A>];
export function partitionWithIndex_<A>(
  self: ImmutableArray<A>,
  p: PredicateWithIndex<number, A>,
): readonly [ImmutableArray<A>, ImmutableArray<A>] {
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
}

/**
 * @tsplus fluent fncts.ImmutableArray partition
 */
export function partition_<A, B extends A>(
  self: ImmutableArray<A>,
  p: Refinement<A, B>,
): readonly [ImmutableArray<A>, ImmutableArray<B>];
export function partition_<A>(
  self: ImmutableArray<A>,
  p: Predicate<A>,
): readonly [ImmutableArray<A>, ImmutableArray<A>];
export function partition_<A>(
  self: ImmutableArray<A>,
  p: Predicate<A>,
): readonly [ImmutableArray<A>, ImmutableArray<A>] {
  return self.partitionWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.ImmutableArray partitionMapWithIndex
 */
export function partitionMapWithIndex_<A, B, C>(
  self: ImmutableArray<A>,
  f: (i: number, a: A) => Either<B, C>,
): readonly [ImmutableArray<B>, ImmutableArray<C>] {
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
}

/**
 * @tsplus fluent fncts.ImmutableArray partitionMap
 */
export function partitionMap_<A, B, C>(
  self: ImmutableArray<A>,
  f: (a: A) => Either<B, C>,
): readonly [ImmutableArray<B>, ImmutableArray<C>] {
  return self.partitionMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.ImmutableArray prepend
 */
export function prepend_<A, B>(self: ImmutableArray<A>, head: B): ImmutableArray<A | B> {
  const len = self.length;
  const out = Array<A | B>(len + 1);
  out[0]    = head;
  for (let i = 0; i < len; i++) {
    out[i + 1] = self._array[i]!;
  }
  return out.asImmutableArray;
}

/**
 * @tsplus fluent fncts.ImmutableArray prependAll
 * @tsplus fluent fncts.base.MutableArray prependAll
 */
export function prependAll_<A>(self: ImmutableArray<A>, a: A): ImmutableArray<A> {
  const out: Array<A> = [];
  for (let i = 0; i < self.length; i++) {
    out.push(a, self._array[i]!);
  }
  return out.asImmutableArray;
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
 * @tsplus fluent fncts.ImmutableArray rotate
 */
export function rotate_<A>(self: ImmutableArray<A>, n: number): ImmutableArray<A> {
  const len = self.length;
  if (n === 0 || len <= 1 || len === Math.abs(n)) {
    return self;
  } else if (n < 0) {
    return self.rotate(len + n);
  } else {
    return self.slice(-n).concat(self.slice(0, len - n));
  }
}

/**
 * @tsplus fluent fncts.ImmutableArray scanLeft
 */
export function scanLeft_<A, B>(self: ImmutableArray<A>, b: B, f: (b: B, a: A) => B): ImmutableArray<B> {
  const l = self.length;
  const r = Array(l + 1);
  r[0]    = b;
  for (let i = 0; i < l; i++) {
    r[i + 1] = f(r[i]!, self._array[i]!);
  }
  return r.asImmutableArray;
}

/**
 * @tsplus fluent fncts.ImmutableArray scanRight
 */
export function scanRight_<A, B>(self: ImmutableArray<A>, b: B, f: (a: A, b: B) => B): ImmutableArray<B> {
  const l = self.length;
  const r = Array(l + 1);
  r[l]    = b;
  for (let i = l - 1; i >= 0; i--) {
    r[i] = f(self._array[i]!, r[i + 1]!);
  }
  return r.asImmutableArray;
}

/**
 * @tsplus fluent fncts.ImmutableArray sort
 */
export function sort<A>(self: ImmutableArray<A>, /** @tsplus auto */ O: P.Ord<A>): ImmutableArray<A> {
  return self.isEmpty() || self.length === 1 ? self : self._array.slice().sort(O.compare).asImmutableArray;
}

/**
 * @tsplus fluent fncts.ImmutableArray sortBy
 */
export function sortBy<A>(self: ImmutableArray<A>, Os: ImmutableArray<P.Ord<A>>): ImmutableArray<A> {
  return self.sort(Os.fold(P.Ord.getMonoid()));
}

/**
 * @tsplus fluent fncts.ImmutableArray spanLeft
 */
export function spanLeft_<A, B extends A>(
  self: ImmutableArray<A>,
  p: Refinement<A, B>,
): readonly [ImmutableArray<B>, ImmutableArray<A>];
export function spanLeft_<A>(self: ImmutableArray<A>, p: Predicate<A>): readonly [ImmutableArray<A>, ImmutableArray<A>];
export function spanLeft_<A>(
  self: ImmutableArray<A>,
  p: Predicate<A>,
): readonly [ImmutableArray<A>, ImmutableArray<A>] {
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
}

/**
 * @tsplus fluent fncts.ImmutableArray spanRight
 */
export function spanRight_<A, B extends A>(
  self: ImmutableArray<A>,
  p: Refinement<A, B>,
): readonly [ImmutableArray<A>, ImmutableArray<B>];
export function spanRight_<A>(
  self: ImmutableArray<A>,
  p: Predicate<A>,
): readonly [ImmutableArray<A>, ImmutableArray<A>];
export function spanRight_<A>(
  self: ImmutableArray<A>,
  p: Predicate<A>,
): readonly [ImmutableArray<A>, ImmutableArray<A>] {
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
}

/**
 * @tsplus fluent fncts.ImmutableArray spanIndexLeft
 */
export function spanIndexLeft_<A>(self: ImmutableArray<A>, p: Predicate<A>): number {
  const l = self.length;
  let i   = 0;
  for (; i < l; i++) {
    if (!p(self._array[i]!)) {
      break;
    }
  }
  return i;
}

/**
 * @tsplus fluent fncts.ImmutableArray spanIndexRight
 */
export function spanIndexRight_<A>(as: ImmutableArray<A>, predicate: Predicate<A>): number {
  let i = as.length - 1;
  for (; i >= 0; i--) {
    if (!predicate(as._array[i]!)) {
      break;
    }
  }
  return i;
}

/**
 * @tsplus getter fncts.ImmutableArray tail
 */
export function tail<A>(self: ImmutableArray<A>): Maybe<ImmutableArray<A>> {
  return self.isNonEmpty() ? Just(self.slice(1)) : Nothing();
}

/**
 * @tsplus fluent fncts.ImmutableArray take
 */
export function take_<A>(self: ImmutableArray<A>, n: number): ImmutableArray<A> {
  return self.slice(0, n);
}

/**
 * @tsplus fluent fncts.ImmutableArray takeLast
 */
export function takeLast_<A>(as: ImmutableArray<A>, n: number): ImmutableArray<A> {
  return isEmpty(as) ? ImmutableArray.empty() : as.slice(-n);
}

/**
 * @tsplus fluent fncts.ImmutableArray takeWhile
 */
export function takeWhile_<A, B extends A>(self: ImmutableArray<A>, p: Refinement<A, B>): ImmutableArray<B>;
export function takeWhile_<A>(self: ImmutableArray<A>, p: Predicate<A>): ImmutableArray<A>;
export function takeWhile_<A>(self: ImmutableArray<A>, p: Predicate<A>): ImmutableArray<A> {
  const i    = self.spanIndexLeft(p);
  const init = Array<A>(i);
  for (let j = 0; j < i; j++) {
    init[j] = self._array[j]!;
  }
  return init.asImmutableArray;
}

/**
 * @tsplus fluent fncts.ImmutableArray traverseWithIndex
 */
export const traverseWithIndex_: P.TraversableWithIndex<ImmutableArrayF>["traverseWithIndex"] = (ta, f, G) =>
  ta.foldLeftWithIndex(G.pure(ImmutableArray.empty()), (i, fbs, a) => fbs.zipWith(f(i, a), (bs, b) => bs.append(b), G));

/**
 * @tsplus fluent fncts.ImmutableArray traverse
 */
export const traverse_: P.Traversable<ImmutableArrayF>["traverse"] = (self, f, G) =>
  self.traverseWithIndex((_, a) => f(a), G);

/**
 * @tsplus fluent fncts.ImmutableArray union
 */
export function union_<A>(
  self: ImmutableArray<A>,
  that: ImmutableArray<A>,
  /** @tsplus auto */ E: P.Eq<A>,
): ImmutableArray<A> {
  return self.concat(that.filter((a) => !self.elem(a, E)));
}

/**
 * @tsplus fluent fncts.ImmutableArray uniq
 */
export function uniq<A>(self: ImmutableArray<A>, /** @tsplus auto */ E: P.Eq<A>): ImmutableArray<A> {
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
 * @tsplus fluent fncts.ImmutableArray unsafeDeleteAt
 */
export function unsafeDeleteAt_<A>(self: ImmutableArray<A>, i: number): ImmutableArray<A> {
  return self.mutate((xs) => {
    xs.splice(i, 1);
  });
}

/**
 * @tsplus fluent fncts.ImmutableArray unsafeInsertAt
 */
export function unsafeInsertAt_<A>(as: ImmutableArray<A>, i: number, a: A): ImmutableNonEmptyArray<A> {
  return as.mutate((xs) => {
    xs.splice(i, 0, a);
  }) as unknown as ImmutableNonEmptyArray<A>;
}

/**
 * @tsplus fluent fncts.ImmutableArray unsafeModifyAt
 */
export function unsafeModifyAt_<A>(as: ImmutableArray<A>, i: number, f: (a: A) => A): ImmutableArray<A> {
  const next = f(as[i]!);
  if (as[i] === next) {
    return as;
  }
  return as.mutate((xs) => {
    xs[i] = next;
  });
}

/**
 * @tsplus fluent fncts.ImmutableArray unsafeUpdateAt
 */
export function unsafeUpdateAt_<A>(as: ImmutableArray<A>, i: number, a: A): ImmutableArray<A> {
  if (as[i] === a) {
    return as;
  } else {
    return as.mutate((xs) => {
      xs[i] = a;
    });
  }
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
 * @tsplus fluent fncts.ImmutableArray updateAt
 */
export function updateAt_<A>(as: ImmutableArray<A>, i: number, a: A): Maybe<ImmutableArray<A>> {
  return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeUpdateAt(i, a));
}

/**
 * @tsplus fluent fncts.ImmutableArray wilt
 */
export function wilt_<G extends HKT, KG, QG, WG, XG, IG, SG, RG, EG, B1, A, B>(
  self: ImmutableArray<A>,
  f: (a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B1>>,
  /** @tsplus auto */
  G: P.Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, readonly [ImmutableArray<B>, ImmutableArray<B1>]> {
  return self
    .foldLeft(
      G.pure([[] as Array<B>, [] as Array<B1>] as const) as HKT.Kind<
        G,
        KG,
        QG,
        WG,
        XG,
        IG,
        SG,
        RG,
        EG,
        readonly [B[], B1[]]
      >,
      (fbs, a) =>
        f(a).zipWith(
          fbs,
          (eb, r) =>
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
          G,
        ),
    )
    .map(([b1s, b2s]) => [b1s.asImmutableArray, b2s.asImmutableArray], G);
}

export function wiltWithIndex_<G extends HKT, KG, QG, WG, XG, IG, SG, RG, EG, B1, A, B>(
  self: ImmutableArray<A>,
  f: (i: number, a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Either<B, B1>>,
  /** @tsplus auto */
  G: P.Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, readonly [ImmutableArray<B>, ImmutableArray<B1>]> {
  return self
    .foldLeftWithIndex(
      G.pure([[] as Array<B>, [] as Array<B1>] as const) as HKT.Kind<
        G,
        KG,
        QG,
        WG,
        XG,
        IG,
        SG,
        RG,
        EG,
        readonly [B[], B1[]]
      >,
      (i, fbs, a) =>
        f(i, a).zipWith(
          fbs,
          (eb, r) =>
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
          G,
        ),
    )
    .map(([b1s, b2s]) => [b1s.asImmutableArray, b2s.asImmutableArray], G);
}

/**
 * @tsplus fluent fncts.ImmutableArray wither
 */
export function wither_<G extends HKT, KG, QG, WG, XG, IG, SG, RG, EG, A, B>(
  self: ImmutableArray<A>,
  f: (a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  /** @tsplus auto */ G: P.Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, ImmutableArray<B>> {
  return self.witherWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.ImmutableArray witherWithIndex
 */
export function witherWithIndex_<G extends HKT, KG, QG, WG, XG, IG, SG, RG, EG, A, B>(
  self: ImmutableArray<A>,
  f: (k: number, a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Maybe<B>>,
  /** @tsplus auto */ G: P.Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, ImmutableArray<B>> {
  return self
    .foldLeftWithIndex(G.pure([] as Array<B>) as HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, B[]>, (i, b, a) =>
      f(i, a).zipWith(
        b,
        (maybeB, bs) => {
          if (maybeB.isJust()) {
            bs.push(maybeB.value);
          }
          return bs;
        },
        G,
      ),
    )
    .map((bs) => bs.asImmutableArray, G);
}

/**
 * @tsplus fluent fncts.ImmutableArray zip
 */
export function zip_<A, B>(self: ImmutableArray<A>, that: ImmutableArray<B>): ImmutableArray<readonly [A, B]> {
  return self.zipWith(that, tuple);
}

/**
 * @tsplus fluent fncts.ImmutableArray zipWith
 */
export function zipWith_<A, B, C>(
  self: ImmutableArray<A>,
  fb: ImmutableArray<B>,
  f: (a: A, b: B) => C,
): ImmutableArray<C> {
  const len = Math.min(self.length, fb.length);
  const fc  = Array<C>(len);
  for (let i = 0; i < len; i++) {
    fc[i] = f(self._array[i]!, fb._array[i]!);
  }
  return fc.asImmutableArray;
}
