import type { Maybe } from "../../../data/Maybe";
import type { Array } from "../Array";
import type { MutableNonEmptyArray, NonEmptyArrayF } from "./definition";

import { identity, unsafeCoerce } from "../../../data/function";
import { Just, Nothing } from "../../../data/Maybe";
import { These } from "../../../data/These";
import * as P from "../../../prelude";
import { NonEmptyArray } from "./definition";

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray ap
 */
export function ap_<A, B>(
  self: NonEmptyArray<(a: A) => B>,
  fa: NonEmptyArray<A>,
): NonEmptyArray<B> {
  return self.chain((f) => fa.map((a) => f(a)));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray align
 */
export function align_<A, B>(
  self: NonEmptyArray<A>,
  fb: NonEmptyArray<B>,
): NonEmptyArray<These<A, B>> {
  return self.alignWith(fb, identity);
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray alignWith
 */
export function alignWith_<A, B, C>(
  self: NonEmptyArray<A>,
  fb: NonEmptyArray<B>,
  f: (_: These<A, B>) => C,
): NonEmptyArray<C> {
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
export function chain_<A, B>(
  self: NonEmptyArray<A>,
  f: (a: A) => NonEmptyArray<B>,
): NonEmptyArray<B> {
  return self.chainWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray chainWithIndex
 */
export function chainWithIndex_<A, B>(
  self: NonEmptyArray<A>,
  f: (i: number, a: A) => NonEmptyArray<B>,
): NonEmptyArray<B> {
  let outLen = 1;
  const len  = self.length;
  const temp = NonEmptyArray.allocWithHead(f(0, self[0]), len);
  for (let i = 1; i < len; i++) {
    const e   = self[i]!;
    const arr = f(i, e);
    outLen   += arr.length;
    temp[i]   = arr;
  }
  const out  = globalThis.Array(outLen) as MutableNonEmptyArray<B>;
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
  self: NonEmptyArray<A>,
  f: (as: NonEmptyArray<A>) => readonly [B, ReadonlyArray<A>],
): NonEmptyArray<B> {
  const [b, rest] = f(self);
  const result    = [b] as MutableNonEmptyArray<B>;
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
export function chunksOf_<A>(self: NonEmptyArray<A>, n: number): NonEmptyArray<NonEmptyArray<A>> {
  return chop_(self, (as) => as.splitAt(n));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray crossWith
 */
export function crossWith_<A, B, C>(
  self: NonEmptyArray<A>,
  fb: NonEmptyArray<B>,
  f: (a: A, b: B) => C,
): NonEmptyArray<C> {
  return self.chain((a) => fb.map((b) => f(a, b)));
}

/**
 * @constrained
 */
export function elem_<A>(E: P.Eq<A>) {
  return (self: NonEmptyArray<A>, a: A): boolean => {
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
export function elemSelf<A>(self: NonEmptyArray<A>) {
  return (E: P.Eq<A>) =>
    (a: A): boolean =>
      elem_(E)(self, a);
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray flatten
 */
export function flatten<A>(self: NonEmptyArray<NonEmptyArray<A>>): NonEmptyArray<A> {
  return self.chain(identity);
}

/**
 * @constrained
 */
export function fold_<A>(S: P.Semigroup<A>) {
  return (self: NonEmptyArray<A>): A =>
    self.slice(1).foldLeftWithIndex(self[0], (_, b, a) => S.combine_(b, a));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray fold
 */
export function foldSelf<A>(self: NonEmptyArray<A>, S: P.Semigroup<A>): A {
  return fold_(S)(self);
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray foldLeft
 */
export function foldLeft_<A, B>(self: NonEmptyArray<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @constrained
 */
export function foldMapWithIndex_<M>(M: P.Monoid<M>) {
  return <A>(self: NonEmptyArray<A>, f: (i: number, a: A) => M): M => {
    return self.foldLeftWithIndex(M.nat, (i, b, a) => M.combine_(b, f(i, a)));
  };
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray foldMapWithIndex
 */
export function foldMapWithIndexSelf<A>(self: NonEmptyArray<A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (i: number, a: A) => M): M =>
      foldMapWithIndex_(M)(self, f);
}

/**
 * @constrained
 */
export function foldMap_<M>(M: P.Monoid<M>) {
  return <A>(self: NonEmptyArray<A>, f: (a: A) => M): M => {
    return self.foldMapWithIndex(M)((_, a) => f(a));
  };
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray foldMap
 */
export function foldMapSelf<A>(self: NonEmptyArray<A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (a: A) => M): M =>
      self.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray foldRight
 */
export function foldRight_<A, B>(self: NonEmptyArray<A>, b: B, f: (a: A, b: B) => B): B {
  return self.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

export function group<A>(E: P.Eq<A>) {
  return (self: NonEmptyArray<A>): NonEmptyArray<NonEmptyArray<A>> => {
    return self.chop((as) => {
      const h   = as[0];
      const out = [h] as MutableNonEmptyArray<A>;
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
export function groupSelf<A>(self: NonEmptyArray<A>) {
  return (E: P.Eq<A>): NonEmptyArray<NonEmptyArray<A>> => group(E)(self);
}

export function groupSort<A>(
  O: P.Ord<A>,
): (as: NonEmptyArray<A>) => NonEmptyArray<NonEmptyArray<A>> {
  const sortO  = sort(O);
  const groupO = group(O);
  return (as) => groupO(sortO(as));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray isOutOfBound
 */
export function isOutOfBound_<A>(as: NonEmptyArray<A>, i: number): boolean {
  return i < 0 || i >= as.length;
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray map
 */
export function map_<A, B>(self: NonEmptyArray<A>, f: (a: A) => B): NonEmptyArray<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray mapWithIndex
 */
export function mapWithIndex_<A, B>(
  self: NonEmptyArray<A>,
  f: (i: number, a: A) => B,
): NonEmptyArray<B> {
  const out = NonEmptyArray.allocWithHead(f(0, self[0]), self.length);
  for (let i = 1; i < self.length; i++) {
    out[i] = f(i, self[i]!);
  }
  return out;
}

export function max<A>(O: P.Ord<A>) {
  const S = P.Semigroup.max(O);
  return (self: NonEmptyArray<A>): A => {
    const [head, tail] = self.unprepend;
    return tail.isNonEmpty() ? tail.foldLeft(head, S.combine_) : head;
  };
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray max
 */
export function maxSelf<A>(self: NonEmptyArray<A>, O: P.Ord<A>): A {
  return max(O)(self);
}

export function min<A>(O: P.Ord<A>) {
  const S = P.Semigroup.min(O);
  return (self: NonEmptyArray<A>): A => {
    const [head, tail] = self.unprepend;
    return tail.isNonEmpty() ? tail.foldLeft(head, S.combine_) : head;
  };
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray max
 */
export function minSelf<A>(self: NonEmptyArray<A>, O: P.Ord<A>): A {
  return max(O)(self);
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray mutableClone
 */
export function mutableClone<A>(as: NonEmptyArray<A>): MutableNonEmptyArray<A> {
  return as.slice(0) as unknown as MutableNonEmptyArray<A>;
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray reverse
 */
export function reverse<A>(self: NonEmptyArray<A>): NonEmptyArray<A> {
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
export const sequenceSelf: P.sequenceSelf<NonEmptyArrayF> = (self) => (A) =>
  unsafeCoerce(self.traverse(A)(unsafeCoerce(identity)));

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray splitAt
 */
export function splitAt_<A>(
  self: NonEmptyArray<A>,
  n: number,
): readonly [NonEmptyArray<A>, ReadonlyArray<A>] {
  const m = Math.max(1, n);
  return m >= self.length
    ? [self, []]
    : [self.slice(0, m) as unknown as NonEmptyArray<A>, self.slice(m)];
}

export function sort<B>(O: P.Ord<B>) {
  return <A extends B>(self: NonEmptyArray<A>): NonEmptyArray<A> =>
    self.length === 1
      ? self
      : ((self.mutableClone as unknown as ESArray<A>).sort((first, second) =>
          O.compare_(first, second),
        ) as any);
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray sort
 */
export function sortSelf<A extends B, B>(self: NonEmptyArray<A>, O: P.Ord<B>): NonEmptyArray<A> {
  return sort(O)(self);
}

export const traverseWithIndex_: P.traverseWithIndex_<NonEmptyArrayF> =
  P.mkTraverseWithIndex_<NonEmptyArrayF>()(
    (_) => (A) => (self, f) =>
      self.tail.foldLeftWithIndex(
        A.map_(f(0, self.head), (b) => [b] as NonEmptyArray<typeof b>),
        (i, fbs, a) => A.zipWith_(fbs, f(i + 1, a), (bs, b) => bs.append(b)),
      ),
  );

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray traverseWithIndex
 */
export const traverseWithIndexSelf: P.traverseWithIndexSelf<NonEmptyArrayF> =
  (self) => (A) => (f) =>
    traverseWithIndex_(A)(self, f);

export const traverse_: P.traverse_<NonEmptyArrayF> = (A) => (self, f) =>
  self.traverseWithIndex(A)((_, a) => f(a));

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray traverse
 */
export const traverseSelf: P.traverseSelf<NonEmptyArrayF> = (self) => (A) => (f) =>
  self.traverseWithIndex(A)((_, a) => f(a));

export function uniq<A>(E: P.Eq<A>) {
  return (self: NonEmptyArray<A>): NonEmptyArray<A> => {
    if (self.length === 1) {
      return self;
    }
    const elemE_ = elem_(E);
    const out    = [self[0]] as MutableNonEmptyArray<A>;
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
export function uniqSelf<A>(self: NonEmptyArray<A>) {
  return (E: P.Eq<A>): NonEmptyArray<A> => uniq(E)(self);
}

/**
 * @tsplus fluent fncts.collection.immutable.NonEmptyArray zipWith
 */
export function zipWith_<A, B, C>(
  self: NonEmptyArray<A>,
  fb: NonEmptyArray<B>,
  f: (a: A, b: B) => C,
): NonEmptyArray<C> {
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
export function ap<A>(fa: NonEmptyArray<A>) {
  return <B>(self: NonEmptyArray<(a: A) => B>): NonEmptyArray<B> => ap_(self, fa);
}
/**
 * @tsplus dataFirst align_
 */
export function align<B>(fb: NonEmptyArray<B>) {
  return <A>(self: NonEmptyArray<A>): NonEmptyArray<These<A, B>> => align_(self, fb);
}
/**
 * @tsplus dataFirst alignWith_
 */
export function alignWith<A, B, C>(fb: NonEmptyArray<B>, f: (_: These<A, B>) => C) {
  return (self: NonEmptyArray<A>): NonEmptyArray<C> => alignWith_(self, fb, f);
}
/**
 * @tsplus dataFirst chain_
 */
export function chain<A, B>(f: (a: A) => NonEmptyArray<B>) {
  return (self: NonEmptyArray<A>): NonEmptyArray<B> => chain_(self, f);
}
/**
 * @tsplus dataFirst chainWithIndex_
 */
export function chainWithIndex<A, B>(f: (i: number, a: A) => NonEmptyArray<B>) {
  return (self: NonEmptyArray<A>): NonEmptyArray<B> => chainWithIndex_(self, f);
}
/**
 * @tsplus dataFirst chop_
 */
export function chop<A, B>(f: (as: NonEmptyArray<A>) => readonly [B, ReadonlyArray<A>]) {
  return (self: NonEmptyArray<A>): NonEmptyArray<B> => chop_(self, f);
}
/**
 * @tsplus dataFirst chunksOf_
 */
export function chunksOf(n: number) {
  return <A>(self: NonEmptyArray<A>): NonEmptyArray<NonEmptyArray<A>> => chunksOf_(self, n);
}
/**
 * @tsplus dataFirst crossWith_
 */
export function crossWith<A, B, C>(fb: NonEmptyArray<B>, f: (a: A, b: B) => C) {
  return (self: NonEmptyArray<A>): NonEmptyArray<C> => crossWith_(self, fb, f);
}
/**
 * @tsplus dataFirst foldLeft_
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: NonEmptyArray<A>): B => foldLeft_(self, b, f);
}
/**
 * @tsplus dataFirst foldRight_
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (self: NonEmptyArray<A>): B => foldRight_(self, b, f);
}
/**
 * @tsplus dataFirst isOutOfBound_
 */
export function isOutOfBound(i: number) {
  return <A>(as: NonEmptyArray<A>): boolean => isOutOfBound_(as, i);
}
/**
 * @tsplus dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: NonEmptyArray<A>): NonEmptyArray<B> => map_(self, f);
}
/**
 * @tsplus dataFirst mapWithIndex_
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: NonEmptyArray<A>): NonEmptyArray<B> => mapWithIndex_(self, f);
}
/**
 * @tsplus dataFirst splitAt_
 */
export function splitAt(n: number) {
  return <A>(self: NonEmptyArray<A>): readonly [NonEmptyArray<A>, ReadonlyArray<A>] =>
    splitAt_(self, n);
}
/**
 * @tsplus dataFirst zipWith_
 */
export function zipWith<A, B, C>(fb: NonEmptyArray<B>, f: (a: A, b: B) => C) {
  return (self: NonEmptyArray<A>): NonEmptyArray<C> => zipWith_(self, fb, f);
}
/**
 * @constrained
 * @tsplus dataFirst elem_
 */
export function elem<A>(E: P.Eq<A>) {
  return (a: A) => (self: NonEmptyArray<A>) => elem_(E)(self, a);
}
/**
 * @constrained
 * @tsplus dataFirst foldMapWithIndex_
 */
export function foldMapWithIndex<M>(M: P.Monoid<M>) {
  return <A>(f: (i: number, a: A) => M) =>
    (self: NonEmptyArray<A>) =>
      foldMapWithIndex_(M)(self, f);
}
/**
 * @constrained
 * @tsplus dataFirst foldMap_
 */
export function foldMap<M>(M: P.Monoid<M>) {
  return <A>(f: (a: A) => M) =>
    (self: NonEmptyArray<A>) =>
      foldMap_(M)(self, f);
}
// codegen:end

// codegen:start { preset: barrel, include: api/*.ts }
export * from "./api/append";
export * from "./api/concat";
export * from "./api/foldLeftWithIndex";
export * from "./api/foldRightWithIndex";
export * from "./api/isNonEmpty";
export * from "./api/isOutOfBound";
export * from "./api/prepend";
// codegen:end
