import type { Either } from "../../data/Either";
import type { Lazy } from "../../data/function";
import type { Maybe } from "../../data/Maybe";
import type { Predicate, PredicateWithIndex } from "../../data/Predicate";
import type { Refinement, RefinementWithIndex } from "../../data/Refinement";
import type { Monoid } from "../../prelude";
import type { NonEmptyArray } from "../immutable/NonEmptyArray";
import type { ArrayF, ReadonlyNonEmptyArray } from "./definition";

import { Eval } from "../../control/Eval";
import { EitherTag } from "../../data/Either";
import { identity, tuple, unsafeCoerce } from "../../data/function";
import { Just, Nothing } from "../../data/Maybe";
import { These } from "../../data/These";
import * as P from "../../prelude";
import { ReadonlyArray } from "./definition";

/**
 * @tsplus fluent fncts.collection.immutable.Array alignWith
 */
export function alignWith_<A, B, C>(
  self: ReadonlyArray<A>,
  fb: ReadonlyArray<B>,
  f: (_: These<A, B>) => C,
): ReadonlyArray<C> {
  const minlen = Math.min(self.length, fb.length);
  const maxlen = Math.max(self.length, fb.length);
  const ret    = Array<C>(maxlen);
  for (let i = 0; i < minlen; i++) {
    ret[i] = f(These.both(self[i]!, fb[i]!));
  }
  if (minlen === maxlen) {
    return ret;
  } else if (self.length > fb.length) {
    for (let i = minlen; i < maxlen; i++) {
      ret[i] = f(These.left(self[i]!));
    }
  } else {
    for (let i = minlen; i < maxlen; i++) {
      ret[i] = f(These.right(fb[i]!));
    }
  }
  return ret;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array align
 */
export function align_<A, B>(
  self: ReadonlyArray<A>,
  fb: ReadonlyArray<B>,
): ReadonlyArray<These<A, B>> {
  return self.alignWith(fb, identity);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array alt
 */
export function alt_<A, B>(
  self: ReadonlyArray<A>,
  that: Lazy<ReadonlyArray<B>>,
): ReadonlyArray<A | B> {
  return (self as ReadonlyArray<A | B>).concat(that());
}

/**
 * @tsplus fluent fncts.collection.immutable.Array ap
 */
export function ap_<A, B>(
  self: ReadonlyArray<(a: A) => B>,
  fa: ReadonlyArray<A>,
): ReadonlyArray<B> {
  return self.chain((f) => fa.map(f));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array append
 */
export function append_<A, B>(self: ReadonlyArray<A>, last: B): ReadonlyArray<A | B> {
  const len = self.length;
  const r   = Array<A | B>(len + 1);
  r[len]    = last;
  for (let i = 0; i < len; i++) {
    r[i] = self[i]!;
  }
  return r;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array crossWith
 */
export function crossWith_<A, B, C>(
  self: ReadonlyArray<A>,
  fb: ReadonlyArray<B>,
  f: (a: A, b: B) => C,
): ReadonlyArray<C> {
  return self.chain((a) => fb.map((b) => f(a, b)));
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps chainRecDepthFirst
 */
export function chainRecDepthFirst<A, B>(
  a: A,
  f: (a: A) => ReadonlyArray<Either<A, B>>,
): ReadonlyArray<B> {
  const buffer   = f(a).slice();
  const out: B[] = [];

  while (buffer.length > 0) {
    const e = buffer.shift()!;
    if (e._tag === EitherTag.Left) {
      buffer.unshift(...f(e.left));
    } else {
      out.push(e.right);
    }
  }

  return out;
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps chainRecBreadthFirst
 */
export function chainRecBreadthFirst<A, B>(
  a: A,
  f: (a: A) => ReadonlyArray<Either<A, B>>,
): ReadonlyArray<B> {
  const initial                     = f(a);
  const buffer: Array<Either<A, B>> = [];
  const out: Array<B>               = [];

  function go(e: Either<A, B>): void {
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
 * @tsplus fluent fncts.collection.immutable.Array chainWithIndex
 */
export function chainWithIndex_<A, B>(
  self: ReadonlyArray<A>,
  f: (i: number, a: A) => ReadonlyArray<B>,
): ReadonlyArray<B> {
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
}

/**
 * @tsplus fluent fncts.collection.immutable.Array chain
 */
export function chain_<A, B>(
  self: ReadonlyArray<A>,
  f: (a: A) => ReadonlyArray<B>,
): ReadonlyArray<B> {
  return self.chainWithIndex((_, a) => f(a));
}

/**
 * @tsplus getter fncts.collection.immutable.Array flatten
 */
export function flatten<A>(self: ReadonlyArray<ReadonlyArray<A>>): ReadonlyArray<A> {
  return self.chain(identity);
}

/**
 * A useful recursion pattern for processing a `Array` to produce a new `Array`,
 * often used for "chopping" up the input `Array`. Typically chop is called with some function
 * that will consume an initial prefix of the `Array` and produce a value and the rest of the `Array`.
 *
 * @tsplus fluent fncts.collection.immutable.Array chop
 */
export function chop_<A, B>(
  as: ReadonlyArray<A>,
  f: (as: ReadonlyArray<A>) => readonly [B, ReadonlyArray<A>],
): ReadonlyArray<B> {
  const result: Array<B>   = [];
  let cs: ReadonlyArray<A> = as;
  while (isNonEmpty(cs)) {
    const [b, c] = f(cs);
    result.push(b);
    cs = c;
  }
  return result;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array chunksOf
 */
export function chunksOf_<A>(self: ReadonlyArray<A>, n: number): ReadonlyArray<ReadonlyArray<A>> {
  return self.chop((as) => as.splitAt(n));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array collectWhile
 */
export function collectWhile_<A, B>(as: ReadonlyArray<A>, f: (a: A) => Maybe<B>): ReadonlyArray<B> {
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
}

function comprehensionLoop<A, R>(
  scope: ReadonlyArray<A>,
  input: ReadonlyArray<ReadonlyArray<A>>,
  f: (...xs: ReadonlyArray<A>) => R,
  g: (...xs: ReadonlyArray<A>) => boolean,
): Eval<ReadonlyArray<R>> {
  if (input.length === 0) {
    return g(...scope) ? Eval.now([f(...scope)]) : Eval.now(Array.empty());
  } else {
    return input[0]!
      .traverse(Eval.Applicative)((a) => comprehensionLoop(scope.append(a), input.slice(1), f, g))
      .map((rs) => rs.flatten);
  }
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps comprehension
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
export function comprehension<A, R>(
  input: [ReadonlyArray<A>],
  f: (a: A) => R,
  g?: (a: A) => boolean,
): ReadonlyArray<R>;
export function comprehension<A, R>(
  input: ReadonlyArray<ReadonlyArray<A>>,
  f: (...xs: ReadonlyArray<A>) => R,
  g: (...xs: ReadonlyArray<A>) => boolean = () => true,
): ReadonlyArray<R> {
  return Eval.run(comprehensionLoop([], input, f, g));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array concat
 */
export function concat_<A, B>(
  self: ReadonlyArray<A>,
  that: ReadonlyArray<B>,
): ReadonlyArray<A | B> {
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
}

/**
 * @tsplus fluent fncts.collection.immutable.Array deleteAt
 */
export function deleteAt_<A>(as: ReadonlyArray<A>, i: number): Maybe<ReadonlyArray<A>> {
  return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeDeleteAt(i));
}

/**
 * @constrained
 */
export function difference_<A>(E: P.Eq<A>) {
  const elemE_ = elem_(E);
  return (self: ReadonlyArray<A>, ys: ReadonlyArray<A>): ReadonlyArray<A> =>
    self.filter((a) => !elemE_(ys, a));
}

/**
 * @tsplus getter fncts.collection.immutable.Array difference
 */
export function differenceSelf<A>(self: ReadonlyArray<A>) {
  return (E: P.Eq<A>) =>
    (that: ReadonlyArray<A>): ReadonlyArray<A> =>
      difference_(E)(self, that);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array drop
 */
export function drop_<A>(self: ReadonlyArray<A>, n: number): ReadonlyArray<A> {
  return self.slice(n);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array dropLast
 */
export function dropLast_<A>(self: ReadonlyArray<A>, n: number): ReadonlyArray<A> {
  return self.slice(0, self.length - n);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array dropWhile
 */
export function dropWhile_<A>(self: ReadonlyArray<A>, p: Predicate<A>): ReadonlyArray<A> {
  return self.slice(self.spanIndexLeft(p));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array dropLastWhile
 */
export function dropLastWhile_<A>(as: ReadonlyArray<A>, p: Predicate<A>): ReadonlyArray<A> {
  return as.slice(0, as.spanIndexRight(p) + 1);
}

/**
 * Test if a value is a member of an array. Takes an `Eq<A>` as a single
 * argument which returns the function to use to search for a value of type `A` in
 * an array of type `ReadonlyArray<A>`.
 *
 * @constrained
 */
export function elem_<A>(E: P.Eq<A>) {
  return (as: ReadonlyArray<A>, a: A): boolean => {
    const predicate = (element: A) => E.equals_(element, a);
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
 * Test if a value is a member of an array. Takes an `Eq<A>` as a single
 * argument which returns the function to use to search for a value of type `A` in
 * an array of type `ReadonlyArray<A>`.
 *
 * @tsplus fluent fncts.collection.immutable.Array elem
 */
export function elemSelf<A>(self: ReadonlyArray<A>) {
  return (E: P.Eq<A>) =>
    (a: A): boolean =>
      elem_(E)(self, a);
}

export function every_<A, B extends A>(
  self: ReadonlyArray<A>,
  p: Refinement<A, B>,
): self is ReadonlyArray<B>;
export function every_<A>(self: ReadonlyArray<A>, p: Predicate<A>): boolean;
export function every_<A>(self: ReadonlyArray<A>, p: Predicate<A>): boolean {
  return self.everyWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array everyWithIndex
 */
export function everyWithIndex_<A, B extends A>(
  self: ReadonlyArray<A>,
  p: RefinementWithIndex<number, A, B>,
): self is ReadonlyArray<B>;
export function everyWithIndex_<A>(
  self: ReadonlyArray<A>,
  p: PredicateWithIndex<number, A>,
): boolean;
export function everyWithIndex_<A>(
  self: ReadonlyArray<A>,
  p: PredicateWithIndex<number, A>,
): boolean {
  let result = true;
  let i      = 0;
  while (result && i < self.length) {
    result = p(i, self[i]!);
    i++;
  }
  return result;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array exists
 */
export function exists_<A>(
  self: ReadonlyArray<A>,
  p: Predicate<A>,
): self is ReadonlyNonEmptyArray<A> {
  let result = false;
  let i      = 0;
  while (!result && i < self.length) {
    result = p(self[i]!);
    i++;
  }
  return result;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array filter
 */
export function filter_<A, B extends A>(
  self: ReadonlyArray<A>,
  p: Refinement<A, B>,
): ReadonlyArray<B>;
export function filter_<A>(self: ReadonlyArray<A>, p: Predicate<A>): ReadonlyArray<A>;
export function filter_<A>(self: ReadonlyArray<A>, p: Predicate<A>): ReadonlyArray<A> {
  return self.filterWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array filterWithIndex
 */
export function filterWithIndex_<A, B extends A>(
  self: ReadonlyArray<A>,
  p: RefinementWithIndex<number, A, B>,
): ReadonlyArray<B>;
export function filterWithIndex_<A>(
  self: ReadonlyArray<A>,
  p: PredicateWithIndex<number, A>,
): ReadonlyArray<A>;
export function filterWithIndex_<A>(
  self: ReadonlyArray<A>,
  p: PredicateWithIndex<number, A>,
): ReadonlyArray<A> {
  const result: Array<A> = [];
  for (let i = 0; i < self.length; i++) {
    const a = self[i]!;
    if (p(i, a)) {
      result.push(a);
    }
  }
  return result;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array filterMapWithIndex
 */
export function filterMapWithIndex_<A, B>(
  fa: ReadonlyArray<A>,
  f: (i: number, a: A) => Maybe<B>,
): ReadonlyArray<B> {
  const result = [];
  for (let i = 0; i < fa.length; i++) {
    const maybeB = f(i, fa[i]!);
    if (maybeB.isJust()) {
      result.push(maybeB.value);
    }
  }
  return result;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array filterMap
 */
export function filterMap_<A, B>(self: ReadonlyArray<A>, f: (a: A) => Maybe<B>): ReadonlyArray<B> {
  return self.filterMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array find
 */
export function find_<A, B extends A>(self: ReadonlyArray<A>, p: Refinement<A, B>): Maybe<B>;
export function find_<A>(self: ReadonlyArray<A>, p: Predicate<A>): Maybe<A>;
export function find_<A>(self: ReadonlyArray<A>, p: Predicate<A>): Maybe<A> {
  return self.findWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findIndex
 */
export function findIndex_<A>(as: ReadonlyArray<A>, predicate: Predicate<A>): Maybe<number> {
  return as.findMapWithIndex((i, a) => (predicate(a) ? Just(i) : Nothing()));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findWithIndex
 */
export function findWithIndex_<A, B extends A>(
  as: ReadonlyArray<A>,
  p: RefinementWithIndex<number, A, B>,
): Maybe<B>;
export function findWithIndex_<A>(as: ReadonlyArray<A>, p: PredicateWithIndex<number, A>): Maybe<A>;
export function findWithIndex_<A>(
  as: ReadonlyArray<A>,
  p: PredicateWithIndex<number, A>,
): Maybe<A> {
  const len = as.length;
  for (let i = 0; i < len; i++) {
    if (p(i, as[i]!)) {
      return Just(as[i]!);
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findMap
 */
export function findMap_<A, B>(as: ReadonlyArray<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  return as.findMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findMapWithIndex
 */
export function findMapWithIndex_<A, B>(
  as: ReadonlyArray<A>,
  f: (index: number, a: A) => Maybe<B>,
): Maybe<B> {
  const len = as.length;
  for (let i = 0; i < len; i++) {
    const v = f(i, as[i]!);
    if (v.isJust()) {
      return v;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findLast
 */
export function findLast_<A, B extends A>(as: ReadonlyArray<A>, p: Refinement<A, B>): Maybe<B>;
export function findLast_<A>(as: ReadonlyArray<A>, p: Predicate<A>): Maybe<A>;
export function findLast_<A>(as: ReadonlyArray<A>, p: Predicate<A>): Maybe<A> {
  const len = as.length;
  for (let i = len - 1; i >= 0; i--) {
    if (p(as[i]!)) {
      return Just(as[i]!);
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findLastIndex
 */
export function findLastIndex_<A>(self: ReadonlyArray<A>, p: Predicate<A>): Maybe<number> {
  return self.findLastMapWithIndex((i, a) => (p(a) ? Just(i) : Nothing()));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findLastMap
 */
export function findLastMap_<A, B>(as: ReadonlyArray<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  return as.findLastMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findLastMapWithIndex
 */
export function findLastMapWithIndex_<A, B>(
  as: ReadonlyArray<A>,
  f: (i: number, a: A) => Maybe<B>,
): Maybe<B> {
  const len = as.length;
  for (let i = len - 1; i >= 0; i--) {
    const v = f(i, as[i]!);
    if (v.isJust()) {
      return v;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldLeftWithIndex
 * @tsplus fluent fncts.collection.mutable.Array foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(
  self: ReadonlyArray<A>,
  b: B,
  f: (i: number, b: B, a: A) => B,
): B {
  const len = self.length;
  let r     = b;
  for (let i = 0; i < len; i++) {
    r = f(i, r, self[i]!);
  }
  return r;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldLeft
 * @tsplus fluent fncts.collection.mutable.Array foldLeft
 */
export function foldLeft_<A, B>(self: ReadonlyArray<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldLeftWhile
 * @tsplus fluent fncts.collection.mutable.Array foldLeftWhile
 */
export function foldLeftWhile_<A, B>(
  self: ReadonlyArray<A>,
  b: B,
  p: Predicate<B>,
  f: (b: B, a: A) => B,
): B {
  return self.foldLeftWithIndexWhile(b, p, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldLeftWithIndexWhile
 * @tsplus fluent fncts.collection.mutable.Array foldLeftWithIndexWhile
 */
export function foldLeftWithIndexWhile_<A, B>(
  self: ReadonlyArray<A>,
  b: B,
  p: Predicate<B>,
  f: (i: number, b: B, a: A) => B,
): B {
  let out  = b;
  let cont = p(out);
  for (let i = 0; cont && i < self.length; i++) {
    out  = f(i, out, self[i]!);
    cont = p(out);
  }
  return out;
}

export function fold<M>(M: Monoid<M>) {
  return (self: ReadonlyArray<M>): M => self.foldLeft(M.nat, M.combine_);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array fold
 * @tsplus fluent fncts.collection.mutable.Array fold
 */
export function foldSelf<M>(self: ReadonlyArray<M>, M: Monoid<M>): M {
  return self.foldLeft(M.nat, M.combine_);
}

/**
 * @constrained
 */
export function foldMapWithIndex_<M>(M: Monoid<M>) {
  return <A>(self: ReadonlyArray<A>, f: (i: number, a: A) => M): M => {
    return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine_(b, f(i, a)));
  };
}

/**
 * @tsplus getter fncts.collection.immutable.Array foldMapWithIndex
 * @tsplus getter fncts.collection.mutable.Array foldMapWithIndex
 */
export function foldMapWithIndexSelf<A>(self: ReadonlyArray<A>) {
  return <M>(M: Monoid<M>) =>
    (f: (i: number, a: A) => M): M =>
      foldMapWithIndex_(M)(self, f);
}

/**
 * @constrained
 */
export function foldMap_<M>(M: Monoid<M>) {
  return <A>(self: ReadonlyArray<A>, f: (a: A) => M): M => {
    return self.foldMapWithIndex(M)((_, a) => f(a));
  };
}

/**
 * @tsplus getter fncts.collection.immutable.Array foldMap
 * @tsplus getter fncts.collection.mutable.Array foldMap
 */
export function foldMapSelf<A>(self: ReadonlyArray<A>) {
  return <M>(M: Monoid<M>) =>
    (f: (a: A) => M): M =>
      self.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldRightWithIndex
 * @tsplus fluent fncts.collection.mutable.Array foldRightWithIndex
 */
export function foldRightWithIndex_<A, B>(
  self: ReadonlyArray<A>,
  b: B,
  f: (i: number, a: A, b: B) => B,
): B {
  let r = b;
  for (let i = self.length - 1; i >= 0; i--) {
    r = f(i, self[i]!, r);
  }
  return r;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldRight
 * @tsplus fluent fncts.collection.mutable.Array foldRight
 */
export function foldRight_<A, B>(self: ReadonlyArray<A>, b: B, f: (a: A, b: B) => B): B {
  return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldRighWhile
 * @tsplus fluent fncts.collection.mutable.Array foldRightWhile
 */
export function foldRightWhile_<A, B>(
  self: ReadonlyArray<A>,
  b: B,
  p: Predicate<B>,
  f: (a: A, b: B) => B,
): B {
  return self.foldRightWithIndexWhile(b, p, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldRightWithIndexWhile
 * @tsplus fluent fncts.collection.mutable.Array foldRightWithIndexWhile
 */
export function foldRightWithIndexWhile_<A, B>(
  self: ReadonlyArray<A>,
  b: B,
  predicate: Predicate<B>,
  f: (i: number, a: A, b: B) => B,
): B {
  let out  = b;
  let cont = predicate(out);
  for (let i = self.length - 1; cont && i >= 0; i--) {
    out  = f(i, self[i]!, out);
    cont = predicate(out);
  }
  return out;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array forEach
 */
export function forEach_<A, B>(self: ReadonlyArray<A>, f: (a: A) => B): void {
  return self.forEach(f);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array get
 * @tsplus fluent fncts.collection.mutable.Array get
 */
export function get_<A>(self: ReadonlyArray<A>, i: number): Maybe<A> {
  return self.isOutOfBound(i) ? Nothing() : Just(self[i]!);
}

export function group<A>(
  E: P.Eq<A>,
): (self: ReadonlyArray<A>) => ReadonlyArray<ReadonlyNonEmptyArray<A>> {
  return chop((self) => {
    const h   = self[0]!;
    const out = [h] as NonEmptyArray<A>;
    let i     = 1;
    for (; i < self.length; i++) {
      const a = self[i]!;
      if (E.equals_(a, h)) {
        out.push(a);
      } else {
        break;
      }
    }
    return [out, self.slice(i)];
  });
}

/**
 * @tsplus fluent fncts.collection.immutable.Array group
 */
export function chopSelf<A>(
  self: ReadonlyArray<A>,
  E: P.Eq<A>,
): ReadonlyArray<ReadonlyNonEmptyArray<A>> {
  return group(E)(self);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array groupBy
 */
export function groupBy_<A>(
  self: ReadonlyArray<A>,
  f: (a: A) => string,
): Readonly<Record<string, ReadonlyNonEmptyArray<A>>> {
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
  return out;
}

/**
 * @tsplus getter fncts.collection.immutable.Array head
 */
export function head<A>(self: ReadonlyArray<A>): Maybe<A> {
  return self.isNonEmpty() ? Just(self[0]) : Nothing();
}

/**
 * @tsplus getter fncts.collection.immutable.Array init
 */
export function init<A>(self: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> {
  const len = self.length;
  return len === 0 ? Nothing() : Just(self.slice(0, len - 1));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array insertAt
 */
export function insertAt_<A>(
  self: ReadonlyArray<A>,
  i: number,
  a: A,
): Maybe<ReadonlyNonEmptyArray<A>> {
  return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeInsertAt(i, a));
}

export function intersection_<A>(E: P.Eq<A>) {
  const elemE = elem_(E);
  return (self: ReadonlyArray<A>, that: ReadonlyArray<A>): ReadonlyArray<A> =>
    self.filter((a) => elemE(that, a));
}

/**
 * @tsplus getter fncts.collection.immutable.Array intersection
 */
export function intersectionSelf<A>(self: ReadonlyArray<A>) {
  return (E: P.Eq<A>) =>
    (that: ReadonlyArray<A>): ReadonlyArray<A> =>
      intersection_(E)(self, that);
}

export function intersperse_<A>(self: ReadonlyArray<A>, a: A): ReadonlyArray<A> {
  const len = self.length;
  return len === 0 ? self : self.slice(1, len).prependAll(a).prepend(self[0]!);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array isEmpty
 */
export function isEmpty<A>(self: ReadonlyArray<A>): boolean {
  return self.length === 0;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array isNonEmpty
 */
export function isNonEmpty<A>(self: ReadonlyArray<A>): self is ReadonlyNonEmptyArray<A> {
  return self.length > 0;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array isOutOfBound
 */
export function isOutOfBound_<A>(self: ReadonlyArray<A>, i: number): boolean {
  return i < 0 || i >= self.length;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array join
 */
export function join(self: ReadonlyArray<string>, separator: string): string {
  return self.join(separator);
}

/**
 * @tsplus getter fncts.collection.immutable.Array last
 */
export function last<A>(self: ReadonlyArray<A>): Maybe<A> {
  return self.get(self.length - 1);
}

/**
 * @tsplus getter fncts.collection.immutable.Array lefts
 */
export function lefts<E, A>(self: ReadonlyArray<Either<E, A>>): ReadonlyArray<E> {
  const ls: Array<E> = [];
  for (let i = 0; i < self.length; i++) {
    const a = self[i]!;
    if (a._tag === EitherTag.Left) {
      ls.push(a.left);
    }
  }
  return ls;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array map
 */
export function map_<A, B>(self: ReadonlyArray<A>, f: (a: A) => B): ReadonlyArray<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array mapAccum
 */
export function mapAccum_<A, S, B>(
  self: ReadonlyArray<A>,
  s: S,
  f: (s: S, a: A) => readonly [B, S],
): readonly [ReadonlyArray<B>, S] {
  const bs  = Array<B>(self.length);
  let state = s;
  for (let i = 0; i < self.length; i++) {
    const result = f(state, self[i]!);
    bs[i]        = result[0];
    state        = result[1];
  }
  return [bs, state];
}

/**
 * @tsplus fluent fncts.collection.immutable.Array mapWithIndex
 */
export function mapWithIndex_<A, B>(
  self: ReadonlyArray<A>,
  f: (i: number, a: A) => B,
): ReadonlyArray<B> {
  const len = self.length;
  const bs  = Array<B>(len);
  for (let i = 0; i < len; i++) {
    bs[i] = f(i, self[i]!);
  }
  return bs;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array modifyAt
 */
export function modifyAt_<A>(
  self: ReadonlyArray<A>,
  i: number,
  f: (a: A) => A,
): Maybe<ReadonlyArray<A>> {
  return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeModifyAt(i, f));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array mutate
 */
export function mutate_<A>(self: ReadonlyArray<A>, f: (self: Array<A>) => void): ReadonlyArray<A> {
  const mut = mutableClone(self);
  f(mut);
  return mut;
}

/**
 * @tsplus getter fncts.collection.immutable.Array mutableClone
 */
export function mutableClone<A>(self: ReadonlyArray<A>): Array<A> {
  return self.slice(0);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array partitionWithIndex
 */
export function partitionWithIndex_<A, B extends A>(
  self: ReadonlyArray<A>,
  p: RefinementWithIndex<number, A, B>,
): readonly [ReadonlyArray<A>, ReadonlyArray<B>];
export function partitionWithIndex_<A>(
  self: ReadonlyArray<A>,
  p: PredicateWithIndex<number, A>,
): readonly [ReadonlyArray<A>, ReadonlyArray<A>];
export function partitionWithIndex_<A>(
  self: ReadonlyArray<A>,
  p: PredicateWithIndex<number, A>,
): readonly [ReadonlyArray<A>, ReadonlyArray<A>] {
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
}

/**
 * @tsplus fluent fncts.collection.immutable.Array partition
 */
export function partition_<A, B extends A>(
  self: ReadonlyArray<A>,
  p: Refinement<A, B>,
): readonly [ReadonlyArray<A>, ReadonlyArray<B>];
export function partition_<A>(
  self: ReadonlyArray<A>,
  p: Predicate<A>,
): readonly [ReadonlyArray<A>, ReadonlyArray<A>];
export function partition_<A>(
  self: ReadonlyArray<A>,
  p: Predicate<A>,
): readonly [ReadonlyArray<A>, ReadonlyArray<A>] {
  return self.partitionWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array partitionMapWithIndex
 */
export function partitionMapWithIndex_<A, B, C>(
  self: ReadonlyArray<A>,
  f: (i: number, a: A) => Either<B, C>,
): readonly [ReadonlyArray<B>, ReadonlyArray<C>] {
  const left  = [] as Array<B>;
  const right = [] as Array<C>;
  for (let i = 0; i < self.length; i++) {
    const ea = f(i, self[i]!);
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
}

/**
 * @tsplus fluent fncts.collection.immutable.Array partitionMap
 */
export function partitionMap_<A, B, C>(
  self: ReadonlyArray<A>,
  f: (a: A) => Either<B, C>,
): readonly [ReadonlyArray<B>, ReadonlyArray<C>] {
  return self.partitionMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array prepend
 */
export function prepend_<A, B>(self: ReadonlyArray<A>, head: B): ReadonlyArray<A | B> {
  const len = self.length;
  const out = Array<A | B>(len + 1);
  out[0]    = head;
  for (let i = 0; i < len; i++) {
    out[i + 1] = self[i]!;
  }
  return out;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array prependAll
 * @tsplus fluent fncts.collection.mutable.Array prependAll
 */
export function prependAll_<A>(self: ReadonlyArray<A>, a: A): ReadonlyArray<A> {
  const out: Array<A> = [];
  for (let i = 0; i < self.length; i++) {
    out.push(a, self[i]!);
  }
  return out;
}

/**
 * @tsplus getter fncts.collection.immutable.Array reverse
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
 * @tsplus getter fncts.collection.immutable.Array rights
 */
export function rights<E, A>(self: ReadonlyArray<Either<E, A>>): ReadonlyArray<A> {
  const rs: Array<A> = [];
  for (let i = 0; i < self.length; i++) {
    const a = self[i]!;
    if (a._tag === EitherTag.Right) {
      rs.push(a.right);
    }
  }
  return rs;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array rotate
 */
export function rotate_<A>(self: ReadonlyArray<A>, n: number): ReadonlyArray<A> {
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
 * @tsplus fluent fncts.collection.immutable.Array scanLeft
 */
export function scanLeft_<A, B>(
  self: ReadonlyArray<A>,
  b: B,
  f: (b: B, a: A) => B,
): ReadonlyArray<B> {
  const l = self.length;
  const r = Array(l + 1);
  r[0]    = b;
  for (let i = 0; i < l; i++) {
    r[i + 1] = f(r[i]!, self[i]!);
  }
  return r;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array scanRight
 */
export function scanRight_<A, B>(
  self: ReadonlyArray<A>,
  b: B,
  f: (a: A, b: B) => B,
): ReadonlyArray<B> {
  const l = self.length;
  const r = Array(l + 1);
  r[l]    = b;
  for (let i = l - 1; i >= 0; i--) {
    r[i] = f(self[i]!, r[i + 1]!);
  }
  return r;
}

export function sort<B>(O: P.Ord<B>) {
  return <A extends B>(self: ReadonlyArray<A>): ReadonlyArray<A> =>
    self.isEmpty() || self.length === 1 ? self : self.mutableClone.sort((a, b) => O.compare_(a, b));
}

export function sortBy<B>(Os: ReadonlyArray<P.Ord<B>>) {
  return <A extends B>(self: ReadonlyArray<A>): ReadonlyArray<A> =>
    self.sortWith(Os.fold(P.Ord.getMonoid()));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array sortBy
 */
export function sortBySelf<A extends B, B>(
  self: ReadonlyArray<A>,
  Os: ReadonlyArray<P.Ord<B>>,
): ReadonlyArray<A> {
  return sortBy(Os)(self);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array sortWith
 */
export function sortSelf<A extends B, B>(self: ReadonlyArray<A>, O: P.Ord<B>): ReadonlyArray<A> {
  return sort(O)(self);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array spanLeft
 */
export function spanLeft_<A, B extends A>(
  self: ReadonlyArray<A>,
  p: Refinement<A, B>,
): readonly [ReadonlyArray<B>, ReadonlyArray<A>];
export function spanLeft_<A>(
  self: ReadonlyArray<A>,
  p: Predicate<A>,
): readonly [ReadonlyArray<A>, ReadonlyArray<A>];
export function spanLeft_<A>(
  self: ReadonlyArray<A>,
  p: Predicate<A>,
): readonly [ReadonlyArray<A>, ReadonlyArray<A>] {
  const i    = spanIndexLeft_(self, p);
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
}

/**
 * @tsplus fluent fncts.collection.immutable.Array spanRight
 */
export function spanRight_<A, B extends A>(
  self: ReadonlyArray<A>,
  p: Refinement<A, B>,
): readonly [ReadonlyArray<A>, ReadonlyArray<B>];
export function spanRight_<A>(
  self: ReadonlyArray<A>,
  p: Predicate<A>,
): readonly [ReadonlyArray<A>, ReadonlyArray<A>];
export function spanRight_<A>(
  self: ReadonlyArray<A>,
  p: Predicate<A>,
): readonly [ReadonlyArray<A>, ReadonlyArray<A>] {
  const i    = spanIndexRight_(self, p);
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
}

/**
 * @tsplus fluent fncts.collection.immutable.Array spanIndexLeft
 */
export function spanIndexLeft_<A>(self: ReadonlyArray<A>, p: Predicate<A>): number {
  const l = self.length;
  let i   = 0;
  for (; i < l; i++) {
    if (!p(self[i]!)) {
      break;
    }
  }
  return i;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array spanIndexRight
 */
export function spanIndexRight_<A>(as: ReadonlyArray<A>, predicate: Predicate<A>): number {
  let i = as.length - 1;
  for (; i >= 0; i--) {
    if (!predicate(as[i]!)) {
      break;
    }
  }
  return i;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array splitAt
 */
export function splitAt_<A>(
  as: ReadonlyArray<A>,
  n: number,
): readonly [ReadonlyArray<A>, ReadonlyArray<A>] {
  return [as.slice(0, n), as.slice(n)];
}

/**
 * @tsplus fluent fncts.collection.immutable.Array splitWhere
 */
export function splitWhere_<A>(
  self: ReadonlyArray<A>,
  p: Predicate<A>,
): readonly [ReadonlyArray<A>, ReadonlyArray<A>] {
  let cont = true;
  let i    = 0;
  while (cont && i < self.length) {
    if (p(self[i]!)) {
      cont = false;
    } else {
      i++;
    }
  }
  return self.splitAt(i);
}

export const sequence: P.sequence<ArrayF> = (A) => (self) => self.traverse(A)(identity);

/**
 * @tsplus getter fncts.collection.immutable.Array sequence
 */
export const sequenceSelf: P.sequenceSelf<ArrayF> = (self) => (A) =>
  unsafeCoerce(self.traverse(A)(unsafeCoerce(identity)));

/**
 * @tsplus getter fncts.collection.immutable.Array tail
 */
export function tail<A>(self: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> {
  return self.isNonEmpty() ? Just(self.slice(1)) : Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.Array take
 */
export function take_<A>(self: ReadonlyArray<A>, n: number): ReadonlyArray<A> {
  return self.slice(0, n);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array takeLast
 */
export function takeLast_<A>(as: ReadonlyArray<A>, n: number): ReadonlyArray<A> {
  return isEmpty(as) ? ReadonlyArray.empty() : as.slice(-n);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array takeWhile
 */
export function takeWhile_<A, B extends A>(
  self: ReadonlyArray<A>,
  p: Refinement<A, B>,
): ReadonlyArray<B>;
export function takeWhile_<A>(self: ReadonlyArray<A>, p: Predicate<A>): ReadonlyArray<A>;
export function takeWhile_<A>(self: ReadonlyArray<A>, p: Predicate<A>): ReadonlyArray<A> {
  const i    = self.spanIndexLeft(p);
  const init = Array<A>(i);
  for (let j = 0; j < i; j++) {
    init[j] = self[j]!;
  }
  return init;
}

export const traverseWithIndex_: P.traverseWithIndex_<ArrayF> = P.mkTraverseWithIndex_<ArrayF>()(
  (_) => (A) => (ta, f) =>
    ta.foldLeftWithIndex(A.pure(ReadonlyArray.empty<typeof _.B>()), (i, fbs, a) =>
      A.zipWith_(fbs, f(i, a), (bs, b) => bs.append(b)),
    ),
);

/**
 * @tsplus dataFirst traverseWithIndex_
 */
export const traverseWithIndex: P.traverseWithIndex<ArrayF> = (A) => (f) => (self) =>
  traverseWithIndex_(A)(self, f);

/**
 * @tsplus getter fncts.collection.immutable.Array traverseWithIndex
 */
export const traverseWithIndexSelf: P.traverseWithIndexSelf<ArrayF> = (self) => (A) => (f) =>
  traverseWithIndex_(A)(self, f);

export const traverse_: P.traverse_<ArrayF> = (A) => (self, f) =>
  self.traverseWithIndex(A)((_, a) => f(a));

/**
 * @tsplus dataFirst traverse_
 */
export const traverse: P.traverse<ArrayF> = (A) => (f) => (self) =>
  self.traverseWithIndex(A)((_, a) => f(a));

/**
 * @tsplus getter fncts.collection.immutable.Array traverse
 */
export const traverseSelf: P.traverseSelf<ArrayF> = (self) => (A) => (f) =>
  self.traverseWithIndex(A)((_, a) => f(a));

export function union_<A>(E: P.Eq<A>) {
  const elemE = elem_(E);
  return (self: ReadonlyArray<A>, that: ReadonlyArray<A>): ReadonlyArray<A> =>
    self.concat(that.filter((a) => !elemE(self, a)));
}

export function uniq<A>(E: P.Eq<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    if (self.length === 1) {
      return self;
    }
    const elemE_ = elem_(E);
    const out    = [] as Array<A>;
    const len    = self.length;
    for (let i = 0; i < len; i++) {
      const a = self[i]!;
      if (!elemE_(out, a)) {
        out.push(a);
      }
    }
    return out;
  };
}

/**
 * @tsplus fluent fncts.collection.immutable.Array uniq
 */
export function uniqSelf<A>(self: ReadonlyArray<A>, E: P.Eq<A>): ReadonlyArray<A> {
  return uniq(E)(self);
}

/**
 * @tsplus getter fncts.collection.immutable.Array unprepend
 */
export function unprepend<A>(self: ReadonlyArray<A>): Maybe<readonly [A, ReadonlyArray<A>]> {
  return self.isNonEmpty() ? Just([self[0], self.slice(1)]) : Nothing();
}

/**
 * @tsplus getter fncts.collection.immutable.Array unsafeAsMutable
 */
export function unsafeAsMutable<A>(self: ReadonlyArray<A>): Array<A> {
  return self as Array<A>;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array unsafeDeleteAt
 */
export function unsafeDeleteAt_<A>(self: ReadonlyArray<A>, i: number): ReadonlyArray<A> {
  return self.mutate((xs) => {
    xs.splice(i, 1);
  });
}

/**
 * @tsplus fluent fncts.collection.immutable.Array unsafeInsertAt
 */
export function unsafeInsertAt_<A>(
  as: ReadonlyArray<A>,
  i: number,
  a: A,
): ReadonlyNonEmptyArray<A> {
  return mutate_(as, (xs) => {
    xs.splice(i, 0, a);
  }) as unknown as ReadonlyNonEmptyArray<A>;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array unsafeModifyAt
 */
export function unsafeModifyAt_<A>(
  as: ReadonlyArray<A>,
  i: number,
  f: (a: A) => A,
): ReadonlyArray<A> {
  const next = f(as[i]!);
  if (as[i] === next) {
    return as;
  }
  return mutate_(as, (xs) => {
    xs[i] = next;
  });
}

/**
 * @tsplus fluent fncts.collection.immutable.Array unsafeUpdateAt
 */
export function unsafeUpdateAt_<A>(as: ReadonlyArray<A>, i: number, a: A): ReadonlyArray<A> {
  if (as[i] === a) {
    return as;
  } else {
    return mutate_(as, (xs) => {
      xs[i] = a;
    });
  }
}

/**
 * @tsplus getter fncts.collection.immutable.Array unzip
 */
export function unzip<A, B>(
  self: ReadonlyArray<readonly [A, B]>,
): readonly [ReadonlyArray<A>, ReadonlyArray<B>] {
  const fa = Array<A>(self.length);
  const fb = Array<B>(self.length);

  for (let i = 0; i < self.length; i++) {
    fa[i] = self[i]![0]!;
    fb[i] = self[i]![1]!;
  }

  return [fa, fb];
}

/**
 * @tsplus fluent fncts.collection.immutable.Array updateAt
 */
export function updateAt_<A>(as: ReadonlyArray<A>, i: number, a: A): Maybe<ReadonlyArray<A>> {
  return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeUpdateAt(i, a));
}

export const wilt_: P.wilt_<ArrayF> = (A) => (self, f) => self.wiltWithIndex(A)((_, a) => f(a));

/**
 * @tsplus pipeable fncts.collection.immutable.Array wilt_
 */
export const wilt: P.wilt<ArrayF> = (A) => (f) => (self) => self.wiltWithIndex(A)((_, a) => f(a));

/**
 * @tsplus fluent fncts.collection.immutable.Array wilt
 */
export const wiltSelf: P.wiltSelf<ArrayF> = (self) => (A) => (f) =>
  self.wiltWithIndex(A)((_, a) => f(a));

export const wiltWithIndex_: P.wiltWithIndex_<ArrayF> = P.mkWiltWithIndex_<ArrayF>()(
  (_) => (A) => (self, f) =>
    self.foldLeftWithIndex(
      A.pure([Array.empty<typeof _.B>(), Array.empty<typeof _.B2>()]),
      (i, fbs, a) =>
        A.zipWith_(f(i, a), fbs, (eb, r) =>
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
);

/**
 * @tsplus dataFirst wiltWithIndex_
 */
export const wiltWithIndex: P.wiltWithIndex<ArrayF> = (A) => (f) => (self) =>
  wiltWithIndex_(A)(self, f);

/**
 * @tsplus getter fncts.collection.immutable.Array wiltWithIndex
 */
export const wiltWithIndexSelf: P.wiltWithIndexSelf<ArrayF> = (self) => (A) => (f) =>
  wiltWithIndex_(A)(self, f);

export const wither_: P.wither_<ArrayF> = (A) => (self, f) =>
  witherWithIndex_(A)(self, (_, a) => f(a));

/**
 * @tsplus dataFirst wither_
 */
export const wither: P.wither<ArrayF> = (A) => (f) => (self) => wither_(A)(self, f);

/**
 * @tsplus fluent fncts.collection.immutable.Array wither
 */
export const witherSelf: P.witherSelf<ArrayF> = (self) => (A) => (f) =>
  witherWithIndex_(A)(self, (_, a) => f(a));

export const witherWithIndex_: P.witherWithIndex_<ArrayF> = P.mkWitherWithIndex_<ArrayF>()(
  (_) => (A) => (self, f) =>
    self.foldLeftWithIndex(A.pure(ReadonlyArray.empty<typeof _.B>()), (i, b, a) =>
      A.zipWith_(f(i, a), b, (maybeB, bs) => (maybeB.isJust() ? bs.append(maybeB.value) : bs)),
    ),
);

/**
 * @tsplus dataFirst witherWithIndex_
 */
export const witherWithIndex: P.witherWithIndex<ArrayF> = (A) => (f) => (self) =>
  witherWithIndex_(A)(self, f);

/**
 * @tsplus fluent fncts.collection.immutable.Array witherWithIndex
 */
export const witherWithIndexSelf: P.witherWithIndexSelf<ArrayF> = (self) => (A) => (f) =>
  witherWithIndex_(A)(self, f);

/**
 * @tsplus fluent fncts.collection.immutable.Array zip
 */
export function zip_<A, B>(
  self: ReadonlyArray<A>,
  that: ReadonlyArray<B>,
): ReadonlyArray<readonly [A, B]> {
  return self.zipWith(that, tuple);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array zipWith
 */
export function zipWith_<A, B, C>(
  self: ReadonlyArray<A>,
  fb: ReadonlyArray<B>,
  f: (a: A, b: B) => C,
): ReadonlyArray<C> {
  const len = Math.min(self.length, fb.length);
  const fc  = Array<C>(len);
  for (let i = 0; i < len; i++) {
    fc[i] = f(self[i]!, fb[i]!);
  }
  return fc;
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst alignWith_
 */
export function alignWith<A, B, C>(fb: ReadonlyArray<B>, f: (_: These<A, B>) => C) {
  return (self: ReadonlyArray<A>): ReadonlyArray<C> => alignWith_(self, fb, f);
}
/**
 * @tsplus dataFirst align_
 */
export function align<B>(fb: ReadonlyArray<B>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<These<A, B>> => align_(self, fb);
}
/**
 * @tsplus dataFirst alt_
 */
export function alt<B>(that: Lazy<ReadonlyArray<B>>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A | B> => alt_(self, that);
}
/**
 * @tsplus dataFirst ap_
 */
export function ap<A>(fa: ReadonlyArray<A>) {
  return <B>(self: ReadonlyArray<(a: A) => B>): ReadonlyArray<B> => ap_(self, fa);
}
/**
 * @tsplus dataFirst append_
 */
export function append<B>(last: B) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A | B> => append_(self, last);
}
/**
 * @tsplus dataFirst crossWith_
 */
export function crossWith<A, B, C>(fb: ReadonlyArray<B>, f: (a: A, b: B) => C) {
  return (self: ReadonlyArray<A>): ReadonlyArray<C> => crossWith_(self, fb, f);
}
/**
 * @tsplus dataFirst chainWithIndex_
 */
export function chainWithIndex<A, B>(f: (i: number, a: A) => ReadonlyArray<B>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => chainWithIndex_(self, f);
}
/**
 * @tsplus dataFirst chain_
 */
export function chain<A, B>(f: (a: A) => ReadonlyArray<B>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => chain_(self, f);
}
/**
 * A useful recursion pattern for processing a `Array` to produce a new `Array`,
 * often used for "chopping" up the input `Array`. Typically chop is called with some function
 * that will consume an initial prefix of the `Array` and produce a value and the rest of the `Array`.
 * @tsplus dataFirst chop_
 */
export function chop<A, B>(f: (as: ReadonlyArray<A>) => readonly [B, ReadonlyArray<A>]) {
  return (as: ReadonlyArray<A>): ReadonlyArray<B> => chop_(as, f);
}
/**
 * @tsplus dataFirst chunksOf_
 */
export function chunksOf(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<ReadonlyArray<A>> => chunksOf_(self, n);
}
/**
 * @tsplus dataFirst collectWhile_
 */
export function collectWhile<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): ReadonlyArray<B> => collectWhile_(as, f);
}
/**
 * @tsplus dataFirst concat_
 */
export function concat<B>(that: ReadonlyArray<B>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A | B> => concat_(self, that);
}
/**
 * @tsplus dataFirst deleteAt_
 */
export function deleteAt(i: number) {
  return <A>(as: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> => deleteAt_(as, i);
}
/**
 * @tsplus dataFirst drop_
 */
export function drop(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => drop_(self, n);
}
/**
 * @tsplus dataFirst dropLast_
 */
export function dropLast(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => dropLast_(self, n);
}
/**
 * @tsplus dataFirst dropWhile_
 */
export function dropWhile<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => dropWhile_(self, p);
}
/**
 * @tsplus dataFirst dropLastWhile_
 */
export function dropLastWhile<A>(p: Predicate<A>) {
  return (as: ReadonlyArray<A>): ReadonlyArray<A> => dropLastWhile_(as, p);
}
/**
 * @tsplus dataFirst every_
 */
export function every<A, B extends A>(
  p: Refinement<A, B>,
): (self: ReadonlyArray<A>) => self is ReadonlyArray<B>;
/**
 * @tsplus dataFirst every_
 */
export function every<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => boolean;
/**
 * @tsplus dataFirst every_
 */
export function every<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): boolean => every_(self, p);
}
/**
 * @tsplus dataFirst everyWithIndex_
 */
export function everyWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: ReadonlyArray<A>) => self is ReadonlyArray<B>;
/**
 * @tsplus dataFirst everyWithIndex_
 */
export function everyWithIndex<A>(
  p: PredicateWithIndex<number, A>,
): (self: ReadonlyArray<A>) => boolean;
/**
 * @tsplus dataFirst everyWithIndex_
 */
export function everyWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: ReadonlyArray<A>): boolean => everyWithIndex_(self, p);
}
/**
 * @tsplus dataFirst exists_
 */
export function exists<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): self is ReadonlyNonEmptyArray<A> => exists_(self, p);
}
/**
 * @tsplus dataFirst filter_
 */
export function filter<A, B extends A>(
  p: Refinement<A, B>,
): (self: ReadonlyArray<A>) => ReadonlyArray<B>;
/**
 * @tsplus dataFirst filter_
 */
export function filter<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => ReadonlyArray<A>;
/**
 * @tsplus dataFirst filter_
 */
export function filter<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => filter_(self, p);
}
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: ReadonlyArray<A>) => ReadonlyArray<B>;
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A>(
  p: PredicateWithIndex<number, A>,
): (self: ReadonlyArray<A>) => ReadonlyArray<A>;
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => filterWithIndex_(self, p);
}
/**
 * @tsplus dataFirst filterMapWithIndex_
 */
export function filterMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (fa: ReadonlyArray<A>): ReadonlyArray<B> => filterMapWithIndex_(fa, f);
}
/**
 * @tsplus dataFirst filterMap_
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => filterMap_(self, f);
}
/**
 * @tsplus dataFirst find_
 */
export function find<A, B extends A>(p: Refinement<A, B>): (self: ReadonlyArray<A>) => Maybe<B>;
/**
 * @tsplus dataFirst find_
 */
export function find<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => Maybe<A>;
/**
 * @tsplus dataFirst find_
 */
export function find<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): Maybe<A> => find_(self, p);
}
/**
 * @tsplus dataFirst findIndex_
 */
export function findIndex<A>(predicate: Predicate<A>) {
  return (as: ReadonlyArray<A>): Maybe<number> => findIndex_(as, predicate);
}
/**
 * @tsplus dataFirst findWithIndex_
 */
export function findWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (as: ReadonlyArray<A>) => Maybe<B>;
/**
 * @tsplus dataFirst findWithIndex_
 */
export function findWithIndex<A>(
  p: PredicateWithIndex<number, A>,
): (as: ReadonlyArray<A>) => Maybe<A>;
/**
 * @tsplus dataFirst findWithIndex_
 */
export function findWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (as: ReadonlyArray<A>): Maybe<A> => findWithIndex_(as, p);
}
/**
 * @tsplus dataFirst findMap_
 */
export function findMap<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): Maybe<B> => findMap_(as, f);
}
/**
 * @tsplus dataFirst findMapWithIndex_
 */
export function findMapWithIndex<A, B>(f: (index: number, a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): Maybe<B> => findMapWithIndex_(as, f);
}
/**
 * @tsplus dataFirst findLast_
 */
export function findLast<A, B extends A>(p: Refinement<A, B>): (as: ReadonlyArray<A>) => Maybe<B>;
/**
 * @tsplus dataFirst findLast_
 */
export function findLast<A>(p: Predicate<A>): (as: ReadonlyArray<A>) => Maybe<A>;
/**
 * @tsplus dataFirst findLast_
 */
export function findLast<A>(p: Predicate<A>) {
  return (as: ReadonlyArray<A>): Maybe<A> => findLast_(as, p);
}
/**
 * @tsplus dataFirst findLastIndex_
 */
export function findLastIndex<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): Maybe<number> => findLastIndex_(self, p);
}
/**
 * @tsplus dataFirst findLastMap_
 */
export function findLastMap<A, B>(f: (a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): Maybe<B> => findLastMap_(as, f);
}
/**
 * @tsplus dataFirst findLastMapWithIndex_
 */
export function findLastMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (as: ReadonlyArray<A>): Maybe<B> => findLastMapWithIndex_(as, f);
}
/**
 * @tsplus dataFirst foldLeftWithIndex_
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => foldLeftWithIndex_(self, b, f);
}
/**
 * @tsplus dataFirst foldLeft_
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => foldLeft_(self, b, f);
}
/**
 * @tsplus dataFirst foldLeftWhile_
 */
export function foldLeftWhile<A, B>(b: B, p: Predicate<B>, f: (b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => foldLeftWhile_(self, b, p, f);
}
/**
 * @tsplus dataFirst foldLeftWithIndexWhile_
 */
export function foldLeftWithIndexWhile<A, B>(
  b: B,
  p: Predicate<B>,
  f: (i: number, b: B, a: A) => B,
) {
  return (self: ReadonlyArray<A>): B => foldLeftWithIndexWhile_(self, b, p, f);
}
/**
 * @tsplus dataFirst foldRightWithIndex_
 */
export function foldRightWithIndex<A, B>(b: B, f: (i: number, a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): B => foldRightWithIndex_(self, b, f);
}
/**
 * @tsplus dataFirst foldRight_
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): B => foldRight_(self, b, f);
}
/**
 * @tsplus dataFirst foldRightWhile_
 */
export function foldRightWhile<A, B>(b: B, p: Predicate<B>, f: (a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): B => foldRightWhile_(self, b, p, f);
}
/**
 * @tsplus dataFirst foldRightWithIndexWhile_
 */
export function foldRightWithIndexWhile<A, B>(
  b: B,
  predicate: Predicate<B>,
  f: (i: number, a: A, b: B) => B,
) {
  return (self: ReadonlyArray<A>): B => foldRightWithIndexWhile_(self, b, predicate, f);
}
/**
 * @tsplus dataFirst forEach_
 */
export function forEach<A, B>(f: (a: A) => B) {
  return (self: ReadonlyArray<A>): void => forEach_(self, f);
}
/**
 * @tsplus dataFirst get_
 */
export function get(i: number) {
  return <A>(self: ReadonlyArray<A>): Maybe<A> => get_(self, i);
}
/**
 * @tsplus dataFirst groupBy_
 */
export function groupBy<A>(f: (a: A) => string) {
  return (self: ReadonlyArray<A>): Readonly<Record<string, ReadonlyNonEmptyArray<A>>> =>
    groupBy_(self, f);
}
/**
 * @tsplus dataFirst insertAt_
 */
export function insertAt<A>(i: number, a: A) {
  return (self: ReadonlyArray<A>): Maybe<ReadonlyNonEmptyArray<A>> => insertAt_(self, i, a);
}
/**
 * @tsplus dataFirst intersperse_
 */
export function intersperse<A>(a: A) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => intersperse_(self, a);
}
/**
 * @tsplus dataFirst isOutOfBound_
 */
export function isOutOfBound(i: number) {
  return <A>(self: ReadonlyArray<A>): boolean => isOutOfBound_(self, i);
}
/**
 * @tsplus dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => map_(self, f);
}
/**
 * @tsplus dataFirst mapAccum_
 */
export function mapAccum<A, S, B>(s: S, f: (s: S, a: A) => readonly [B, S]) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<B>, S] => mapAccum_(self, s, f);
}
/**
 * @tsplus dataFirst mapWithIndex_
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => mapWithIndex_(self, f);
}
/**
 * @tsplus dataFirst modifyAt_
 */
export function modifyAt<A>(i: number, f: (a: A) => A) {
  return (self: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> => modifyAt_(self, i, f);
}
/**
 * @tsplus dataFirst mutate_
 */
export function mutate<A>(f: (self: Array<A>) => void) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => mutate_(self, f);
}
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<B>];
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A>(
  p: PredicateWithIndex<number, A>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<A>];
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] =>
    partitionWithIndex_(self, p);
}
/**
 * @tsplus dataFirst partition_
 */
export function partition<A, B extends A>(
  p: Refinement<A, B>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<B>];
/**
 * @tsplus dataFirst partition_
 */
export function partition<A>(
  p: Predicate<A>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<A>];
/**
 * @tsplus dataFirst partition_
 */
export function partition<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] =>
    partition_(self, p);
}
/**
 * @tsplus dataFirst partitionMapWithIndex_
 */
export function partitionMapWithIndex<A, B, C>(f: (i: number, a: A) => Either<B, C>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<B>, ReadonlyArray<C>] =>
    partitionMapWithIndex_(self, f);
}
/**
 * @tsplus dataFirst partitionMap_
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<B>, ReadonlyArray<C>] =>
    partitionMap_(self, f);
}
/**
 * @tsplus dataFirst prepend_
 */
export function prepend<B>(head: B) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A | B> => prepend_(self, head);
}
/**
 * @tsplus dataFirst prependAll_
 */
export function prependAll<A>(a: A) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => prependAll_(self, a);
}
/**
 * @tsplus dataFirst rotate_
 */
export function rotate(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => rotate_(self, n);
}
/**
 * @tsplus dataFirst scanLeft_
 */
export function scanLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => scanLeft_(self, b, f);
}
/**
 * @tsplus dataFirst scanRight_
 */
export function scanRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => scanRight_(self, b, f);
}
/**
 * @tsplus dataFirst spanLeft_
 */
export function spanLeft<A, B extends A>(
  p: Refinement<A, B>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<B>, ReadonlyArray<A>];
/**
 * @tsplus dataFirst spanLeft_
 */
export function spanLeft<A>(
  p: Predicate<A>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<A>];
/**
 * @tsplus dataFirst spanLeft_
 */
export function spanLeft<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] =>
    spanLeft_(self, p);
}
/**
 * @tsplus dataFirst spanRight_
 */
export function spanRight<A, B extends A>(
  p: Refinement<A, B>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<B>];
/**
 * @tsplus dataFirst spanRight_
 */
export function spanRight<A>(
  p: Predicate<A>,
): (self: ReadonlyArray<A>) => readonly [ReadonlyArray<A>, ReadonlyArray<A>];
/**
 * @tsplus dataFirst spanRight_
 */
export function spanRight<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] =>
    spanRight_(self, p);
}
/**
 * @tsplus dataFirst spanIndexLeft_
 */
export function spanIndexLeft<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): number => spanIndexLeft_(self, p);
}
/**
 * @tsplus dataFirst spanIndexRight_
 */
export function spanIndexRight<A>(predicate: Predicate<A>) {
  return (as: ReadonlyArray<A>): number => spanIndexRight_(as, predicate);
}
/**
 * @tsplus dataFirst splitAt_
 */
export function splitAt(n: number) {
  return <A>(as: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] =>
    splitAt_(as, n);
}
/**
 * @tsplus dataFirst splitWhere_
 */
export function splitWhere<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] =>
    splitWhere_(self, p);
}
/**
 * @tsplus dataFirst take_
 */
export function take(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => take_(self, n);
}
/**
 * @tsplus dataFirst takeLast_
 */
export function takeLast(n: number) {
  return <A>(as: ReadonlyArray<A>): ReadonlyArray<A> => takeLast_(as, n);
}
/**
 * @tsplus dataFirst takeWhile_
 */
export function takeWhile<A, B extends A>(
  p: Refinement<A, B>,
): (self: ReadonlyArray<A>) => ReadonlyArray<B>;
/**
 * @tsplus dataFirst takeWhile_
 */
export function takeWhile<A>(p: Predicate<A>): (self: ReadonlyArray<A>) => ReadonlyArray<A>;
/**
 * @tsplus dataFirst takeWhile_
 */
export function takeWhile<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => takeWhile_(self, p);
}
/**
 * @tsplus dataFirst unsafeDeleteAt_
 */
export function unsafeDeleteAt(i: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<A> => unsafeDeleteAt_(self, i);
}
/**
 * @tsplus dataFirst unsafeInsertAt_
 */
export function unsafeInsertAt<A>(i: number, a: A) {
  return (as: ReadonlyArray<A>): ReadonlyNonEmptyArray<A> => unsafeInsertAt_(as, i, a);
}
/**
 * @tsplus dataFirst unsafeModifyAt_
 */
export function unsafeModifyAt<A>(i: number, f: (a: A) => A) {
  return (as: ReadonlyArray<A>): ReadonlyArray<A> => unsafeModifyAt_(as, i, f);
}
/**
 * @tsplus dataFirst unsafeUpdateAt_
 */
export function unsafeUpdateAt<A>(i: number, a: A) {
  return (as: ReadonlyArray<A>): ReadonlyArray<A> => unsafeUpdateAt_(as, i, a);
}
/**
 * @tsplus dataFirst updateAt_
 */
export function updateAt<A>(i: number, a: A) {
  return (as: ReadonlyArray<A>): Maybe<ReadonlyArray<A>> => updateAt_(as, i, a);
}
/**
 * @tsplus dataFirst zip_
 */
export function zip<B>(that: ReadonlyArray<B>) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<readonly [A, B]> => zip_(self, that);
}
/**
 * @tsplus dataFirst zipWith_
 */
export function zipWith<A, B, C>(fb: ReadonlyArray<B>, f: (a: A, b: B) => C) {
  return (self: ReadonlyArray<A>): ReadonlyArray<C> => zipWith_(self, fb, f);
}
/**
 * @constrained
 * @tsplus dataFirst difference_
 */
export function difference<A>(E: P.Eq<A>) {
  return (ys: ReadonlyArray<A>) => (self: ReadonlyArray<A>) => difference_(E)(self, ys);
}
/**
 * Test if a value is a member of an array. Takes an `Eq<A>` as a single
 * argument which returns the function to use to search for a value of type `A` in
 * an array of type `ReadonlyArray<A>`.
 * @constrained
 * @tsplus dataFirst elem_
 */
export function elem<A>(E: P.Eq<A>) {
  return (a: A) => (as: ReadonlyArray<A>) => elem_(E)(as, a);
}
/**
 * @constrained
 * @tsplus dataFirst foldMapWithIndex_
 */
export function foldMapWithIndex<M>(M: Monoid<M>) {
  return <A>(f: (i: number, a: A) => M) =>
    (self: ReadonlyArray<A>) =>
      foldMapWithIndex_(M)(self, f);
}
/**
 * @constrained
 * @tsplus dataFirst foldMap_
 */
export function foldMap<M>(M: Monoid<M>) {
  return <A>(f: (a: A) => M) =>
    (self: ReadonlyArray<A>) =>
      foldMap_(M)(self, f);
}
// codegen:end
