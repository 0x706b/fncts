import type { ImmutableNonEmptyArrayF } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/definition";

import { allocWithHead } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/constructors";
import { ImmutableNonEmptyArray } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/definition";
import { identity } from "@fncts/base/data/function";
import * as P from "@fncts/base/typeclass";

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray ap
 */
export function ap_<A>(fa: ImmutableNonEmptyArray<A>) {
  return <B>(self: ImmutableNonEmptyArray<(a: A) => B>): ImmutableNonEmptyArray<B> => {
    return self.flatMap((f) => fa.map((a) => f(a)));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray append
 */
export function append<B>(last: B) {
  return <A>(self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<A | B> => {
    const len = self.length;
    const r   = Array<A | B>(len + 1);
    r[len]    = last;
    for (let i = 0; i < len; i++) {
      r[i] = self._array[i]!;
    }
    return r.unsafeAsNonEmptyArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray align
 */
export function align<B>(fb: ImmutableNonEmptyArray<B>) {
  return <A>(self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<These<A, B>> => {
    return self.alignWith(fb, identity);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray alignWith
 */
export function alignWith<A, B, C>(fb: ImmutableNonEmptyArray<B>, f: (_: These<A, B>) => C) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<C> => {
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
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray flatMap
 */
export function flatMap<A, B>(f: (a: A) => ImmutableNonEmptyArray<B>) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<B> => {
    return self.flatMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray flatMapWithIndex
 */
export function flatMapWithIndex<A, B>(f: (i: number, a: A) => ImmutableNonEmptyArray<B>) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<B> => {
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
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray chop
 */
export function chop<A, B>(f: (as: ImmutableNonEmptyArray<A>) => readonly [B, ImmutableArray<A>]) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<B> => {
    const [b, rest] = f(self);
    const result    = [b];
    let next        = rest;
    while (next.isNonEmpty()) {
      const [b, c] = f(next);
      result.push(b);
      next = c;
    }
    return result.unsafeAsNonEmptyArray;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray chunksOf
 */
export function chunksOf(n: number) {
  return <A>(self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<ImmutableNonEmptyArray<A>> => {
    return self.chop((as) => as.splitAt(n));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray concat
 */
export function concat<B>(that: ImmutableArray<B>) {
  return <A>(self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<A | B> => {
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
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray crossWith
 */
export function crossWith<A, B, C>(fb: ImmutableNonEmptyArray<B>, f: (a: A, b: B) => C) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<C> => {
    return self.flatMap((a) => fb.map((b) => f(a, b)));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray cross
 */
export function cross<B>(fb: ImmutableNonEmptyArray<B>) {
  return <A>(self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<Zipped.Make<A, B>> => {
    return self.crossWith(fb, (a, b) => Zipped(a, b));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray elem
 */
export function elem<A>(a: A, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ImmutableNonEmptyArray<A>): boolean => {
    const p   = (element: A) => E.equals(element)(a);
    const len = self.length;
    for (let i = 0; i < len; i++) {
      if (p(self._array[i]!)) {
        return true;
      }
    }
    return false;
  };
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray flatten
 */
export function flatten<A>(self: ImmutableNonEmptyArray<ImmutableNonEmptyArray<A>>): ImmutableNonEmptyArray<A> {
  return self.flatMap(identity);
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray fold
 */
export function fold<A>(/** @tsplus auto */ S: P.Semigroup<A>) {
  return (self: ImmutableNonEmptyArray<A>): A => {
    return self.slice(1).foldLeft(self._array[0], (b, a) => S.combine(a)(b));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ImmutableNonEmptyArray<A>): B => {
    return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: ImmutableNonEmptyArray<A>): B => {
    const len = self.length;
    let r     = b;
    for (let i = 0; i < len; i++) {
      r = f(i, r, self._array[i]!);
    }
    return r;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray foldMapWithIndex
 */
export function foldMapWithIndex<A, M>(f: (i: number, a: A) => M, /** @tsplus auto */ M: P.Monoid<M>) {
  return (self: ImmutableNonEmptyArray<A>): M => {
    return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(f(i, a))(b));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>) {
  return (self: ImmutableNonEmptyArray<A>): M => {
    return self.foldMapWithIndex((_, a) => f(a), M);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray foldRight
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: ImmutableNonEmptyArray<A>): B => {
    return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray foldRightWithIndex
 */
export function foldRightWithIndex<A, B>(b: B, f: (i: number, a: A, b: B) => B) {
  return (self: ImmutableNonEmptyArray<A>): B => {
    let r = b;
    for (let i = self.length - 1; i >= 0; i--) {
      r = f(i, self._array[i]!, r);
    }
    return r;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray group
 */
export function group<A>(/** @tsplus auto */ E: P.Eq<A>) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<ImmutableNonEmptyArray<A>> => {
    return self.chop((as) => {
      const h   = as._array[0];
      const out = [h];
      let i     = 1;
      for (; i < as.length; i++) {
        const a = as._array[i]!;
        if (E.equals(h)(a)) {
          out.push(a);
        } else {
          break;
        }
      }
      return [out.unsafeAsNonEmptyArray, as.slice(i)];
    });
  };
}

export function groupSort<A>(
  as: ImmutableNonEmptyArray<A>,
  /** @tsplus auto */ O: P.Ord<A>,
): ImmutableNonEmptyArray<ImmutableNonEmptyArray<A>> {
  return as.sort(O).group(O);
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray isOutOfBound
 */
export function isOutOfBound(i: number) {
  return <A>(as: ImmutableNonEmptyArray<A>): boolean => {
    return i < 0 || i >= as.length;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<B> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray mapWithIndex
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<B> => {
    const out = allocWithHead(f(0, self._array[0]), self.length);
    for (let i = 1; i < self.length; i++) {
      out[i] = f(i, self._array[i]!);
    }
    return ImmutableNonEmptyArray.from(out);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray max
 */
export function max<A>(/** @tsplus auto */ O: P.Ord<A>) {
  return (self: ImmutableNonEmptyArray<A>): A => {
    const S            = P.Semigroup.max(O);
    const [head, tail] = self.unprepend;
    return tail.isNonEmpty() ? tail.foldLeft(head, (b, a) => S.combine(a)(b)) : head;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray max
 */
export function min<A>(/** @tsplus auto */ O: P.Ord<A>) {
  return (self: ImmutableNonEmptyArray<A>): A => {
    const S            = P.Semigroup.min(O);
    const [head, tail] = self.unprepend;
    return tail.isNonEmpty() ? tail.foldLeft(head, (b, a) => S.combine(a)(b)) : head;
  };
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray mutableClone
 */
export function mutableClone<A>(as: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<A> {
  return as._array.slice(0).unsafeAsNonEmptyArray;
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray prepend
 */
export function prepend<B>(head: B) {
  return <A>(self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<A | B> => {
    const len = self.length;
    const out = Array<A | B>(len + 1);
    out[0]    = head;
    for (let i = 0; i < len; i++) {
      out[i + 1] = self._array[i]!;
    }
    return out.unsafeAsNonEmptyArray;
  };
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
 * @tsplus pipeable fncts.ImmutableNonEmptyArray splitAt
 */
export function splitAt(n: number) {
  return <A>(self: ImmutableNonEmptyArray<A>): readonly [ImmutableNonEmptyArray<A>, ImmutableArray<A>] => {
    const m = Math.max(1, n);
    return m >= self.length
      ? [self, ImmutableArray.empty()]
      : [self._array.slice(0, m).unsafeAsNonEmptyArray, self.slice(m)];
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray sort
 */
export function sort<A>(/** @tsplus auto */ O: P.Ord<A>) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<A> => {
    return self.length === 1
      ? self
      : self._array.slice().sort((first, second) => O.compare(second)(first)).unsafeAsNonEmptyArray;
  };
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray traverseWithIndex
 */
export function _traverseWithIndex<A>(
  self: ImmutableNonEmptyArray<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ImmutableNonEmptyArray<B>>;
export function _traverseWithIndex<A>(
  self: ImmutableNonEmptyArray<A>,
): <G>(
  G: P.Applicative<HKT.F<G>>,
) => <B>(f: (i: number, a: A) => HKT.FK1<G, B>) => HKT.FK1<G, ImmutableNonEmptyArray<B>> {
  return (G) => (f) =>
    self.tail.foldLeftWithIndex(f(0, self.head).pipe(G.map((b) => ImmutableNonEmptyArray(b))), (i, fbs, a) =>
      fbs.pipe(G.zipWith(f(i + 1, a), (bs, b) => bs.append(b))),
    );
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray traverse
 */
export function _traverse<A>(
  self: ImmutableNonEmptyArray<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ImmutableNonEmptyArray<B>> {
  return (G) => (f) => self.traverseWithIndex(G)((_, a) => f(a));
}

export const traverseWithIndex: P.TraversableWithIndex<ImmutableNonEmptyArrayF>["traverseWithIndex"] =
  (G) => (f) => (self) =>
    self.traverseWithIndex(G)(f);

export const traverse: P.Traversable<ImmutableNonEmptyArrayF>["traverse"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)((_, a) => f(a));

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray uniq
 */
export function uniq<A>(/** @tsplus auto */ E: P.Eq<A>) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<A> => {
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
  };
}

/**
 * @tsplus pipeable fncts.ImmutableNonEmptyArray zipWith
 */
export function zipWith<A, B, C>(fb: ImmutableNonEmptyArray<B>, f: (a: A, b: B) => C) {
  return (self: ImmutableNonEmptyArray<A>): ImmutableNonEmptyArray<C> => {
    const len = Math.min(self.length, fb.length);
    const cs  = allocWithHead(f(self._array[0], fb._array[0]), len);
    for (let i = 1; i < len; i++) {
      cs[i] = f(self._array[i]!, fb._array[i]!);
    }
    return ImmutableNonEmptyArray.from(cs);
  };
}
