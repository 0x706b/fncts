import type { ImmutableNonEmptyArrayF } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/definition";

import { allocWithHead } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/constructors";
import { ImmutableNonEmptyArray } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/definition";
import { identity } from "@fncts/base/data/function";
import * as P from "@fncts/base/typeclass";

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray ap
 */
export function ap_<A, B>(
  self: ImmutableNonEmptyArray<(a: A) => B>,
  fa: ImmutableNonEmptyArray<A>,
): ImmutableNonEmptyArray<B> {
  return self.flatMap((f) => fa.map((a) => f(a)));
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray append
 */
export function append_<A, B>(self: ImmutableNonEmptyArray<A>, last: B): ImmutableNonEmptyArray<A | B> {
  const len = self.length;
  const r   = Array<A | B>(len + 1);
  r[len]    = last;
  for (let i = 0; i < len; i++) {
    r[i] = self._array[i]!;
  }
  return r.unsafeAsNonEmptyArray;
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray align
 */
export function align_<A, B>(
  self: ImmutableNonEmptyArray<A>,
  fb: ImmutableNonEmptyArray<B>,
): ImmutableNonEmptyArray<These<A, B>> {
  return self.alignWith(fb, identity);
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray alignWith
 */
export function alignWith_<A, B, C>(
  self: ImmutableNonEmptyArray<A>,
  fb: ImmutableNonEmptyArray<B>,
  f: (_: These<A, B>) => C,
): ImmutableNonEmptyArray<C> {
  const minlen = Math.min(self.length, fb.length);
  const maxlen = Math.max(self.length, fb.length);
  const ret    = allocWithHead(f(These.both(self.head, fb.head)), maxlen);
  for (let i = 1; i < minlen; i++) {
    ret[i] = f(These.both(self._array[i]!, fb._array[i]!));
  }
  if (minlen === maxlen) {
    return ImmutableNonEmptyArray.from(ret);
  } else if (self.length > fb.length) {
    for (let i = minlen; i < maxlen; i++) {
      ret[i] = f(These.left(self._array[i]!));
    }
  } else {
    for (let i = minlen; i < maxlen; i++) {
      ret[i] = f(These.right(fb._array[i]!));
    }
  }
  return ImmutableNonEmptyArray.from(ret);
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray flatMap
 */
export function flatMap_<A, B>(
  self: ImmutableNonEmptyArray<A>,
  f: (a: A) => ImmutableNonEmptyArray<B>,
): ImmutableNonEmptyArray<B> {
  return self.flatMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray flatMapWithIndex
 */
export function flatMapWithIndex_<A, B>(
  self: ImmutableNonEmptyArray<A>,
  f: (i: number, a: A) => ImmutableNonEmptyArray<B>,
): ImmutableNonEmptyArray<B> {
  let outLen = 1;
  const len  = self.length;
  const temp = allocWithHead(f(0, self._array[0]), len);
  for (let i = 1; i < len; i++) {
    const e   = self._array[i]!;
    const arr = f(i, e);
    outLen   += arr.length;
    temp[i]   = arr;
  }
  const out  = Array(outLen);
  const out0 = temp[0];
  const len0 = temp[0].length;
  for (let j = 0; j < len0; j++) {
    out[j] = out0._array[j]!;
  }
  let start = temp[0].length;
  for (let i = 1; i < len; i++) {
    const arr = temp[i]!;
    const l   = arr.length;
    for (let j = 0; j < l; j++) {
      out[j + start] = arr._array[j]!;
    }
    start += l;
  }
  return out.unsafeAsNonEmptyArray;
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray chop
 */
export function chop_<A, B>(
  self: ImmutableNonEmptyArray<A>,
  f: (as: ImmutableNonEmptyArray<A>) => readonly [B, ImmutableArray<A>],
): ImmutableNonEmptyArray<B> {
  const [b, rest] = f(self);
  const result    = [b];
  let next        = rest;
  while (next.isNonEmpty()) {
    const [b, c] = f(next);
    result.push(b);
    next = c;
  }
  return result.unsafeAsNonEmptyArray;
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray chunksOf
 */
export function chunksOf_<A>(
  self: ImmutableNonEmptyArray<A>,
  n: number,
): ImmutableNonEmptyArray<ImmutableNonEmptyArray<A>> {
  return self.chop((as) => as.splitAt(n));
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray concat
 */
export function concat_<A, B>(self: ImmutableNonEmptyArray<A>, that: ImmutableArray<B>): ImmutableNonEmptyArray<A | B> {
  const leny = that.length;
  if (leny === 0) {
    return self;
  }
  const lenx = self.length;
  const r    = Array<A | B>(lenx + leny);
  for (let i = 0; i < lenx; i++) {
    r[i] = self._array[i]!;
  }
  for (let i = 0; i < leny; i++) {
    r[i + lenx] = that._array[i]!;
  }
  return r.unsafeAsNonEmptyArray;
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray crossWith
 */
export function crossWith_<A, B, C>(
  self: ImmutableNonEmptyArray<A>,
  fb: ImmutableNonEmptyArray<B>,
  f: (a: A, b: B) => C,
): ImmutableNonEmptyArray<C> {
  return self.flatMap((a) => fb.map((b) => f(a, b)));
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray cross
 */
export function cross_<A, B>(
  self: ImmutableNonEmptyArray<A>,
  fb: ImmutableNonEmptyArray<B>,
): ImmutableNonEmptyArray<Zipped.Make<A, B>> {
  return self.crossWith(fb, (a, b) => Zipped(a, b));
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray elem
 */
export function elem_<A>(self: ImmutableNonEmptyArray<A>, a: A, /** @tsplus auto */ E: P.Eq<A>): boolean {
  const p   = (element: A) => E.equals(a, element);
  const len = self.length;
  for (let i = 0; i < len; i++) {
    if (p(self._array[i]!)) {
      return true;
    }
  }
  return false;
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray flatten
 */
export function flatten<A>(self: ImmutableNonEmptyArray<ImmutableNonEmptyArray<A>>): ImmutableNonEmptyArray<A> {
  return self.flatMap(identity);
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray fold
 */
export function fold_<A>(self: ImmutableNonEmptyArray<A>, /** @tsplus auto */ S: P.Semigroup<A>): A {
  return self.slice(1).foldLeft(self._array[0], S.combine);
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray foldLeft
 */
export function foldLeft_<A, B>(self: ImmutableNonEmptyArray<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(self: ImmutableNonEmptyArray<A>, b: B, f: (i: number, b: B, a: A) => B): B {
  const len = self.length;
  let r     = b;
  for (let i = 0; i < len; i++) {
    r = f(i, r, self._array[i]!);
  }
  return r;
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray foldMapWithIndex
 */
export function foldMapWithIndex_<A, M>(
  self: ImmutableNonEmptyArray<A>,
  f: (i: number, a: A) => M,
  /** @tsplus auto */ M: P.Monoid<M>,
): M {
  return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(b, f(i, a)));
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray foldMap
 */
export function foldMap_<A, M>(self: ImmutableNonEmptyArray<A>, f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>): M {
  return self.foldMapWithIndex((_, a) => f(a), M);
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray foldRight
 */
export function foldRight_<A, B>(self: ImmutableNonEmptyArray<A>, b: B, f: (a: A, b: B) => B): B {
  return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray foldRightWithIndex
 */
export function foldRightWithIndex_<A, B>(self: ImmutableNonEmptyArray<A>, b: B, f: (i: number, a: A, b: B) => B): B {
  let r = b;
  for (let i = self.length - 1; i >= 0; i--) {
    r = f(i, self._array[i]!, r);
  }
  return r;
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray group
 */
export function group<A>(
  self: ImmutableNonEmptyArray<A>,
  /** @tsplus auto */ E: P.Eq<A>,
): ImmutableNonEmptyArray<ImmutableNonEmptyArray<A>> {
  return self.chop((as) => {
    const h   = as._array[0];
    const out = [h];
    let i     = 1;
    for (; i < as.length; i++) {
      const a = as._array[i]!;
      if (E.equals(a, h)) {
        out.push(a);
      } else {
        break;
      }
    }
    return [out.unsafeAsNonEmptyArray, as.slice(i)];
  });
}

export function groupSort<A>(
  as: ImmutableNonEmptyArray<A>,
  /** @tsplus auto */ O: P.Ord<A>,
): ImmutableNonEmptyArray<ImmutableNonEmptyArray<A>> {
  return as.sort(O).group(O);
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray isOutOfBound
 */
export function isOutOfBound_<A>(as: ImmutableNonEmptyArray<A>, i: number): boolean {
  return i < 0 || i >= as.length;
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray map
 */
export function map_<A, B>(self: ImmutableNonEmptyArray<A>, f: (a: A) => B): ImmutableNonEmptyArray<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray mapWithIndex
 */
export function mapWithIndex_<A, B>(
  self: ImmutableNonEmptyArray<A>,
  f: (i: number, a: A) => B,
): ImmutableNonEmptyArray<B> {
  const out = allocWithHead(f(0, self._array[0]), self.length);
  for (let i = 1; i < self.length; i++) {
    out[i] = f(i, self._array[i]!);
  }
  return ImmutableNonEmptyArray.from(out);
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray max
 */
export function max<A>(self: ImmutableNonEmptyArray<A>, /** @tsplus auto */ O: P.Ord<A>): A {
  const S            = P.Semigroup.max(O);
  const [head, tail] = self.unprepend;
  return tail.isNonEmpty() ? tail.foldLeft(head, S.combine) : head;
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray max
 */
export function min<A>(self: ImmutableNonEmptyArray<A>, /** @tsplus auto */ O: P.Ord<A>): A {
  const S            = P.Semigroup.min(O);
  const [head, tail] = self.unprepend;
  return tail.isNonEmpty() ? tail.foldLeft(head, S.combine) : head;
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray mutableClone
 */
export function mutableClone<A>(as: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<A> {
  return as._array.slice(0).unsafeAsNonEmptyArray;
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray prepend
 */
export function prepend_<A, B>(self: ImmutableNonEmptyArray<A>, head: B): ImmutableNonEmptyArray<A | B> {
  const len = self.length;
  const out = Array<A | B>(len + 1);
  out[0]    = head;
  for (let i = 0; i < len; i++) {
    out[i + 1] = self._array[i]!;
  }
  return out.unsafeAsNonEmptyArray;
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray reverse
 */
export function reverse<A>(self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<A> {
  if (self.length === 1) {
    return self;
  }
  const out = allocWithHead(self[self.length - 1]!, self.length);
  for (let j = 1, i = self.length - 2; i >= 0; i--, j++) {
    out[j] = self._array[i]!;
  }
  return ImmutableNonEmptyArray.from(out);
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray splitAt
 */
export function splitAt_<A>(
  self: ImmutableNonEmptyArray<A>,
  n: number,
): readonly [ImmutableNonEmptyArray<A>, ImmutableArray<A>] {
  const m = Math.max(1, n);
  return m >= self.length
    ? [self, ImmutableArray.empty()]
    : [self._array.slice(0, m).unsafeAsNonEmptyArray, self.slice(m)];
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray sort
 */
export function sort<A>(self: ImmutableNonEmptyArray<A>, /** @tsplus auto */ O: P.Ord<A>): ImmutableNonEmptyArray<A> {
  return self.length === 1
    ? self
    : self._array.slice().sort((first, second) => O.compare(first, second)).unsafeAsNonEmptyArray;
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray traverseWithIndex
 */
export const traverseWithIndex = P.TraversableWithIndex.makeTraverseWithIndex<ImmutableNonEmptyArrayF>()(
  () => (self) => (G) => (f) =>
    self.tail.foldLeftWithIndex(
      G.map(f(0, self.head), (b) => ImmutableNonEmptyArray(b)),
      (i, fbs, a) => G.zipWith(fbs, f(i + 1, a), (bs, b) => bs.append(b)),
    ),
);

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray traverse
 */
export const traverse: P.Traversable<ImmutableNonEmptyArrayF>["traverse"] = (self) => (G) => (f) =>
  self.traverseWithIndex(G)((_, a) => f(a));

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray uniq
 */
export function uniq<A>(self: ImmutableNonEmptyArray<A>, /** @tsplus auto */ E: P.Eq<A>): ImmutableNonEmptyArray<A> {
  if (self.length === 1) {
    return self;
  }
  const out = [self._array[0]];
  const len = self.length;
  for (let i = 1; i < len; i++) {
    const a = self._array[i]!;
    if (!out.unsafeAsNonEmptyArray.elem(a, E)) {
      out.push(a);
    }
  }
  return out.unsafeAsNonEmptyArray;
}

/**
 * @tsplus fluent fncts.ImmutableNonEmptyArray zipWith
 */
export function zipWith_<A, B, C>(
  self: ImmutableNonEmptyArray<A>,
  fb: ImmutableNonEmptyArray<B>,
  f: (a: A, b: B) => C,
): ImmutableNonEmptyArray<C> {
  const len = Math.min(self.length, fb.length);
  const cs  = allocWithHead(f(self._array[0], fb._array[0]), len);
  for (let i = 1; i < len; i++) {
    cs[i] = f(self._array[i]!, fb._array[i]!);
  }
  return ImmutableNonEmptyArray.from(cs);
}
