import type { NonEmptyArrayF, ReadonlyNonEmptyArray } from "./definition";

import { identity, unsafeCoerce } from "../../../data/function";
import { These } from "../../../data/These";
import * as P from "../../../prelude";
import { NonEmptyArray } from "./definition";

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray ap
 */
export function ap_<A, B>(self: ReadonlyNonEmptyArray<(a: A) => B>, fa: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> {
  return self.chain((f) => fa.map((a) => f(a)) as unknown as ReadonlyNonEmptyArray<B>);
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray append
 */
export function append_<A, B>(self: ReadonlyNonEmptyArray<A>, last: B): ReadonlyNonEmptyArray<A | B> {
  const len = self.length;
  const r   = Array<A | B>(len + 1);
  r[len]    = last;
  for (let i = 0; i < len; i++) {
    r[i] = self[i]!;
  }
  return r as unknown as ReadonlyNonEmptyArray<A | B>;
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray align
 */
export function align_<A, B>(self: ReadonlyNonEmptyArray<A>, fb: ReadonlyNonEmptyArray<B>): ReadonlyNonEmptyArray<These<A, B>> {
  return self.alignWith(fb, identity);
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray alignWith
 */
export function alignWith_<A, B, C>(
  self: ReadonlyNonEmptyArray<A>,
  fb: ReadonlyNonEmptyArray<B>,
  f: (_: These<A, B>) => C,
): ReadonlyNonEmptyArray<C> {
  const minlen = Math.min(self.length, fb.length);
  const maxlen = Math.max(self.length, fb.length);
  const ret    = NonEmptyArray.allocWithHead(f(These.both(self.head, fb.head)), maxlen);
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
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray chain
 */
export function chain_<A, B>(self: ReadonlyNonEmptyArray<A>, f: (a: A) => ReadonlyNonEmptyArray<B>): ReadonlyNonEmptyArray<B> {
  return self.chainWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray chainWithIndex
 */
export function chainWithIndex_<A, B>(
  self: ReadonlyNonEmptyArray<A>,
  f: (i: number, a: A) => ReadonlyNonEmptyArray<B>,
): ReadonlyNonEmptyArray<B> {
  let outLen = 1;
  const len  = self.length;
  const temp = NonEmptyArray.allocWithHead(f(0, self[0]), len);
  for (let i = 1; i < len; i++) {
    const e   = self[i]!;
    const arr = f(i, e);
    outLen   += arr.length;
    temp[i]   = arr;
  }
  const out  = globalThis.Array(outLen) as NonEmptyArray<B>;
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
  return out;
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray chop
 */
export function chop_<A, B>(
  self: ReadonlyNonEmptyArray<A>,
  f: (as: ReadonlyNonEmptyArray<A>) => readonly [B, ReadonlyArray<A>],
): ReadonlyNonEmptyArray<B> {
  const [b, rest] = f(self);
  const result    = [b] as NonEmptyArray<B>;
  let next        = rest;
  while (next.isNonEmpty()) {
    const [b, c] = f(next);
    result.push(b);
    next = c;
  }
  return result;
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray chunksOf
 */
export function chunksOf_<A>(self: ReadonlyNonEmptyArray<A>, n: number): ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<A>> {
  return chop_(self, (as) => as.splitAt(n));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray concat
 */
export function concat_<A, B>(self: ReadonlyNonEmptyArray<A>, that: ReadonlyArray<B>): ReadonlyArray<A | B> {
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
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray crossWith
 */
export function crossWith_<A, B, C>(
  self: ReadonlyNonEmptyArray<A>,
  fb: ReadonlyNonEmptyArray<B>,
  f: (a: A, b: B) => C,
): ReadonlyNonEmptyArray<C> {
  return self.chain((a) => fb.map((b) => f(a, b)) as unknown as ReadonlyNonEmptyArray<C>);
}

/**
 * @constrained
 */
export function elem_<A>(E: P.Eq<A>) {
  return (self: ReadonlyNonEmptyArray<A>, a: A): boolean => {
    const p   = (element: A) => E.equals_(a, element);
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
 * @tsplus getter fncts.collection.immutable.NonEmptyArray elem
 */
export function elemSelf<A>(self: ReadonlyNonEmptyArray<A>) {
  return (E: P.Eq<A>) =>
    (a: A): boolean =>
      elem_(E)(self, a);
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray flatten
 */
export function flatten<A>(self: ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<A>>): ReadonlyNonEmptyArray<A> {
  return self.chain(identity);
}

/**
 * @constrained
 */
export function fold_<A>(S: P.Semigroup<A>) {
  return (self: ReadonlyNonEmptyArray<A>): A => self.slice(1).unsafeAsImmutable.foldLeftWithIndex(self[0], (_, b, a) => S.combine_(b, a));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray fold
 */
export function foldSelf<A>(self: ReadonlyNonEmptyArray<A>, S: P.Semigroup<A>): A {
  return fold_(S)(self);
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray foldLeft
 */
export function foldLeft_<A, B>(self: ReadonlyNonEmptyArray<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(self: ReadonlyNonEmptyArray<A>, b: B, f: (i: number, b: B, a: A) => B): B {
  const len = self.length;
  let r     = b;
  for (let i = 0; i < len; i++) {
    r = f(i, r, self[i]!);
  }
  return r;
}

/**
 * @constrained
 */
export function foldMapWithIndex_<M>(M: P.Monoid<M>) {
  return <A>(self: ReadonlyNonEmptyArray<A>, f: (i: number, a: A) => M): M => {
    return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine_(b, f(i, a)));
  };
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray foldMapWithIndex
 */
export function foldMapWithIndexSelf<A>(self: ReadonlyNonEmptyArray<A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (i: number, a: A) => M): M =>
      foldMapWithIndex_(M)(self, f);
}

/**
 * @constrained
 */
export function foldMap_<M>(M: P.Monoid<M>) {
  return <A>(self: ReadonlyNonEmptyArray<A>, f: (a: A) => M): M => {
    return self.foldMapWithIndex(M)((_, a) => f(a));
  };
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray foldMap
 */
export function foldMapSelf<A>(self: ReadonlyNonEmptyArray<A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (a: A) => M): M =>
      self.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray foldRight
 */
export function foldRight_<A, B>(self: ReadonlyNonEmptyArray<A>, b: B, f: (a: A, b: B) => B): B {
  return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray foldRightWithIndex
 */
export function foldRightWithIndex_<A, B>(self: ReadonlyNonEmptyArray<A>, b: B, f: (i: number, a: A, b: B) => B): B {
  let r = b;
  for (let i = self.length - 1; i >= 0; i--) {
    r = f(i, self[i]!, r);
  }
  return r;
}

export function group<A>(E: P.Eq<A>) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<A>> => {
    return self.chop((as) => {
      const h   = as[0];
      const out = [h] as NonEmptyArray<A>;
      let i     = 1;
      for (; i < as.length; i++) {
        const a = as[i]!;
        if (E.equals_(a, h)) {
          out.push(a);
        } else {
          break;
        }
      }
      return [out, as.slice(i)];
    });
  };
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray group
 */
export function groupSelf<A>(self: ReadonlyNonEmptyArray<A>) {
  return (E: P.Eq<A>): ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<A>> => group(E)(self);
}

export function groupSort<A>(O: P.Ord<A>): (as: ReadonlyNonEmptyArray<A>) => ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<A>> {
  const sortO  = sort(O);
  const groupO = group(O);
  return (as) => groupO(sortO(as));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray isOutOfBound
 */
export function isOutOfBound_<A>(as: ReadonlyNonEmptyArray<A>, i: number): boolean {
  return i < 0 || i >= as.length;
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray map
 */
export function map_<A, B>(self: ReadonlyNonEmptyArray<A>, f: (a: A) => B): ReadonlyNonEmptyArray<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray mapWithIndex
 */
export function mapWithIndex_<A, B>(self: ReadonlyNonEmptyArray<A>, f: (i: number, a: A) => B): ReadonlyNonEmptyArray<B> {
  const out = NonEmptyArray.allocWithHead(f(0, self[0]), self.length);
  for (let i = 1; i < self.length; i++) {
    out[i] = f(i, self[i]!);
  }
  return out;
}

export function max<A>(O: P.Ord<A>) {
  const S = P.Semigroup.max(O);
  return (self: ReadonlyNonEmptyArray<A>): A => {
    const [head, tail] = self.unprepend;
    return tail.isNonEmpty() ? tail.foldLeft(head, S.combine_) : head;
  };
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray max
 */
export function maxSelf<A>(self: ReadonlyNonEmptyArray<A>, O: P.Ord<A>): A {
  return max(O)(self);
}

export function min<A>(O: P.Ord<A>) {
  const S = P.Semigroup.min(O);
  return (self: ReadonlyNonEmptyArray<A>): A => {
    const [head, tail] = self.unprepend;
    return tail.isNonEmpty() ? tail.foldLeft(head, S.combine_) : head;
  };
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray max
 */
export function minSelf<A>(self: ReadonlyNonEmptyArray<A>, O: P.Ord<A>): A {
  return max(O)(self);
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray mutableClone
 */
export function mutableClone<A>(as: ReadonlyNonEmptyArray<A>): NonEmptyArray<A> {
  return as.slice(0) as unknown as NonEmptyArray<A>;
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray prepend
 */
export function prepend_<A, B>(self: ReadonlyNonEmptyArray<A>, head: B): ReadonlyNonEmptyArray<A | B> {
  const len = self.length;
  const out = Array<A | B>(len + 1);
  out[0]    = head;
  for (let i = 0; i < len; i++) {
    out[i + 1] = self[i]!;
  }
  return out as unknown as ReadonlyNonEmptyArray<A | B>;
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray reverse
 */
export function reverse<A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A> {
  if (self.length === 1) {
    return self;
  }
  const out = NonEmptyArray.allocWithHead(self[self.length - 1]!, self.length);
  for (let j = 1, i = self.length - 2; i >= 0; i--, j++) {
    out[j] = self[i]!;
  }
  return out;
}

export const sequence: P.sequence<NonEmptyArrayF> = (A) => (self) => self.traverse(A)(identity);

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray sequence
 */
export const sequenceSelf: P.sequenceSelf<NonEmptyArrayF> = (self) => (A) => unsafeCoerce(self.traverse(A)(unsafeCoerce(identity)));

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray splitAt
 */
export function splitAt_<A>(self: ReadonlyNonEmptyArray<A>, n: number): readonly [ReadonlyNonEmptyArray<A>, ReadonlyArray<A>] {
  const m = Math.max(1, n);
  return m >= self.length ? [self, []] : [self.slice(0, m) as unknown as ReadonlyNonEmptyArray<A>, self.slice(m)];
}

export function sort<B>(O: P.Ord<B>) {
  return <A extends B>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A> =>
    self.length === 1 ? self : (self.mutableClone.sort((first, second) => O.compare_(first, second)) as any);
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray sort
 */
export function sortSelf<A extends B, B>(self: ReadonlyNonEmptyArray<A>, O: P.Ord<B>): ReadonlyNonEmptyArray<A> {
  return sort(O)(self);
}

export const traverseWithIndex_: P.traverseWithIndex_<NonEmptyArrayF> = P.mkTraverseWithIndex_<NonEmptyArrayF>()(
  (_) => (A) => (self, f) =>
    self.tail.foldLeftWithIndex(
      A.map_(f(0, self.head), (b) => [b] as ReadonlyNonEmptyArray<typeof b>),
      (i, fbs, a) => A.zipWith_(fbs, f(i + 1, a), (bs, b) => bs.append(b)),
    ),
);

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray traverseWithIndex
 */
export const traverseWithIndexSelf: P.traverseWithIndexSelf<NonEmptyArrayF> = (self) => (A) => (f) => traverseWithIndex_(A)(self, f);

export const traverse_: P.traverse_<NonEmptyArrayF> = (A) => (self, f) => self.traverseWithIndex(A)((_, a) => f(a));

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray traverse
 */
export const traverseSelf: P.traverseSelf<NonEmptyArrayF> = (self) => (A) => (f) => self.traverseWithIndex(A)((_, a) => f(a));

export function uniq<A>(E: P.Eq<A>) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A> => {
    if (self.length === 1) {
      return self;
    }
    const elemE_ = elem_(E);
    const out    = [self[0]] as NonEmptyArray<A>;
    const len    = self.length;
    for (let i = 1; i < len; i++) {
      const a = self[i]!;
      if (!elemE_(out, a)) {
        out.push(a);
      }
    }
    return out;
  };
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray uniq
 */
export function uniqSelf<A>(self: ReadonlyNonEmptyArray<A>) {
  return (E: P.Eq<A>): ReadonlyNonEmptyArray<A> => uniq(E)(self);
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray zipWith
 */
export function zipWith_<A, B, C>(
  self: ReadonlyNonEmptyArray<A>,
  fb: ReadonlyNonEmptyArray<B>,
  f: (a: A, b: B) => C,
): ReadonlyNonEmptyArray<C> {
  const len = Math.min(self.length, fb.length);
  const cs  = NonEmptyArray.allocWithHead(f(self[0], fb[0]), len);
  for (let i = 1; i < len; i++) {
    cs[i] = f(self[i]!, fb[i]!);
  }
  return cs;
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst ap_
 */
export function ap<A>(fa: ReadonlyNonEmptyArray<A>) {
  return <B>(self: ReadonlyNonEmptyArray<(a: A) => B>): ReadonlyNonEmptyArray<B> => ap_(self, fa);
}
/**
 * @tsplus dataFirst append_
 */
export function append<B>(last: B) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A | B> => append_(self, last);
}
/**
 * @tsplus dataFirst align_
 */
export function align<B>(fb: ReadonlyNonEmptyArray<B>) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<These<A, B>> => align_(self, fb);
}
/**
 * @tsplus dataFirst alignWith_
 */
export function alignWith<A, B, C>(fb: ReadonlyNonEmptyArray<B>, f: (_: These<A, B>) => C) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<C> => alignWith_(self, fb, f);
}
/**
 * @tsplus dataFirst chain_
 */
export function chain<A, B>(f: (a: A) => ReadonlyNonEmptyArray<B>) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> => chain_(self, f);
}
/**
 * @tsplus dataFirst chainWithIndex_
 */
export function chainWithIndex<A, B>(f: (i: number, a: A) => ReadonlyNonEmptyArray<B>) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> => chainWithIndex_(self, f);
}
/**
 * @tsplus dataFirst chop_
 */
export function chop<A, B>(f: (as: ReadonlyNonEmptyArray<A>) => readonly [B, ReadonlyArray<A>]) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> => chop_(self, f);
}
/**
 * @tsplus dataFirst chunksOf_
 */
export function chunksOf(n: number) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<ReadonlyNonEmptyArray<A>> => chunksOf_(self, n);
}
/**
 * @tsplus dataFirst concat_
 */
export function concat<B>(that: ReadonlyArray<B>) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyArray<A | B> => concat_(self, that);
}
/**
 * @tsplus dataFirst crossWith_
 */
export function crossWith<A, B, C>(fb: ReadonlyNonEmptyArray<B>, f: (a: A, b: B) => C) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<C> => crossWith_(self, fb, f);
}
/**
 * @tsplus dataFirst foldLeft_
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ReadonlyNonEmptyArray<A>): B => foldLeft_(self, b, f);
}
/**
 * @tsplus dataFirst foldLeftWithIndex_
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: ReadonlyNonEmptyArray<A>): B => foldLeftWithIndex_(self, b, f);
}
/**
 * @tsplus dataFirst foldRight_
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: ReadonlyNonEmptyArray<A>): B => foldRight_(self, b, f);
}
/**
 * @tsplus dataFirst foldRightWithIndex_
 */
export function foldRightWithIndex<A, B>(b: B, f: (i: number, a: A, b: B) => B) {
  return (self: ReadonlyNonEmptyArray<A>): B => foldRightWithIndex_(self, b, f);
}
/**
 * @tsplus dataFirst isOutOfBound_
 */
export function isOutOfBound(i: number) {
  return <A>(as: ReadonlyNonEmptyArray<A>): boolean => isOutOfBound_(as, i);
}
/**
 * @tsplus dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> => map_(self, f);
}
/**
 * @tsplus dataFirst mapWithIndex_
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<B> => mapWithIndex_(self, f);
}
/**
 * @tsplus dataFirst prepend_
 */
export function prepend<B>(head: B) {
  return <A>(self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<A | B> => prepend_(self, head);
}
/**
 * @tsplus dataFirst splitAt_
 */
export function splitAt(n: number) {
  return <A>(self: ReadonlyNonEmptyArray<A>): readonly [ReadonlyNonEmptyArray<A>, ReadonlyArray<A>] => splitAt_(self, n);
}
/**
 * @tsplus dataFirst zipWith_
 */
export function zipWith<A, B, C>(fb: ReadonlyNonEmptyArray<B>, f: (a: A, b: B) => C) {
  return (self: ReadonlyNonEmptyArray<A>): ReadonlyNonEmptyArray<C> => zipWith_(self, fb, f);
}
/**
 * @constrained
 * @tsplus dataFirst elem_
 */
export function elem<A>(E: P.Eq<A>) {
  return (a: A) => (self: ReadonlyNonEmptyArray<A>) => elem_(E)(self, a);
}
/**
 * @constrained
 * @tsplus dataFirst foldMapWithIndex_
 */
export function foldMapWithIndex<M>(M: P.Monoid<M>) {
  return <A>(f: (i: number, a: A) => M) =>
    (self: ReadonlyNonEmptyArray<A>) =>
      foldMapWithIndex_(M)(self, f);
}
/**
 * @constrained
 * @tsplus dataFirst foldMap_
 */
export function foldMap<M>(M: P.Monoid<M>) {
  return <A>(f: (a: A) => M) =>
    (self: ReadonlyNonEmptyArray<A>) =>
      foldMap_(M)(self, f);
}
// codegen:end
