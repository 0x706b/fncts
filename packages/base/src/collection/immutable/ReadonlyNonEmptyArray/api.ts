import type { ReadonlyNonEmptyArrayF } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/definition";

import { allocWithHead } from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/constructors";
import { identity } from "@fncts/base/data/function";
import * as P from "@fncts/base/typeclass";

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray ap
 */
export function ap_<A>(fa: ReadonlyNonEmptyArray<A>) {
  return <B>(self: ReadonlyNonEmptyArray<(a: A) => B>): ReadonlyNonEmptyArray<B> => {
    return self.flatMap((f) => fa.map((a) => f(a))) as unknown as ReadonlyNonEmptyArray<B>;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray append
 */
export function append<B>(last: B) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A | B> => {
    const len = self.length;
    const r   = Array<A | B>(len + 1);
    r[len]    = last;
    for (let i = 0; i < len; i++) {
      r[i] = self[i]!;
    }
    return r as unknown as ReadonlyNonEmptyArray<A | B>;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray align
 */
export function align<B>(fb: ReadonlyNonEmptyArray<B>) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<These<A, B>> => {
    return self.alignWith(fb, identity);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray alignWith
 */
export function alignWith<A, B, C>(fb: ReadonlyNonEmptyArray<B>, f: (_: These<A, B>) => C) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<C> => {
    const minlen = Math.min(self.length, fb.length);
    const maxlen = Math.max(self.length, fb.length);
    const ret    = allocWithHead(f(These.both(self.head, fb.head)), maxlen);
    for (let i = 1; i < minlen; i++) {
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
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray flatMap
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray flatMap1
 */
export function flatMap<A, B>(f: (a: A) => ReadonlyNonEmptyArray<B>) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> => {
    return self.flatMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray flatMapWithIndex
 */
export function flatMapWithIndex<A, B>(f: (i: number, a: A) => ReadonlyNonEmptyArray<B>) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> => {
    let outLen = 1;
    const len  = self.length;
    const temp = allocWithHead(f(0, self[0]), len);
    for (let i = 1; i < len; i++) {
      const e   = self[i]!;
      const arr = f(i, e);
      outLen   += arr.length;
      temp[i]   = arr;
    }
    const out  = Array(outLen);
    const out0 = temp[0];
    const len0 = temp[0].length;
    for (let j = 0; j < len0; j++) {
      out[j] = out0[j]!;
    }
    let start = temp[0].length;
    for (let i = 1; i < len; i++) {
      const arr = temp[i]!;
      const l   = arr.length;
      for (let j = 0; j < l; j++) {
        out[j + start] = arr[j]!;
      }
      start += l;
    }
    return out.unsafeAsNonEmptyArray;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray chop
 */
export function chop<A, B>(f: (as: ReadonlyNonEmptyArray<A>) => readonly [B, ReadonlyArray<A>]) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> => {
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
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray chunksOf
 */
export function chunksOf(n: number) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<A>> => {
    return self.chop((as) => as.splitAt(n));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray concat
 */
export function concat<B>(that: ReadonlyArray<B>) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A | B> => {
    const leny = that.length;
    if (leny === 0) {
      return self;
    }
    const lenx = self.length;
    const r    = Array<A | B>(lenx + leny);
    for (let i = 0; i < lenx; i++) {
      r[i] = self[i]!;
    }
    for (let i = 0; i < leny; i++) {
      r[i + lenx] = that[i]!;
    }
    return r.unsafeAsNonEmptyArray;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray crossWith
 */
export function crossWith<A, B, C>(fb: ReadonlyNonEmptyArray<B>, f: (a: A, b: B) => C) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<C> => {
    return self.flatMap((a) => fb.map((b) => f(a, b))).unsafeAsNonEmptyArray;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray cross
 */
export function cross<B>(fb: ReadonlyNonEmptyArray<B>) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<Zipped.Make<A, B>> => {
    return self.crossWith(fb, (a, b) => Zipped(a, b));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray elem
 */
export function elem<A>(a: A, /** @tsplus auto */ E: P.Eq<A>) {
  return (self: ReadonlyNonEmptyArray<A>): boolean => {
    const p   = (element: A) => E.equals(element)(a);
    const len = self.length;
    for (let i = 0; i < len; i++) {
      if (p(self[i]!)) {
        return true;
      }
    }
    return false;
  };
}

/**
 * @tsplus getter fncts.ReadonlyNonEmptyArray flatten
 */
export function flatten<A>(self: ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<A>>): ReadonlyNonEmptyArray<A> {
  return self.flatMap(identity).unsafeAsNonEmptyArray;
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray fold
 */
export function fold<A>(/** @tsplus auto */ S: P.Semigroup<A>) {
  return (self: ReadonlyNonEmptyArray<A>): A => {
    return self.slice(1).foldLeft(self[0], (b, a) => S.combine(a)(b));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ReadonlyNonEmptyArray<A>): B => {
    return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: ReadonlyNonEmptyArray<A>): B => {
    const len = self.length;
    let r     = b;
    for (let i = 0; i < len; i++) {
      r = f(i, r, self[i]!);
    }
    return r;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray foldMapWithIndex
 */
export function foldMapWithIndex<A, M>(f: (i: number, a: A) => M, /** @tsplus auto */ M: P.Monoid<M>) {
  return (self: ReadonlyNonEmptyArray<A>): M => {
    return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(f(i, a))(b));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>) {
  return (self: ReadonlyNonEmptyArray<A>): M => {
    return self.foldMapWithIndex((_, a) => f(a), M);
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray foldRight
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: ReadonlyNonEmptyArray<A>): B => {
    return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray foldRightWithIndex
 */
export function foldRightWithIndex<A, B>(b: B, f: (i: number, a: A, b: B) => B) {
  return (self: ReadonlyNonEmptyArray<A>): B => {
    let r = b;
    for (let i = self.length - 1; i >= 0; i--) {
      r = f(i, self[i]!, r);
    }
    return r;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray group
 */
export function group<A>(/** @tsplus auto */ E: P.Eq<A>) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<A>> => {
    return self.chop((as) => {
      const h   = as[0];
      const out = [h];
      let i     = 1;
      for (; i < as.length; i++) {
        const a = as[i]!;
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
  as: ReadonlyNonEmptyArray<A>,
  /** @tsplus auto */ O: P.Ord<A>,
): ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<A>> {
  return as.sort(O).group(O);
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray isOutOfBound
 */
export function isOutOfBound(i: number) {
  return <A>(as: ReadonlyNonEmptyArray<A>): boolean => {
    return i < 0 || i >= as.length;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray mapWithIndex
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> => {
    const out = allocWithHead(f(0, self[0]), self.length);
    for (let i = 1; i < self.length; i++) {
      out[i] = f(i, self[i]!);
    }
    return out;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray max
 */
export function max<A>(/** @tsplus auto */ O: P.Ord<A>) {
  return (self: ReadonlyNonEmptyArray<A>): A => {
    const S            = P.Semigroup.max(O);
    const [head, tail] = self.unprepend;
    return tail.isNonEmpty() ? tail.foldLeft(head, (b, a) => S.combine(a)(b)) : head;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray max
 */
export function min<A>(/** @tsplus auto */ O: P.Ord<A>) {
  return (self: ReadonlyNonEmptyArray<A>): A => {
    const S            = P.Semigroup.min(O);
    const [head, tail] = self.unprepend;
    return tail.isNonEmpty() ? tail.foldLeft(head, (b, a) => S.combine(a)(b)) : head;
  };
}

/**
 * @tsplus getter fncts.ReadonlyNonEmptyArray mutableClone
 */
export function mutableClone<A>(as: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A> {
  return as.slice(0).unsafeAsNonEmptyArray;
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray prepend
 */
export function prepend<B>(head: B) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A | B> => {
    const len = self.length;
    const out = Array<A | B>(len + 1);
    out[0]    = head;
    for (let i = 0; i < len; i++) {
      out[i + 1] = self[i]!;
    }
    return out as unknown as ReadonlyNonEmptyArray<A | B>;
  };
}

/**
 * @tsplus getter fncts.ReadonlyNonEmptyArray reverse
 */
export function reverse<A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A> {
  if (self.length === 1) {
    return self;
  }
  const out = allocWithHead(self[self.length - 1]!, self.length);
  for (let j = 1, i = self.length - 2; i >= 0; i--, j++) {
    out[j] = self[i]!;
  }
  return out.unsafeAsNonEmptyArray;
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray splitAt
 */
export function splitAt(n: number) {
  return <A>(self: ReadonlyNonEmptyArray<A>): readonly [ReadonlyNonEmptyArray<A>, ReadonlyArray<A>] => {
    const m = Math.max(1, n);
    return m >= self.length ? [self, Array.empty()] : [self.slice(0, m).unsafeAsNonEmptyArray, self.slice(m)];
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray sort
 */
export function sort<A>(/** @tsplus auto */ O: P.Ord<A>) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A> => {
    return self.length === 1
      ? self
      : self.slice().sort((first, second) => O.compare(second)(first)).unsafeAsNonEmptyArray;
  };
}

/**
 * @tsplus getter fncts.ReadonlyNonEmptyArray traverseWithIndex
 */
export function _traverseWithIndex<A>(
  self: ReadonlyNonEmptyArray<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ReadonlyNonEmptyArray<B>>;
export function _traverseWithIndex<A>(
  self: ReadonlyNonEmptyArray<A>,
): <G>(
  G: P.Applicative<HKT.F<G>>,
) => <B>(f: (i: number, a: A) => HKT.FK1<G, B>) => HKT.FK1<G, ReadonlyNonEmptyArray<B>> {
  return (G) => (f) =>
    self.tail.foldLeftWithIndex(f(0, self.head).pipe(G.map((b) => [b].unsafeAsNonEmptyArray)), (i, fbs, a) =>
      fbs.pipe(G.zipWith(f(i + 1, a), (bs, b) => bs.append(b))),
    );
}

/**
 * @tsplus getter fncts.ReadonlyNonEmptyArray traverse
 */
export function _traverse<A>(
  self: ReadonlyNonEmptyArray<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, ReadonlyNonEmptyArray<B>> {
  return (G) => (f) => self.traverseWithIndex(G)((_, a) => f(a));
}

export const traverseWithIndex: P.TraversableWithIndex<ReadonlyNonEmptyArrayF>["traverseWithIndex"] =
  (G) => (f) => (self) =>
    self.traverseWithIndex(G)(f);

export const traverse: P.Traversable<ReadonlyNonEmptyArrayF>["traverse"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)((_, a) => f(a));

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray uniq
 */
export function uniq<A>(/** @tsplus auto */ E: P.Eq<A>) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A> => {
    if (self.length === 1) {
      return self;
    }
    const out = [self[0]];
    const len = self.length;
    for (let i = 1; i < len; i++) {
      const a = self[i]!;
      if (!out.unsafeAsNonEmptyArray.elem(a, E)) {
        out.push(a);
      }
    }
    return out.unsafeAsNonEmptyArray;
  };
}

/**
 * @tsplus pipeable fncts.ReadonlyNonEmptyArray zipWith
 */
export function zipWith<A, B, C>(fb: ReadonlyNonEmptyArray<B>, f: (a: A, b: B) => C) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<C> => {
    const len = Math.min(self.length, fb.length);
    const cs  = allocWithHead(f(self[0], fb[0]), len);
    for (let i = 1; i < len; i++) {
      cs[i] = f(self[i]!, fb[i]!);
    }
    return cs;
  };
}
