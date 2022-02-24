import type { Either } from "../../../data/Either";
import type { Lazy } from "../../../data/function";
import type { Maybe } from "../../../data/Maybe";
import type { Predicate, PredicateWithIndex } from "../../../data/Predicate";
import type { Refinement, RefinementWithIndex } from "../../../data/Refinement";
import type { Monoid } from "../../../prelude";
import type { MutableNonEmptyArray, NonEmptyArray } from "../NonEmptyArray/definition";
import type { ArrayF, MutableArray } from "./definition";

import { Eval } from "../../../control/Eval";
import { EitherTag } from "../../../data/Either";
import { identity, tuple, unsafeCoerce } from "../../../data/function";
import { Just, Nothing } from "../../../data/Maybe";
import { These } from "../../../data/These";
import * as P from "../../../prelude";
import * as _ from "../NonEmptyArray/api.js";
import { Array } from "./definition";

/**
 * @tsplus fluent fncts.collection.immutable.Array alignWith
 */
export function alignWith_<A, B, C>(
  self: Array<A>,
  fb: Array<B>,
  f: (_: These<A, B>) => C,
): Array<C> {
  const minlen = Math.min(self.length, fb.length);
  const maxlen = Math.max(self.length, fb.length);
  const ret    = Array.alloc<C>(maxlen);
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
export function align_<A, B>(self: Array<A>, fb: Array<B>): Array<These<A, B>> {
  return self.alignWith(fb, identity);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array alt
 */
export function alt_<A, B>(self: Array<A>, that: Lazy<Array<B>>): Array<A | B> {
  return self.concat(that());
}

/**
 * @tsplus fluent fncts.collection.immutable.Array ap
 */
export function ap_<A, B>(self: Array<(a: A) => B>, fa: Array<A>): Array<B> {
  return self.chain((f) => fa.map(f));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array crossWith
 */
export function crossWith_<A, B, C>(self: Array<A>, fb: Array<B>, f: (a: A, b: B) => C): Array<C> {
  return self.chain((a) => fb.map((b) => f(a, b)));
}

/**
 * @tsplus static fncts.collection.immutable.ArrayOps chainRecDepthFirst
 */
export function chainRecDepthFirst<A, B>(a: A, f: (a: A) => Array<Either<A, B>>): Array<B> {
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
export function chainRecBreadthFirst<A, B>(a: A, f: (a: A) => Array<Either<A, B>>): Array<B> {
  const initial = f(a);
  const buffer: MutableArray<Either<A, B>> = [];
  const out: MutableArray<B>               = [];

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
export function chainWithIndex_<A, B>(self: Array<A>, f: (i: number, a: A) => Array<B>): Array<B> {
  let outLen = 0;
  const len  = self.length;
  const temp = Array.alloc<Array<B>>(len);
  for (let i = 0; i < len; i++) {
    const e   = self[i]!;
    const arr = f(i, e);
    outLen   += arr.length;
    temp[i]   = arr!;
  }
  const out = Array.alloc<B>(outLen);
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
export function chain_<A, B>(self: Array<A>, f: (a: A) => Array<B>): Array<B> {
  return self.chainWithIndex((_, a) => f(a));
}

/**
 * @tsplus getter fncts.collection.immutable.Array flatten
 */
export function flatten<A>(self: Array<Array<A>>): Array<A> {
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
  as: Array<A>,
  f: (as: NonEmptyArray<A>) => readonly [B, Array<A>],
): Array<B> {
  const result: MutableArray<B> = [];
  let cs: Array<A>              = as;
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
export function chunksOf_<A>(self: Array<A>, n: number): Array<Array<A>> {
  return self.chop((as) => as.splitAt(n));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array collectWhile
 */
export function collectWhile_<A, B>(as: Array<A>, f: (a: A) => Maybe<B>): Array<B> {
  const result: MutableArray<B> = [];
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
  scope: Array<A>,
  input: Array<Array<A>>,
  f: (...xs: Array<A>) => R,
  g: (...xs: Array<A>) => boolean,
): Eval<Array<R>> {
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
  input: readonly [Array<A>, Array<B>, Array<C>, Array<D>],
  f: (a: A, b: B, c: C, d: D) => R,
  g?: (a: A, b: B, c: C, d: D) => boolean,
): Array<R>;
export function comprehension<A, B, C, R>(
  input: readonly [Array<A>, Array<B>, Array<C>],
  f: (a: A, b: B, c: C) => R,
  g?: (a: A, b: B, c: C) => boolean,
): Array<R>;
export function comprehension<A, B, R>(
  input: readonly [Array<A>, Array<B>],
  f: (a: A, b: B) => R,
  g?: (a: A, b: B) => boolean,
): Array<R>;
export function comprehension<A, R>(
  input: readonly [Array<A>],
  f: (a: A) => R,
  g?: (a: A) => boolean,
): Array<R>;
export function comprehension<A, R>(
  input: ReadonlyArray<Array<A>>,
  f: (...xs: ReadonlyArray<A>) => R,
  g: (...xs: ReadonlyArray<A>) => boolean = () => true,
): Array<R> {
  return Eval.run(comprehensionLoop([], input, f, g));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array deleteAt
 */
export function deleteAt_<A>(as: Array<A>, i: number): Maybe<Array<A>> {
  return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeDeleteAt(i));
}

/**
 * @constrained
 */
export function difference_<A>(E: P.Eq<A>) {
  const elemE_ = elem_(E);
  return (self: Array<A>, ys: Array<A>): Array<A> => self.filter((a) => !elemE_(ys, a));
}

/**
 * @tsplus getter fncts.collection.immutable.Array difference
 */
export function differenceSelf<A>(self: Array<A>) {
  return (E: P.Eq<A>) =>
    (that: Array<A>): Array<A> =>
      difference_(E)(self, that);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array drop
 */
export function drop_<A>(self: Array<A>, n: number): Array<A> {
  return self.slice(n);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array dropLast
 */
export function dropLast_<A>(self: Array<A>, n: number): Array<A> {
  return self.slice(0, self.length - n);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array dropWhile
 */
export function dropWhile_<A>(self: Array<A>, p: Predicate<A>): Array<A> {
  return self.slice(self.spanIndexLeft(p));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array dropLastWhile
 */
export function dropLastWhile_<A>(as: Array<A>, p: Predicate<A>): Array<A> {
  return as.slice(0, as.spanIndexRight(p) + 1);
}

/**
 * Test if a value is a member of an array. Takes an `Eq<A>` as a single
 * argument which returns the function to use to search for a value of type `A` in
 * an array of type `Array<A>`.
 *
 * @constrained
 */
export function elem_<A>(E: P.Eq<A>) {
  return (as: Array<A>, a: A): boolean => {
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
 * an array of type `Array<A>`.
 *
 * @tsplus fluent fncts.collection.immutable.Array elem
 */
export function elemSelf<A>(self: Array<A>) {
  return (E: P.Eq<A>) =>
    (a: A): boolean =>
      elem_(E)(self, a);
}

export function every_<A, B extends A>(self: Array<A>, p: Refinement<A, B>): self is Array<B>;
export function every_<A>(self: Array<A>, p: Predicate<A>): boolean;
export function every_<A>(self: Array<A>, p: Predicate<A>): boolean {
  return self.everyWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array everyWithIndex
 */
export function everyWithIndex_<A, B extends A>(
  self: Array<A>,
  p: RefinementWithIndex<number, A, B>,
): self is Array<B>;
export function everyWithIndex_<A>(self: Array<A>, p: PredicateWithIndex<number, A>): boolean;
export function everyWithIndex_<A>(self: Array<A>, p: PredicateWithIndex<number, A>): boolean {
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
export function exists_<A>(self: Array<A>, p: Predicate<A>): self is NonEmptyArray<A> {
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
export function filter_<A, B extends A>(self: Array<A>, p: Refinement<A, B>): Array<B>;
export function filter_<A>(self: Array<A>, p: Predicate<A>): Array<A>;
export function filter_<A>(self: Array<A>, p: Predicate<A>): Array<A> {
  return self.filterWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array filterWithIndex
 */
export function filterWithIndex_<A, B extends A>(
  self: Array<A>,
  p: RefinementWithIndex<number, A, B>,
): Array<B>;
export function filterWithIndex_<A>(self: Array<A>, p: PredicateWithIndex<number, A>): Array<A>;
export function filterWithIndex_<A>(self: Array<A>, p: PredicateWithIndex<number, A>): Array<A> {
  const result: MutableArray<A> = [];
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
  fa: Array<A>,
  f: (i: number, a: A) => Maybe<B>,
): Array<B> {
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
export function filterMap_<A, B>(self: Array<A>, f: (a: A) => Maybe<B>): Array<B> {
  return self.filterMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array find
 */
export function find_<A, B extends A>(self: Array<A>, p: Refinement<A, B>): Maybe<B>;
export function find_<A>(self: Array<A>, p: Predicate<A>): Maybe<A>;
export function find_<A>(self: Array<A>, p: Predicate<A>): Maybe<A> {
  return self.findWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findIndex
 */
export function findIndex_<A>(as: Array<A>, predicate: Predicate<A>): Maybe<number> {
  return as.findMapWithIndex((i, a) => (predicate(a) ? Just(i) : Nothing()));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findWithIndex
 */
export function findWithIndex_<A, B extends A>(
  as: Array<A>,
  p: RefinementWithIndex<number, A, B>,
): Maybe<B>;
export function findWithIndex_<A>(as: Array<A>, p: PredicateWithIndex<number, A>): Maybe<A>;
export function findWithIndex_<A>(as: Array<A>, p: PredicateWithIndex<number, A>): Maybe<A> {
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
export function findMap_<A, B>(as: Array<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  return as.findMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findMapWithIndex
 */
export function findMapWithIndex_<A, B>(
  as: Array<A>,
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
export function findLast_<A, B extends A>(as: Array<A>, p: Refinement<A, B>): Maybe<B>;
export function findLast_<A>(as: Array<A>, p: Predicate<A>): Maybe<A>;
export function findLast_<A>(as: Array<A>, p: Predicate<A>): Maybe<A> {
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
export function findLastIndex_<A>(self: Array<A>, p: Predicate<A>): Maybe<number> {
  return self.findLastMapWithIndex((i, a) => (p(a) ? Just(i) : Nothing()));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findLastMap
 */
export function findLastMap_<A, B>(as: Array<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  return as.findLastMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array findLastMapWithIndex
 */
export function findLastMapWithIndex_<A, B>(
  as: Array<A>,
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
 * @tsplus fluent fncts.collection.immutable.Array foldLeft
 * @tsplus static fncts.collection.immutable.ArrayOps foldLeft_
 */
export function foldLeft_<A, B>(self: Array<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldLeftWhile
 */
export function foldLeftWhile_<A, B>(
  self: Array<A>,
  b: B,
  p: Predicate<B>,
  f: (b: B, a: A) => B,
): B {
  return self.foldLeftWithIndexWhile(b, p, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldLeftWithIndexWhile
 */
export function foldLeftWithIndexWhile_<A, B>(
  self: Array<A>,
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
  return (self: Array<M>): M => self.foldLeft(M.nat, M.combine_);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array fold
 */
export function foldSelf<M>(self: Array<M>, M: Monoid<M>): M {
  return self.foldLeft(M.nat, M.combine_);
}

/**
 * @constrained
 */
export function foldMapWithIndex_<M>(M: Monoid<M>) {
  return <A>(self: Array<A>, f: (i: number, a: A) => M): M => {
    return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine_(b, f(i, a)));
  };
}

/**
 * @tsplus getter fncts.collection.immutable.Array foldMapWithIndex
 */
export function foldMapWithIndexSelf<A>(self: Array<A>) {
  return <M>(M: Monoid<M>) =>
    (f: (i: number, a: A) => M): M =>
      foldMapWithIndex_(M)(self, f);
}

/**
 * @constrained
 */
export function foldMap_<M>(M: Monoid<M>) {
  return <A>(self: Array<A>, f: (a: A) => M): M => {
    return self.foldMapWithIndex(M)((_, a) => f(a));
  };
}

/**
 * @tsplus getter fncts.collection.immutable.Array foldMap
 */
export function foldMapSelf<A>(self: Array<A>) {
  return <M>(M: Monoid<M>) =>
    (f: (a: A) => M): M =>
      self.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldRight
 */
export function foldRight_<A, B>(self: Array<A>, b: B, f: (a: A, b: B) => B): B {
  return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldRighWhile
 */
export function foldRightWhile_<A, B>(
  self: Array<A>,
  b: B,
  p: Predicate<B>,
  f: (a: A, b: B) => B,
): B {
  return self.foldRightWithIndexWhile(b, p, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array foldRightWithIndexWhile
 */
export function foldRightWithIndexWhile_<A, B>(
  self: Array<A>,
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
export function forEach_<A, B>(self: Array<A>, f: (a: A) => B): void {
  return (self as unknown as ESArray<A>).forEach(f);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array get
 */
export function get_<A>(self: Array<A>, i: number): Maybe<A> {
  return self.isOutOfBound(i) ? Nothing() : Just(self[i]!);
}

export function group<A>(E: P.Eq<A>): (self: Array<A>) => Array<NonEmptyArray<A>> {
  return chop((self) => {
    const h   = self[0];
    const out = [h] as MutableNonEmptyArray<A>;
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
export function chopSelf<A>(self: Array<A>, E: P.Eq<A>): Array<NonEmptyArray<A>> {
  return group(E)(self);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array groupBy
 */
export function groupBy_<A>(
  self: Array<A>,
  f: (a: A) => string,
): Readonly<Record<string, NonEmptyArray<A>>> {
  const out: Record<string, MutableNonEmptyArray<A>> = {};
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
export function head<A>(self: Array<A>): Maybe<A> {
  return self.isNonEmpty() ? Just(self[0]) : Nothing();
}

/**
 * @tsplus getter fncts.collection.immutable.Array init
 */
export function init<A>(self: Array<A>): Maybe<Array<A>> {
  const len = self.length;
  return len === 0 ? Nothing() : Just(self.slice(0, len - 1));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array insertAt
 */
export function insertAt_<A>(self: Array<A>, i: number, a: A): Maybe<NonEmptyArray<A>> {
  return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeInsertAt(i, a));
}

export function intersection_<A>(E: P.Eq<A>) {
  const elemE = elem_(E);
  return (self: Array<A>, that: Array<A>): Array<A> => self.filter((a) => elemE(that, a));
}

/**
 * @tsplus getter fncts.collection.immutable.Array intersection
 */
export function intersectionSelf<A>(self: Array<A>) {
  return (E: P.Eq<A>) =>
    (that: Array<A>): Array<A> =>
      intersection_(E)(self, that);
}

export function intersperse_<A>(self: Array<A>, a: A): Array<A> {
  const len = self.length;
  return len === 0 ? self : self.slice(1, len).prependAll(a).prepend(self[0]!);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array isEmpty
 */
export function isEmpty<A>(self: Array<A>): boolean {
  return self.length === 0;
}

export const isNonEmpty = _.isNonEmpty;

/**
 * @tsplus fluent fncts.collection.immutable.Array join
 */
export function join(self: Array<string>, separator: string): string {
  return (self as ESArray<string>).join(separator);
}

/**
 * @tsplus getter fncts.collection.immutable.Array last
 */
export function last<A>(self: Array<A>): Maybe<A> {
  return self.get(self.length - 1);
}

/**
 * @tsplus getter fncts.collection.immutable.Array lefts
 */
export function lefts<E, A>(self: Array<Either<E, A>>): Array<E> {
  const ls: MutableArray<E> = [];
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
export function map_<A, B>(self: Array<A>, f: (a: A) => B): Array<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array mapAccum
 */
export function mapAccum_<A, S, B>(
  self: Array<A>,
  s: S,
  f: (s: S, a: A) => readonly [B, S],
): readonly [Array<B>, S] {
  const bs  = Array.alloc<B>(self.length);
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
export function mapWithIndex_<A, B>(self: Array<A>, f: (i: number, a: A) => B): Array<B> {
  const len = self.length;
  const bs  = Array.alloc<B>(len);
  for (let i = 0; i < len; i++) {
    bs[i] = f(i, self[i]!);
  }
  return bs;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array modifyAt
 */
export function modifyAt_<A>(self: Array<A>, i: number, f: (a: A) => A): Maybe<Array<A>> {
  return self.isOutOfBound(i) ? Nothing() : Just(self.unsafeModifyAt(i, f));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array mutate
 */
export function mutate_<A>(self: Array<A>, f: (self: MutableArray<A>) => void): Array<A> {
  const mut = mutableClone(self);
  f(mut);
  return mut;
}

/**
 * @tsplus getter fncts.collection.immutable.Array mutableClone
 */
export function mutableClone<A>(self: Array<A>): MutableArray<A> {
  return self.slice(0) as unknown as MutableArray<A>;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array partitionWithIndex
 */
export function partitionWithIndex_<A, B extends A>(
  self: Array<A>,
  p: RefinementWithIndex<number, A, B>,
): readonly [Array<A>, Array<B>];
export function partitionWithIndex_<A>(
  self: Array<A>,
  p: PredicateWithIndex<number, A>,
): readonly [Array<A>, Array<A>];
export function partitionWithIndex_<A>(
  self: Array<A>,
  p: PredicateWithIndex<number, A>,
): readonly [Array<A>, Array<A>] {
  const left: MutableArray<A>  = [];
  const right: MutableArray<A> = [];
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
  self: Array<A>,
  p: Refinement<A, B>,
): readonly [Array<A>, Array<B>];
export function partition_<A>(self: Array<A>, p: Predicate<A>): readonly [Array<A>, Array<A>];
export function partition_<A>(self: Array<A>, p: Predicate<A>): readonly [Array<A>, Array<A>] {
  return self.partitionWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array partitionMapWithIndex
 */
export function partitionMapWithIndex_<A, B, C>(
  self: Array<A>,
  f: (i: number, a: A) => Either<B, C>,
): readonly [Array<B>, Array<C>] {
  const left  = [] as MutableArray<B>;
  const right = [] as MutableArray<C>;
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
  self: Array<A>,
  f: (a: A) => Either<B, C>,
): readonly [Array<B>, Array<C>] {
  return self.partitionMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array prependAll
 */
export function prependAll_<A>(self: Array<A>, a: A): Array<A> {
  const out: MutableArray<A> = [];
  for (let i = 0; i < self.length; i++) {
    out.push(a, self[i]!);
  }
  return out;
}

/**
 * @tsplus getter fncts.collection.immutable.Array reverse
 */
export function reverse<A>(self: Array<A>): Array<A> {
  if (self.isEmpty()) {
    return self;
  } else if (self.length === 1) {
    return [self[0]!];
  } else {
    const out = Array.alloc<A>(self.length);
    for (let j = 0, i = self.length - 1; i >= 0; i--, j++) {
      out[j] = self[i]!;
    }
    return out;
  }
}

/**
 * @tsplus getter fncts.collection.immutable.Array rights
 */
export function rights<E, A>(self: Array<Either<E, A>>): Array<A> {
  const rs: MutableArray<A> = [];
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
export function rotate_<A>(self: Array<A>, n: number): Array<A> {
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
export function scanLeft_<A, B>(self: Array<A>, b: B, f: (b: B, a: A) => B): NonEmptyArray<B> {
  const l = self.length;
  const r = Array.alloc(l + 1) as MutableNonEmptyArray<B>;
  r[0]    = b;
  for (let i = 0; i < l; i++) {
    r[i + 1] = f(r[i]!, self[i]!);
  }
  return r;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array scanRight
 */
export function scanRight_<A, B>(self: Array<A>, b: B, f: (a: A, b: B) => B): NonEmptyArray<B> {
  const l = self.length;
  const r = Array.alloc(l + 1) as MutableNonEmptyArray<B>;
  r[l]    = b;
  for (let i = l - 1; i >= 0; i--) {
    r[i] = f(self[i]!, r[i + 1]!);
  }
  return r;
}

export function sort<B>(O: P.Ord<B>) {
  return <A extends B>(self: Array<A>): Array<A> =>
    self.isEmpty() || self.length === 1
      ? self
      : (self.mutableClone as unknown as ESArray<A>).sort((a, b) => O.compare_(a, b));
}

export function sortBy<B>(Os: Array<P.Ord<B>>) {
  return <A extends B>(self: Array<A>): Array<A> => self.sort(Os.fold(P.Ord.getMonoid()));
}

/**
 * @tsplus fluent fncts.collection.immutable.Array sortBy
 */
export function sortBySelf<A extends B, B>(self: Array<A>, Os: Array<P.Ord<B>>): Array<A> {
  return sortBy(Os)(self);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array sort
 */
export function sortSelf<A extends B, B>(self: Array<A>, O: P.Ord<B>): Array<A> {
  return sort(O)(self);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array spanLeft
 */
export function spanLeft_<A, B extends A>(
  self: Array<A>,
  p: Refinement<A, B>,
): readonly [Array<B>, Array<A>];
export function spanLeft_<A>(self: Array<A>, p: Predicate<A>): readonly [Array<A>, Array<A>];
export function spanLeft_<A>(self: Array<A>, p: Predicate<A>): readonly [Array<A>, Array<A>] {
  const i    = spanIndexLeft_(self, p);
  const init = Array.alloc<A>(i);
  for (let j = 0; j < i; j++) {
    init[j] = self[j]!;
  }
  const l    = self.length;
  const rest = Array.alloc<A>(l - i);
  for (let j = i; j < l; j++) {
    rest[j - i] = self[j]!;
  }
  return [init, rest];
}

/**
 * @tsplus fluent fncts.collection.immutable.Array spanRight
 */
export function spanRight_<A, B extends A>(
  self: Array<A>,
  p: Refinement<A, B>,
): readonly [Array<A>, Array<B>];
export function spanRight_<A>(self: Array<A>, p: Predicate<A>): readonly [Array<A>, Array<A>];
export function spanRight_<A>(self: Array<A>, p: Predicate<A>): readonly [Array<A>, Array<A>] {
  const i    = spanIndexRight_(self, p);
  const l    = self.length;
  const tail = Array.alloc<A>(l - i - 1);
  for (let j = l - 1; j > i; j--) {
    tail[j - i - 1] = self[j]!;
  }
  const rest = Array.alloc<A>(i);
  for (let j = i; j >= 0; j--) {
    rest[j] = self[j]!;
  }
  return [rest, tail];
}

/**
 * @tsplus fluent fncts.collection.immutable.Array spanIndexLeft
 */
export function spanIndexLeft_<A>(self: Array<A>, p: Predicate<A>): number {
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
export function spanIndexRight_<A>(as: Array<A>, predicate: Predicate<A>): number {
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
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray splitAt
 */
export function splitAt_<A>(as: Array<A>, n: number): readonly [Array<A>, Array<A>] {
  return [as.slice(0, n), as.slice(n)];
}

/**
 * @tsplus fluent fncts.collection.immutable.Array splitWhere
 */
export function splitWhere_<A>(self: Array<A>, p: Predicate<A>): readonly [Array<A>, Array<A>] {
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
export function tail<A>(self: Array<A>): Maybe<Array<A>> {
  return self.isNonEmpty() ? Just(self.slice(1)) : Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.Array take
 */
export function take_<A>(self: Array<A>, n: number): Array<A> {
  return self.slice(0, n);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array takeLast
 */
export function takeLast_<A>(as: Array<A>, n: number): Array<A> {
  return isEmpty(as) ? Array.empty() : as.slice(-n);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array takeWhile
 */
export function takeWhile_<A, B extends A>(self: Array<A>, p: Refinement<A, B>): Array<B>;
export function takeWhile_<A>(self: Array<A>, p: Predicate<A>): Array<A>;
export function takeWhile_<A>(self: Array<A>, p: Predicate<A>): Array<A> {
  const i    = self.spanIndexLeft(p);
  const init = Array.alloc<A>(i);
  for (let j = 0; j < i; j++) {
    init[j] = self[j]!;
  }
  return init;
}

export const traverseWithIndex_: P.traverseWithIndex_<ArrayF> = P.mkTraverseWithIndex_<ArrayF>()(
  (_) => (A) => (ta, f) =>
    ta.foldLeftWithIndex(A.pure(Array.empty<typeof _.B>()), (i, fbs, a) =>
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
  return (self: Array<A>, that: Array<A>): Array<A> =>
    self.concat(that.filter((a) => !elemE(self, a)));
}

export function uniq<A>(E: P.Eq<A>) {
  return (self: Array<A>): Array<A> => {
    if (self.length === 1) {
      return self;
    }
    const elemE_ = elem_(E);
    const out    = [] as MutableArray<A>;
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
export function uniqSelf<A>(self: Array<A>, E: P.Eq<A>): Array<A> {
  return uniq(E)(self);
}

/**
 * @tsplus getter fncts.collection.immutable.Array unprepend
 */
export function unprepend<A>(self: Array<A>): Maybe<readonly [A, Array<A>]> {
  return self.isNonEmpty() ? Just([self[0], self.slice(1)]) : Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.Array unsafeDeleteAt
 */
export function unsafeDeleteAt_<A>(self: Array<A>, i: number): Array<A> {
  return self.mutate((xs) => {
    xs.splice(i, 1);
  });
}

/**
 * @tsplus fluent fncts.collection.immutable.Array unsafeInsertAt
 */
export function unsafeInsertAt_<A>(as: Array<A>, i: number, a: A): NonEmptyArray<A> {
  return mutate_(as, (xs) => {
    xs.splice(i, 0, a);
  }) as unknown as NonEmptyArray<A>;
}

/**
 * @tsplus fluent fncts.collection.immutable.Array unsafeModifyAt
 */
export function unsafeModifyAt_<A>(as: Array<A>, i: number, f: (a: A) => A): Array<A> {
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
export function unsafeUpdateAt_<A>(as: Array<A>, i: number, a: A): Array<A> {
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
export function unzip<A, B>(self: Array<readonly [A, B]>): readonly [Array<A>, Array<B>] {
  const fa = Array.alloc<A>(self.length);
  const fb = Array.alloc<B>(self.length);

  for (let i = 0; i < self.length; i++) {
    fa[i] = self[i]![0]!;
    fb[i] = self[i]![1]!;
  }

  return [fa, fb];
}

/**
 * @tsplus fluent fncts.collection.immutable.Array updateAt
 */
export function updateAt_<A>(as: Array<A>, i: number, a: A): Maybe<Array<A>> {
  return as.isOutOfBound(i) ? Nothing() : Just(as.unsafeUpdateAt(i, a));
}

export const wilt_: P.wilt_<ArrayF> = (A) => (self, f) => self.wiltWithIndex(A)((_, a) => f(a));

/**
 * @tsplus dataFirst wilt_
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
      A.pure([Array.emptyMutable<typeof _.B>(), Array.emptyMutable<typeof _.B2>()]),
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
    self.foldLeftWithIndex(A.pure(Array.empty<typeof _.B>()), (i, b, a) =>
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
export function zip_<A, B>(self: Array<A>, that: Array<B>): Array<readonly [A, B]> {
  return self.zipWith(that, tuple);
}

/**
 * @tsplus fluent fncts.collection.immutable.Array zipWith
 */
export function zipWith_<A, B, C>(self: Array<A>, fb: Array<B>, f: (a: A, b: B) => C): Array<C> {
  const len = Math.min(self.length, fb.length);
  const fc  = Array.alloc<C>(len);
  for (let i = 0; i < len; i++) {
    fc[i] = f(self[i]!, fb[i]!);
  }
  return fc;
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst alignWith_
 */
export function alignWith<A, B, C>(fb: Array<B>, f: (_: These<A, B>) => C) {
  return (self: Array<A>): Array<C> => alignWith_(self, fb, f);
}
/**
 * @tsplus dataFirst align_
 */
export function align<B>(fb: Array<B>) {
  return <A>(self: Array<A>): Array<These<A, B>> => align_(self, fb);
}
/**
 * @tsplus dataFirst alt_
 */
export function alt<B>(that: Lazy<Array<B>>) {
  return <A>(self: Array<A>): Array<A | B> => alt_(self, that);
}
/**
 * @tsplus dataFirst ap_
 */
export function ap<A>(fa: Array<A>) {
  return <B>(self: Array<(a: A) => B>): Array<B> => ap_(self, fa);
}
/**
 * @tsplus dataFirst crossWith_
 */
export function crossWith<A, B, C>(fb: Array<B>, f: (a: A, b: B) => C) {
  return (self: Array<A>): Array<C> => crossWith_(self, fb, f);
}
/**
 * @tsplus dataFirst chainWithIndex_
 */
export function chainWithIndex<A, B>(f: (i: number, a: A) => Array<B>) {
  return (self: Array<A>): Array<B> => chainWithIndex_(self, f);
}
/**
 * @tsplus dataFirst chain_
 */
export function chain<A, B>(f: (a: A) => Array<B>) {
  return (self: Array<A>): Array<B> => chain_(self, f);
}
/**
 * A useful recursion pattern for processing a `Array` to produce a new `Array`,
 * often used for "chopping" up the input `Array`. Typically chop is called with some function
 * that will consume an initial prefix of the `Array` and produce a value and the rest of the `Array`.
 * @tsplus dataFirst chop_
 */
export function chop<A, B>(f: (as: NonEmptyArray<A>) => readonly [B, Array<A>]) {
  return (as: Array<A>): Array<B> => chop_(as, f);
}
/**
 * @tsplus dataFirst chunksOf_
 */
export function chunksOf(n: number) {
  return <A>(self: Array<A>): Array<Array<A>> => chunksOf_(self, n);
}
/**
 * @tsplus dataFirst collectWhile_
 */
export function collectWhile<A, B>(f: (a: A) => Maybe<B>) {
  return (as: Array<A>): Array<B> => collectWhile_(as, f);
}
/**
 * @tsplus dataFirst deleteAt_
 */
export function deleteAt(i: number) {
  return <A>(as: Array<A>): Maybe<Array<A>> => deleteAt_(as, i);
}
/**
 * @tsplus dataFirst drop_
 */
export function drop(n: number) {
  return <A>(self: Array<A>): Array<A> => drop_(self, n);
}
/**
 * @tsplus dataFirst dropLast_
 */
export function dropLast(n: number) {
  return <A>(self: Array<A>): Array<A> => dropLast_(self, n);
}
/**
 * @tsplus dataFirst dropWhile_
 */
export function dropWhile<A>(p: Predicate<A>) {
  return (self: Array<A>): Array<A> => dropWhile_(self, p);
}
/**
 * @tsplus dataFirst dropLastWhile_
 */
export function dropLastWhile<A>(p: Predicate<A>) {
  return (as: Array<A>): Array<A> => dropLastWhile_(as, p);
}
/**
 * @tsplus dataFirst every_
 */
export function every<A, B extends A>(p: Refinement<A, B>): (self: Array<A>) => self is Array<B>;
/**
 * @tsplus dataFirst every_
 */
export function every<A>(p: Predicate<A>): (self: Array<A>) => boolean;
/**
 * @tsplus dataFirst every_
 */
export function every<A>(p: Predicate<A>) {
  return (self: Array<A>): boolean => every_(self, p);
}
/**
 * @tsplus dataFirst everyWithIndex_
 */
export function everyWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: Array<A>) => self is Array<B>;
/**
 * @tsplus dataFirst everyWithIndex_
 */
export function everyWithIndex<A>(p: PredicateWithIndex<number, A>): (self: Array<A>) => boolean;
/**
 * @tsplus dataFirst everyWithIndex_
 */
export function everyWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: Array<A>): boolean => everyWithIndex_(self, p);
}
/**
 * @tsplus dataFirst exists_
 */
export function exists<A>(p: Predicate<A>) {
  return (self: Array<A>): self is NonEmptyArray<A> => exists_(self, p);
}
/**
 * @tsplus dataFirst filter_
 */
export function filter<A, B extends A>(p: Refinement<A, B>): (self: Array<A>) => Array<B>;
/**
 * @tsplus dataFirst filter_
 */
export function filter<A>(p: Predicate<A>): (self: Array<A>) => Array<A>;
/**
 * @tsplus dataFirst filter_
 */
export function filter<A>(p: Predicate<A>) {
  return (self: Array<A>): Array<A> => filter_(self, p);
}
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: Array<A>) => Array<B>;
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>): (self: Array<A>) => Array<A>;
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: Array<A>): Array<A> => filterWithIndex_(self, p);
}
/**
 * @tsplus dataFirst filterMapWithIndex_
 */
export function filterMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (fa: Array<A>): Array<B> => filterMapWithIndex_(fa, f);
}
/**
 * @tsplus dataFirst filterMap_
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: Array<A>): Array<B> => filterMap_(self, f);
}
/**
 * @tsplus dataFirst find_
 */
export function find<A, B extends A>(p: Refinement<A, B>): (self: Array<A>) => Maybe<B>;
/**
 * @tsplus dataFirst find_
 */
export function find<A>(p: Predicate<A>): (self: Array<A>) => Maybe<A>;
/**
 * @tsplus dataFirst find_
 */
export function find<A>(p: Predicate<A>) {
  return (self: Array<A>): Maybe<A> => find_(self, p);
}
/**
 * @tsplus dataFirst findIndex_
 */
export function findIndex<A>(predicate: Predicate<A>) {
  return (as: Array<A>): Maybe<number> => findIndex_(as, predicate);
}
/**
 * @tsplus dataFirst findWithIndex_
 */
export function findWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (as: Array<A>) => Maybe<B>;
/**
 * @tsplus dataFirst findWithIndex_
 */
export function findWithIndex<A>(p: PredicateWithIndex<number, A>): (as: Array<A>) => Maybe<A>;
/**
 * @tsplus dataFirst findWithIndex_
 */
export function findWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (as: Array<A>): Maybe<A> => findWithIndex_(as, p);
}
/**
 * @tsplus dataFirst findMap_
 */
export function findMap<A, B>(f: (a: A) => Maybe<B>) {
  return (as: Array<A>): Maybe<B> => findMap_(as, f);
}
/**
 * @tsplus dataFirst findMapWithIndex_
 */
export function findMapWithIndex<A, B>(f: (index: number, a: A) => Maybe<B>) {
  return (as: Array<A>): Maybe<B> => findMapWithIndex_(as, f);
}
/**
 * @tsplus dataFirst findLast_
 */
export function findLast<A, B extends A>(p: Refinement<A, B>): (as: Array<A>) => Maybe<B>;
/**
 * @tsplus dataFirst findLast_
 */
export function findLast<A>(p: Predicate<A>): (as: Array<A>) => Maybe<A>;
/**
 * @tsplus dataFirst findLast_
 */
export function findLast<A>(p: Predicate<A>) {
  return (as: Array<A>): Maybe<A> => findLast_(as, p);
}
/**
 * @tsplus dataFirst findLastIndex_
 */
export function findLastIndex<A>(p: Predicate<A>) {
  return (self: Array<A>): Maybe<number> => findLastIndex_(self, p);
}
/**
 * @tsplus dataFirst findLastMap_
 */
export function findLastMap<A, B>(f: (a: A) => Maybe<B>) {
  return (as: Array<A>): Maybe<B> => findLastMap_(as, f);
}
/**
 * @tsplus dataFirst findLastMapWithIndex_
 */
export function findLastMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (as: Array<A>): Maybe<B> => findLastMapWithIndex_(as, f);
}
/**
 * @tsplus dataFirst foldLeft_
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: Array<A>): B => foldLeft_(self, b, f);
}
/**
 * @tsplus dataFirst foldLeftWhile_
 */
export function foldLeftWhile<A, B>(b: B, p: Predicate<B>, f: (b: B, a: A) => B) {
  return (self: Array<A>): B => foldLeftWhile_(self, b, p, f);
}
/**
 * @tsplus dataFirst foldLeftWithIndexWhile_
 */
export function foldLeftWithIndexWhile<A, B>(
  b: B,
  p: Predicate<B>,
  f: (i: number, b: B, a: A) => B,
) {
  return (self: Array<A>): B => foldLeftWithIndexWhile_(self, b, p, f);
}
/**
 * @tsplus dataFirst foldRight_
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: Array<A>): B => foldRight_(self, b, f);
}
/**
 * @tsplus dataFirst foldRightWhile_
 */
export function foldRightWhile<A, B>(b: B, p: Predicate<B>, f: (a: A, b: B) => B) {
  return (self: Array<A>): B => foldRightWhile_(self, b, p, f);
}
/**
 * @tsplus dataFirst foldRightWithIndexWhile_
 */
export function foldRightWithIndexWhile<A, B>(
  b: B,
  predicate: Predicate<B>,
  f: (i: number, a: A, b: B) => B,
) {
  return (self: Array<A>): B => foldRightWithIndexWhile_(self, b, predicate, f);
}
/**
 * @tsplus dataFirst forEach_
 */
export function forEach<A, B>(f: (a: A) => B) {
  return (self: Array<A>): void => forEach_(self, f);
}
/**
 * @tsplus dataFirst get_
 */
export function get(i: number) {
  return <A>(self: Array<A>): Maybe<A> => get_(self, i);
}
/**
 * @tsplus dataFirst groupBy_
 */
export function groupBy<A>(f: (a: A) => string) {
  return (self: Array<A>): Readonly<Record<string, NonEmptyArray<A>>> => groupBy_(self, f);
}
/**
 * @tsplus dataFirst insertAt_
 */
export function insertAt<A>(i: number, a: A) {
  return (self: Array<A>): Maybe<NonEmptyArray<A>> => insertAt_(self, i, a);
}
/**
 * @tsplus dataFirst intersperse_
 */
export function intersperse<A>(a: A) {
  return (self: Array<A>): Array<A> => intersperse_(self, a);
}
/**
 * @tsplus dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Array<A>): Array<B> => map_(self, f);
}
/**
 * @tsplus dataFirst mapAccum_
 */
export function mapAccum<A, S, B>(s: S, f: (s: S, a: A) => readonly [B, S]) {
  return (self: Array<A>): readonly [Array<B>, S] => mapAccum_(self, s, f);
}
/**
 * @tsplus dataFirst mapWithIndex_
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: Array<A>): Array<B> => mapWithIndex_(self, f);
}
/**
 * @tsplus dataFirst modifyAt_
 */
export function modifyAt<A>(i: number, f: (a: A) => A) {
  return (self: Array<A>): Maybe<Array<A>> => modifyAt_(self, i, f);
}
/**
 * @tsplus dataFirst mutate_
 */
export function mutate<A>(f: (self: MutableArray<A>) => void) {
  return (self: Array<A>): Array<A> => mutate_(self, f);
}
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: Array<A>) => readonly [Array<A>, Array<B>];
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A>(
  p: PredicateWithIndex<number, A>,
): (self: Array<A>) => readonly [Array<A>, Array<A>];
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: Array<A>): readonly [Array<A>, Array<A>] => partitionWithIndex_(self, p);
}
/**
 * @tsplus dataFirst partition_
 */
export function partition<A, B extends A>(
  p: Refinement<A, B>,
): (self: Array<A>) => readonly [Array<A>, Array<B>];
/**
 * @tsplus dataFirst partition_
 */
export function partition<A>(p: Predicate<A>): (self: Array<A>) => readonly [Array<A>, Array<A>];
/**
 * @tsplus dataFirst partition_
 */
export function partition<A>(p: Predicate<A>) {
  return (self: Array<A>): readonly [Array<A>, Array<A>] => partition_(self, p);
}
/**
 * @tsplus dataFirst partitionMapWithIndex_
 */
export function partitionMapWithIndex<A, B, C>(f: (i: number, a: A) => Either<B, C>) {
  return (self: Array<A>): readonly [Array<B>, Array<C>] => partitionMapWithIndex_(self, f);
}
/**
 * @tsplus dataFirst partitionMap_
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: Array<A>): readonly [Array<B>, Array<C>] => partitionMap_(self, f);
}
/**
 * @tsplus dataFirst prependAll_
 */
export function prependAll<A>(a: A) {
  return (self: Array<A>): Array<A> => prependAll_(self, a);
}
/**
 * @tsplus dataFirst rotate_
 */
export function rotate(n: number) {
  return <A>(self: Array<A>): Array<A> => rotate_(self, n);
}
/**
 * @tsplus dataFirst scanLeft_
 */
export function scanLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: Array<A>): NonEmptyArray<B> => scanLeft_(self, b, f);
}
/**
 * @tsplus dataFirst scanRight_
 */
export function scanRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: Array<A>): NonEmptyArray<B> => scanRight_(self, b, f);
}
/**
 * @tsplus dataFirst spanLeft_
 */
export function spanLeft<A, B extends A>(
  p: Refinement<A, B>,
): (self: Array<A>) => readonly [Array<B>, Array<A>];
/**
 * @tsplus dataFirst spanLeft_
 */
export function spanLeft<A>(p: Predicate<A>): (self: Array<A>) => readonly [Array<A>, Array<A>];
/**
 * @tsplus dataFirst spanLeft_
 */
export function spanLeft<A>(p: Predicate<A>) {
  return (self: Array<A>): readonly [Array<A>, Array<A>] => spanLeft_(self, p);
}
/**
 * @tsplus dataFirst spanRight_
 */
export function spanRight<A, B extends A>(
  p: Refinement<A, B>,
): (self: Array<A>) => readonly [Array<A>, Array<B>];
/**
 * @tsplus dataFirst spanRight_
 */
export function spanRight<A>(p: Predicate<A>): (self: Array<A>) => readonly [Array<A>, Array<A>];
/**
 * @tsplus dataFirst spanRight_
 */
export function spanRight<A>(p: Predicate<A>) {
  return (self: Array<A>): readonly [Array<A>, Array<A>] => spanRight_(self, p);
}
/**
 * @tsplus dataFirst spanIndexLeft_
 */
export function spanIndexLeft<A>(p: Predicate<A>) {
  return (self: Array<A>): number => spanIndexLeft_(self, p);
}
/**
 * @tsplus dataFirst spanIndexRight_
 */
export function spanIndexRight<A>(predicate: Predicate<A>) {
  return (as: Array<A>): number => spanIndexRight_(as, predicate);
}
/**
 * @tsplus dataFirst splitAt_
 */
export function splitAt(n: number) {
  return <A>(as: Array<A>): readonly [Array<A>, Array<A>] => splitAt_(as, n);
}
/**
 * @tsplus dataFirst splitWhere_
 */
export function splitWhere<A>(p: Predicate<A>) {
  return (self: Array<A>): readonly [Array<A>, Array<A>] => splitWhere_(self, p);
}
/**
 * @tsplus dataFirst take_
 */
export function take(n: number) {
  return <A>(self: Array<A>): Array<A> => take_(self, n);
}
/**
 * @tsplus dataFirst takeLast_
 */
export function takeLast(n: number) {
  return <A>(as: Array<A>): Array<A> => takeLast_(as, n);
}
/**
 * @tsplus dataFirst takeWhile_
 */
export function takeWhile<A, B extends A>(p: Refinement<A, B>): (self: Array<A>) => Array<B>;
/**
 * @tsplus dataFirst takeWhile_
 */
export function takeWhile<A>(p: Predicate<A>): (self: Array<A>) => Array<A>;
/**
 * @tsplus dataFirst takeWhile_
 */
export function takeWhile<A>(p: Predicate<A>) {
  return (self: Array<A>): Array<A> => takeWhile_(self, p);
}
/**
 * @tsplus dataFirst unsafeDeleteAt_
 */
export function unsafeDeleteAt(i: number) {
  return <A>(self: Array<A>): Array<A> => unsafeDeleteAt_(self, i);
}
/**
 * @tsplus dataFirst unsafeInsertAt_
 */
export function unsafeInsertAt<A>(i: number, a: A) {
  return (as: Array<A>): NonEmptyArray<A> => unsafeInsertAt_(as, i, a);
}
/**
 * @tsplus dataFirst unsafeModifyAt_
 */
export function unsafeModifyAt<A>(i: number, f: (a: A) => A) {
  return (as: Array<A>): Array<A> => unsafeModifyAt_(as, i, f);
}
/**
 * @tsplus dataFirst unsafeUpdateAt_
 */
export function unsafeUpdateAt<A>(i: number, a: A) {
  return (as: Array<A>): Array<A> => unsafeUpdateAt_(as, i, a);
}
/**
 * @tsplus dataFirst updateAt_
 */
export function updateAt<A>(i: number, a: A) {
  return (as: Array<A>): Maybe<Array<A>> => updateAt_(as, i, a);
}
/**
 * @tsplus dataFirst zip_
 */
export function zip<B>(that: Array<B>) {
  return <A>(self: Array<A>): Array<readonly [A, B]> => zip_(self, that);
}
/**
 * @tsplus dataFirst zipWith_
 */
export function zipWith<A, B, C>(fb: Array<B>, f: (a: A, b: B) => C) {
  return (self: Array<A>): Array<C> => zipWith_(self, fb, f);
}
/**
 * @constrained
 * @tsplus dataFirst difference_
 */
export function difference<A>(E: P.Eq<A>) {
  return (ys: Array<A>) => (self: Array<A>) => difference_(E)(self, ys);
}
/**
 * Test if a value is a member of an array. Takes an `Eq<A>` as a single
 * argument which returns the function to use to search for a value of type `A` in
 * an array of type `Array<A>`.
 * @constrained
 * @tsplus dataFirst elem_
 */
export function elem<A>(E: P.Eq<A>) {
  return (a: A) => (as: Array<A>) => elem_(E)(as, a);
}
/**
 * @constrained
 * @tsplus dataFirst foldMapWithIndex_
 */
export function foldMapWithIndex<M>(M: Monoid<M>) {
  return <A>(f: (i: number, a: A) => M) =>
    (self: Array<A>) =>
      foldMapWithIndex_(M)(self, f);
}
/**
 * @constrained
 * @tsplus dataFirst foldMap_
 */
export function foldMap<M>(M: Monoid<M>) {
  return <A>(f: (a: A) => M) =>
    (self: Array<A>) =>
      foldMap_(M)(self, f);
}
// codegen:end

export const append_ = _.append_;

/**
 * @tsplus dataFirst append_
 */
export const append = _.append;

export const concat_ = _.concat_;

/**
 * @tsplus dataFirst concat_
 */
export const concat = _.concat;

export const foldLeftWithIndex_ = _.foldLeftWithIndex_;

/**
 * @tsplus dataFirst foldLeftWithIndex_
 */
export const foldLeftWithIndex = _.foldLeftWithIndex;

export const foldRightWithIndex_ = _.foldRightWithIndex_;

/**
 * @tsplus dataFirst foldRightWithIndex_
 */
export const foldRightWithIndex = _.foldRightWithIndex;

export const isOutOfBound_ = _.isOutOfBound_;

/**
 * @tsplus dataFirst isOutOfBound_
 */
export const isOutOfBound = _.isOutOfBound;

export const prepend_ = _.prepend_;

/**
 * @tsplus dataFirst prepend_
 */
export const prepend = _.prepend;
