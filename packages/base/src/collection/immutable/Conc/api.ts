import type { Concat, ConcF } from "@fncts/base/collection/immutable/Conc/definition";
import type { Eq } from "@fncts/base/typeclass";
import type * as P from "@fncts/base/typeclass";

import {
  _Empty,
  BUFFER_SIZE,
  Chunk,
  concrete,
  ConcTag,
  Singleton,
  Slice,
} from "@fncts/base/collection/immutable/Conc/definition";
import { EitherTag } from "@fncts/base/data/Either";
import { identity, tuple } from "@fncts/base/data/function";
import { Stack } from "@fncts/base/internal/Stack";

/**
 * @tsplus fluent fncts.Conc align
 */
export function align_<A, B>(self: Conc<A>, fb: Conc<B>): Conc<These<A, B>> {
  return self.alignWith(fb, identity);
}

/**
 * @tsplus fluent fncts.Conc alignWith
 */
export function alignWith_<A, B, C>(self: Conc<A>, fb: Conc<B>, f: (_: These<A, B>) => C): Conc<C> {
  concrete(self);
  concrete(fb);
  const out    = builder<C>();
  const minlen = Math.min(self.length, fb.length);
  const maxlen = Math.max(self.length, fb.length);
  for (let i = 0; i < minlen; i++) {
    out.append(f(These.both(self.get(i), fb.get(i))));
  }
  if (minlen === maxlen) {
    return out.result();
  } else if (self.length > fb.length) {
    for (let i = minlen; i < maxlen; i++) {
      out.append(f(These.left(self.get(i))));
    }
  } else {
    for (let i = minlen; i < maxlen; i++) {
      out.append(f(These.right(fb.get(i))));
    }
  }
  return out.result();
}

/**
 * @tsplus fluent fncts.Conc append
 */
export function append_<A1, A2>(self: Conc<A1>, a: A2): Conc<A1 | A2> {
  concrete(self);
  return self.append(a);
}

export class ConcBuilder<A> {
  constructor(private conc: Conc<A>) {}
  append(a: A): ConcBuilder<A> {
    this.conc = this.conc.append(a);
    return this;
  }
  result(): Conc<A> {
    return this.conc;
  }
}

/**
 * @tsplus static fncts.ConcOps builder
 */
export function builder<A>(): ConcBuilder<A> {
  return new ConcBuilder(Conc.empty());
}

/**
 * @tsplus fluent fncts.Conc flatMap
 */
export function flatMap_<A, B>(ma: Conc<A>, f: (a: A) => Conc<B>): Conc<B> {
  concrete(ma);
  const iterator = ma.arrayIterator();
  let result: IteratorResult<ArrayLike<A>>;
  let out        = Conc.empty<B>();
  while (!(result = iterator.next()).done) {
    const arr    = result.value;
    const length = arr.length;
    for (let i = 0; i < length; i++) {
      const a = arr[i]!;
      out     = out.concat(f(a));
    }
  }
  return out;
}

/**
 * @tsplus static fncts.ConcOps chainRecDepthFirst
 */
export function chainRecDepthFirst<A, B>(a: A, f: (a: A) => Conc<Either<A, B>>): Conc<B> {
  let buffer = f(a);
  let out    = Conc.empty<B>();

  while (buffer.length > 0) {
    const e = buffer.unsafeHead;
    buffer  = buffer.unsafeTail;
    Either.concrete(e);
    if (e._tag === EitherTag.Left) {
      buffer = f(e.left).concat(buffer);
    } else {
      out = out.append(e.right);
    }
  }

  return out;
}

/**
 * @tsplus static fncts.ConcOps chainRecBreadthFirst
 */
export function chainRecBreadthFirst<A, B>(a: A, f: (a: A) => Conc<Either<A, B>>): Conc<B> {
  const initial = f(a);
  let buffer    = Conc.empty<Either<A, B>>();
  let out       = Conc.empty<B>();

  function go(e: Either<A, B>): void {
    Either.concrete(e);
    if (e._tag === EitherTag.Left) {
      f(e.left).forEach((ab) => ((buffer = buffer.append(ab)), undefined));
    } else {
      out = out.append(e.right);
    }
  }

  for (const e of initial) {
    go(e);
  }

  while (buffer.length > 0) {
    const ab = buffer.unsafeHead;
    buffer   = buffer.unsafeTail;
    go(ab);
  }

  return out;
}

/**
 * @tsplus fluent fncts.Conc chop
 */
export function chop_<A, B>(self: Conc<A>, f: (as: Conc<A>) => readonly [B, Conc<A>]): Conc<B> {
  const out       = builder<B>();
  let cs: Conc<A> = self;
  while (cs.isNonEmpty) {
    const [b, c] = f(cs);
    out.append(b);
    cs = c;
  }
  return out.result();
}

/**
 * @tsplus fluent fncts.Conc chunksOf
 */
export function chunksOf_<A>(self: Conc<A>, n: number): Conc<Conc<A>> {
  return self.chop((as) => as.splitAt(n));
}

/**
 * Transforms all elements of the Conc for as long as the specified partial function is defined.
 *
 * @tsplus fluent fncts.Conc collectWhile
 */
export function collectWhile_<A, B>(as: Conc<A>, f: (a: A) => Maybe<B>): Conc<B> {
  concrete(as);

  switch (as._tag) {
    case ConcTag.Singleton: {
      return f(as.value).match(() => Conc.empty(), Conc.single);
    }
    case ConcTag.Chunk: {
      const array = as.arrayLike();
      let dest    = Conc.empty<B>();
      for (let i = 0; i < array.length; i++) {
        const rhs = f(array[i]!);
        if (rhs.isJust()) {
          dest = dest.append(rhs.value);
        } else {
          return dest;
        }
      }
      return dest;
    }
    default: {
      return collectWhile_(as.materialize(), f);
    }
  }
}

/**
 * @tsplus getter fncts.Conc compact
 */
export function compact<A>(self: Conc<Maybe<A>>): Conc<A> {
  return self.filterMap(identity);
}

/**
 * @tsplus fluent fncts.Conc concat
 */
export function concat_<A, B>(self: Conc<A>, that: Conc<B>): Conc<A | B> {
  concrete(self);
  concrete(that);
  return self.concat(that);
}

/**
 * @tsplus fluent fncts.Conc elem
 */
export function elem_<A>(self: Conc<A>, a: A, /** @tsplus auto */ E: Eq<A>): boolean {
  return self.exists((el) => E.equals(el, a));
}

/**
 * @tsplus fluent fncts.Conc exists
 */
export function exists_<A>(as: Conc<A>, predicate: Predicate<A>): boolean {
  concrete(as);
  const iterator = as.arrayIterator();
  let exists     = false;
  let result: IteratorResult<ArrayLike<A>>;
  while (!exists && !(result = iterator.next()).done) {
    const array = result.value;
    for (let i = 0; !exists && i < array.length; i++) {
      exists = predicate(array[i]!);
    }
  }
  return exists;
}

/**
 * @tsplus fluent fncts.Conc drop
 */
export function drop_<A>(self: Conc<A>, n: number): Conc<A> {
  concrete(self);
  const len = self.length;
  if (len <= 0) {
    return self;
  } else if (n >= len) {
    return Conc.empty();
  } else {
    switch (self._tag) {
      case ConcTag.Slice:
        return new Slice(self.conc, self.offset + n, self.l - n);
      case ConcTag.Singleton:
        return n > 0 ? Conc.empty() : self;
      case ConcTag.Empty:
        return Conc.empty();
      default:
        return new Slice(self, n, len - n);
    }
  }
}

/**
 * @tsplus fluent fncts.Conc dropWhile
 */
export function dropWhile_<A>(self: Conc<A>, p: Predicate<A>): Conc<A> {
  concrete(self);
  switch (self._tag) {
    case ConcTag.Chunk: {
      const arr = self.arrayLike();
      let i     = 0;
      while (i < arr.length && p(arr[i]!)) {
        i++;
      }
      return drop_(self, i);
    }
    default: {
      const iterator = self.arrayIterator();
      let result: IteratorResult<ArrayLike<A>>;
      let cont       = true;
      let i          = 0;
      while (cont && !(result = iterator.next()).done) {
        const array = result.value;
        let j       = 0;
        while (cont && j < array.length) {
          if (p(array[j]!)) {
            i++;
            j++;
          } else {
            cont = false;
          }
        }
      }
      return drop_(self, i);
    }
  }
}

/**
 * @tsplus fluent fncts.Conc filter
 */
export function filter_<A, B extends A>(self: Conc<A>, p: Refinement<A, B>): Conc<B>;
export function filter_<A>(self: Conc<A>, p: Predicate<A>): Conc<A>;
export function filter_<A>(self: Conc<A>, p: Predicate<A>): Conc<A> {
  return self.filterWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.Conc filterMap
 */
export function filterMap_<A, B>(self: Conc<A>, f: (a: A) => Maybe<B>): Conc<B> {
  return self.filterMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.Conc filterMapWithIndex
 */
export function filterMapWithIndex_<A, B>(self: Conc<A>, f: (i: number, a: A) => Maybe<B>): Conc<B> {
  concrete(self);
  const iterator = self.arrayIterator();
  const out      = builder<B>();
  let result: IteratorResult<ArrayLike<A>>;
  let i          = 0;
  while (!(result = iterator.next()).done) {
    const array = result.value;
    for (let j = 0; j < array.length; j++) {
      const ob = f(i, array[j]!);
      if (ob.isJust()) {
        out.append(ob.value);
      }
      i++;
    }
  }
  return out.result();
}

/**
 * @tsplus fluent fncts.Conc filterWithIndex
 */
export function filterWithIndex_<A, B extends A>(self: Conc<A>, p: RefinementWithIndex<number, A, B>): Conc<B>;
export function filterWithIndex_<A>(self: Conc<A>, p: PredicateWithIndex<number, A>): Conc<A>;
export function filterWithIndex_<A>(self: Conc<A>, p: PredicateWithIndex<number, A>): Conc<A> {
  concrete(self);
  switch (self._tag) {
    case ConcTag.Empty: {
      return _Empty;
    }
    case ConcTag.Chunk: {
      const arr   = self.arrayLike();
      let builder = Conc.empty<A>();
      for (let i = 0; i < arr.length; i++) {
        const a = arr[i]!;
        if (p(i, a)) {
          builder = builder.append(a);
        }
      }
      return builder;
    }
    case ConcTag.Singleton: {
      if (p(0, self.value)) {
        return self;
      }
      return _Empty;
    }
    default: {
      const iterator = self.arrayIterator();
      let out        = Conc.empty<A>();
      let result: IteratorResult<ArrayLike<A>>;
      let i          = 0;
      while (!(result = iterator.next()).done) {
        const array = result.value;
        for (let j = 0; j < array.length; j++) {
          const a = array[j]!;
          if (p(i, a)) {
            out = out.append(a);
          }
          i++;
        }
      }
      return out;
    }
  }
}

/**
 * @tsplus fluent fncts.Conc find
 */
export function find_<A>(self: Conc<A>, f: (a: A) => boolean): Maybe<A> {
  concrete(self);
  const iterator = self.arrayIterator();
  let out        = Nothing<A>();
  let result: IteratorResult<ArrayLike<A>>;
  while (out.isNothing() && !(result = iterator.next()).done) {
    const array  = result.value;
    const length = array.length;
    for (let i = 0; out.isNothing() && i < length; i++) {
      const a = array[i]!;
      if (f(a)) {
        out = Just(a);
      }
    }
  }
  return out;
}

/**
 * @tsplus getter fncts.Conc flatten
 */
export function flatten<A>(self: Conc<Conc<A>>): Conc<A> {
  return self.flatMap(identity);
}
/**
 * Folds over the elements in this Conc from the left.
 * Stops the fold early when the condition is not fulfilled.
 *
 * @tsplus fluent fncts.Conc foldLeftWhile
 */
export function foldLeftWhile_<A, B>(as: Conc<A>, b: B, p: Predicate<B>, f: (b: B, a: A) => B): B {
  concrete(as);
  const iterator = as.arrayIterator();
  let s          = b;
  let cont       = p(s);
  let result: IteratorResult<ArrayLike<A>>;
  while (cont && !(result = iterator.next()).done) {
    const array = result.value;
    for (let i = 0; cont && i < array.length; i++) {
      s    = f(s, array[i]!);
      cont = p(s);
    }
  }
  return s;
}

/**
 * @tsplus fluent fncts.Conc foldLeft
 */
export function foldLeft_<A, B>(self: Conc<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.Conc foldLeftWithIndex
 */
export function foldLeftWithIndex_<A, B>(self: Conc<A>, b: B, f: (i: number, b: B, a: A) => B): B {
  concrete(self);
  const iterator = self.arrayIterator();
  let out        = b;
  let result: IteratorResult<ArrayLike<A>>;
  let i          = 0;
  while (!(result = iterator.next()).done) {
    const array = result.value;
    for (let j = 0; j < array.length; j++) {
      out = f(i, out, array[j]!);
      i++;
    }
  }
  return out;
}

/**
 * @tsplus fluent fncts.Conc foldMap
 */
export function foldMap_<A, M>(fa: Conc<A>, f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>): M {
  return fa.foldMapWithIndex((_, a) => f(a), M);
}

/**
 * @tsplus fluent fncts.Conc foldMapWithIndex
 */
export function foldMapWithIndex_<A, M>(fa: Conc<A>, f: (i: number, a: A) => M, /** @tsplus auto */ M: P.Monoid<M>): M {
    return fa.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(b, f(i, a)));
}

/**
 * @tsplus fluent fncts.Conc foldRight
 */
export function foldRight_<A, B>(fa: Conc<A>, b: B, f: (a: A, b: B) => B): B {
  return fa.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.Conc foldRightWithIndex
 */
export function foldRightWithIndex_<A, B>(self: Conc<A>, b: B, f: (i: number, a: A, b: B) => B): B {
  concrete(self);
  const iterator = self.reverseArrayIterator();
  let out        = b;
  let result: IteratorResult<ArrayLike<A>>;
  let i          = self.length - 1;
  while (!(result = iterator.next()).done) {
    const array = result.value;
    for (let j = array.length - 1; j >= 0; j--) {
      out = f(i, array[i]!, out);
      i--;
    }
  }
  return out;
}

/**
 * @tsplus fluent fncts.Conc forEach
 */
export function forEach_<A, B>(self: Conc<A>, f: (a: A) => B): void {
  concrete(self);
  return self.forEach(0, (_, a) => f(a));
}

/**
 * @tsplus fluent fncts.Conc forEachWithIndex
 */
export function forEachWithIndex_<A, B>(self: Conc<A>, f: (i: number, a: A) => B): void {
  concrete(self);
  self.forEach(0, f);
}

/**
 * @tsplus fluent fncts.Conc get
 */
export function get_<A>(as: Conc<A>, n: number): Maybe<A> {
  return Maybe.tryCatch(() => unsafeGet_(as, n));
}

/**
 * @tsplus getter fncts.Conc head
 */
export function head<A>(self: Conc<A>): Maybe<A> {
  concrete(self);
  if (isEmpty(self)) {
    return Nothing();
  }
  return Just(self.get(0));
}

/**
 * @tsplus getter fncts.Conc init
 */
export function init<A>(self: Conc<A>): Maybe<Conc<A>> {
  if (isEmpty(self)) {
    return Nothing();
  }
  return Just(self.take(self.length - 1));
}

/**
 * @tsplus fluent fncts.Conc join
 */
export function join_(self: Conc<string>, separator: string): string {
  if (self.length === 0) {
    return "";
  }
  return self.unsafeTail.foldLeft(self.unsafeGet(0), (b, s) => b + separator + s);
}

/**
 * @tsplus getter fncts.Conc last
 */
export function last<A>(self: Conc<A>): Maybe<A> {
  concrete(self);
  if (isEmpty(self)) {
    return Nothing();
  }
  return Just(self.get(self.length - 1));
}

/**
 * @tsplus fluent fncts.Conc map
 */
export function map_<A, B>(self: Conc<A>, f: (a: A) => B): Conc<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * Statefully maps over the Conc, producing new elements of type `B`.
 *
 * @tsplus fluent fncts.Conc mapAccum
 */
export function mapAccum_<A, S, B>(self: Conc<A>, s: S, f: (s: S, a: A) => readonly [S, B]): readonly [S, Conc<B>] {
  concrete(self);
  const iterator = self.arrayIterator();
  const out      = builder<B>();
  let state      = s;
  let result;
  while (!(result = iterator.next()).done) {
    const array  = result.value;
    const length = array.length;
    for (let i = 0; i < length; i++) {
      const a   = array[i]!;
      const tup = f(state, a);
      out.append(tup[1]);
      state = tup[0];
    }
  }
  return tuple(s, out.result());
}

function mapArrayLike<A, B>(as: ArrayLike<A>, len: number, startIndex: number, f: (i: number, a: A) => B): Conc<B> {
  let bs = Conc.empty<B>();
  for (let i = 0; i < len; i++) {
    bs = append_(bs, f(i + startIndex, as[i]!));
  }
  return bs;
}

function mapArrayLikeReverse<A, B>(
  as: ArrayLike<A>,
  len: number,
  endIndex: number,
  f: (i: number, a: A) => B,
): Conc<B> {
  let bs = Conc.empty<B>();
  for (let i = BUFFER_SIZE - len, j = len - 1; i < BUFFER_SIZE; i++, j--) {
    bs = append_(bs, f(endIndex - j, as[i]!));
  }
  return bs;
}

class DoneFrame {
  readonly _tag = "Done";
}

class ConcatLeftFrame<A> {
  readonly _tag = "ConcatLeft";

  constructor(readonly conc: Concat<A>, readonly currentIndex: number) {}
}

class ConcatRightFrame<B> {
  readonly _tag = "ConcatRight";
  constructor(readonly leftResult: Conc<B>) {}
}

class AppendFrame<A> {
  readonly _tag = "Append";
  constructor(readonly buffer: ArrayLike<A>, readonly bufferUsed: number, readonly startIndex: number) {}
}

class PrependFrame<A, B> {
  readonly _tag = "Prepend";
  constructor(readonly pre: Conc<B>, readonly end: Conc<A>) {}
}

type Frame<A, B> = DoneFrame | ConcatLeftFrame<A> | ConcatRightFrame<B> | AppendFrame<A> | PrependFrame<A, B>;

/**
 * @tsplus fluent fncts.Conc mapWithIndex
 */
export function mapWithIndex_<A, B>(self: Conc<A>, f: (i: number, a: A) => B): Conc<B> {
  let current = self;

  let index = 0;

  const stack = Stack<Frame<A, B>>();
  stack.push(new DoneFrame());

  let result: Conc<B> = Conc.empty();

  recursion: while (stack.hasNext) {
    // eslint-disable-next-line no-constant-condition
    pushing: while (true) {
      concrete<A>(current);
      switch (current._tag) {
        case ConcTag.Singleton: {
          result = new Singleton(f(index++, current.value));
          break pushing;
        }
        case ConcTag.Empty: {
          result = _Empty;
          break pushing;
        }
        case ConcTag.Chunk: {
          result = new Chunk(current._array.map((a, i) => f(i + index, a)));
          index += current.length;
          break pushing;
        }
        case ConcTag.Concat: {
          stack.push(new ConcatLeftFrame(current, index));
          current = current.left;
          continue pushing;
        }
        case ConcTag.AppendN: {
          stack.push(new AppendFrame(current.buffer as ArrayLike<A>, current.bufferUsed, index));
          current = current.start;
          continue pushing;
        }
        case ConcTag.PrependN: {
          stack.push(
            new PrependFrame(
              mapArrayLikeReverse(
                current.buffer as ArrayLike<A>,
                current.bufferUsed,
                index + current.bufferUsed - 1,
                f,
              ),
              current.end,
            ),
          );
          index += current.bufferUsed;
          break pushing;
        }
        case ConcTag.Slice: {
          let r = Conc.empty<B>();
          for (let i = 0; i < current.length; i++) {
            r = r.append(f(i + index, unsafeGet_(current, i)));
          }
          result = r;
          index += current.length;
          break pushing;
        }
      }
    }
    // eslint-disable-next-line no-constant-condition
    popping: while (true) {
      const top = stack.pop()!;
      switch (top._tag) {
        case "Done": {
          return result;
        }
        case "ConcatLeft": {
          current = top.conc.right;
          stack.push(new ConcatRightFrame(result));
          continue recursion;
        }
        case "ConcatRight": {
          result = concat_(top.leftResult, result);
          continue popping;
        }
        case "Append": {
          result = concat_(result, mapArrayLike(top.buffer, top.bufferUsed, index, f));
          continue popping;
        }
        case "Prepend": {
          current = top.end;
          stack.push(new ConcatRightFrame(top.pre));
          continue recursion;
        }
      }
    }
  }
  throw new Error("bug");
}

/**
 * @tsplus getter fncts.Conc isEmpty
 */
export function isEmpty<A>(self: Conc<A>): boolean {
  concrete(self);
  return self.length === 0;
}

/**
 * @tsplus getter fncts.Conc isNonEmpty
 */
export function isNonEmpty<A>(conc: Conc<A>): boolean {
  return !isEmpty(conc);
}

/**
 * @tsplus fluent fncts.Conc partition
 */
export function partition_<A, B extends A>(self: Conc<A>, p: Refinement<A, B>): readonly [Conc<A>, Conc<B>];
export function partition_<A>(self: Conc<A>, p: Predicate<A>): readonly [Conc<A>, Conc<A>];
export function partition_<A>(self: Conc<A>, p: Predicate<A>): readonly [Conc<A>, Conc<A>] {
  return self.partitionWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.Conc partitionMap
 */
export function partitionMap_<A, B, C>(self: Conc<A>, f: (a: A) => Either<B, C>): readonly [Conc<B>, Conc<C>] {
  return self.partitionMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.Conc partitionMapWithIndex
 */
export function partitionMapWithIndex_<A, B, C>(
  fa: Conc<A>,
  f: (i: number, a: A) => Either<B, C>,
): readonly [Conc<B>, Conc<C>] {
  concrete(fa);
  const iterator = fa.arrayIterator();
  const left     = builder<B>();
  const right    = builder<C>();
  let result: IteratorResult<ArrayLike<A>>;
  let i          = 0;
  while (!(result = iterator.next()).done) {
    const array = result.value;
    for (let j = 0; j < array.length; j++) {
      const eab = f(i, array[j]!);
      eab.match(
        (b) => left.append(b),
        (c) => right.append(c),
      );
      i++;
    }
  }
  return [left.result(), right.result()];
}

/**
 * @tsplus fluent fncts.Conc partitionWithIndex
 */
export function partitionWithIndex_<A, B extends A>(
  self: Conc<A>,
  p: RefinementWithIndex<number, A, B>,
): readonly [Conc<A>, Conc<B>];
export function partitionWithIndex_<A>(self: Conc<A>, p: PredicateWithIndex<number, A>): readonly [Conc<A>, Conc<A>];
export function partitionWithIndex_<A>(self: Conc<A>, p: PredicateWithIndex<number, A>): readonly [Conc<A>, Conc<A>] {
  concrete(self);
  const iterator = self.arrayIterator();
  const left     = builder<A>();
  const right    = builder<A>();
  let result: IteratorResult<ArrayLike<A>>;
  let i          = 0;
  while (!(result = iterator.next()).done) {
    const array = result.value;
    for (let j = 0; j < array.length; j++) {
      const a = array[j]!;
      if (p(i, a)) {
        right.append(a);
      } else {
        left.append(a);
      }
      i++;
    }
  }
  return [left.result(), right.result()];
}

/**
 * @tsplus fluent fncts.Conc prepend
 */
export function prepend_<A, B>(self: Conc<A>, a: B): Conc<A | B> {
  concrete(self);
  return self.prepend(a);
}

/**
 * @tsplus getter fncts.Conc reverse
 */
export function reverse<A>(self: Conc<A>): Iterable<A> {
  concrete(self);
  const arr = self.arrayLike();
  return Iterable.make<A>(() => {
    let i = arr.length - 1;
    return {
      next: () => {
        if (i >= 0 && i < arr.length) {
          const k = arr[i]!;
          i--;
          return {
            value: k,
            done: false,
          };
        } else {
          return {
            value: undefined,
            done: true,
          };
        }
      },
    };
  });
}

/**
 * @tsplus getter fncts.Conc separate
 */
export function separate<E, A>(self: Conc<Either<E, A>>): readonly [Conc<E>, Conc<A>] {
  return self.partitionMap(identity);
}

/**
 * @tsplus fluent fncts.Conc splitAt
 */
export function splitAt_<A>(self: Conc<A>, n: number): readonly [Conc<A>, Conc<A>] {
  return [self.take(n), self.drop(n)];
}

/**
 * Splits this Conc on the first element that matches this predicate.
 *
 * @tsplus fluent fncts.Conc splitWhere
 */
export function splitWhere_<A>(self: Conc<A>, f: (a: A) => boolean): readonly [Conc<A>, Conc<A>] {
  concrete(self);
  const iterator = self.arrayIterator();
  let next;
  let cont       = true;
  let i          = 0;

  while (cont && (next = iterator.next()) && !next.done) {
    const array = next.value;
    const len   = array.length;
    let j       = 0;
    while (cont && j < len) {
      const a = array[j]!;
      if (f(a)) {
        cont = false;
      } else {
        i++;
        j++;
      }
    }
  }

  return splitAt_(self, i);
}

/**
 * @tsplus getter fncts.Conc tail
 */
export function tail<A>(conc: Conc<A>): Maybe<Conc<A>> {
  if (conc.isEmpty) {
    return Nothing();
  }
  return Just(conc.drop(1));
}

/**
 * @tsplus fluent fncts.Conc take
 */
export function take_<A>(self: Conc<A>, n: number): Conc<A> {
  concrete(self);
  return self.take(n);
}

/**
 * @tsplus fluent fncts.Conc takeWhile
 */
export function takeWhile_<A>(self: Conc<A>, p: Predicate<A>): Conc<A> {
  concrete(self);
  switch (self._tag) {
    case ConcTag.Chunk: {
      const arr = self.arrayLike();
      let i     = 0;
      while (i < arr.length && p(arr[i]!)) {
        i++;
      }
      return take_(self, i);
    }
    default: {
      const iterator = self.arrayIterator();
      let result: IteratorResult<ArrayLike<A>>;
      let cont       = true;
      let i          = 0;
      while (cont && !(result = iterator.next()).done) {
        const array = result.value;
        let j       = 0;
        while (cont && j < array.length) {
          if (!p(array[j]!)) {
            cont = false;
          } else {
            i++;
            j++;
          }
        }
      }
      return take_(self, i);
    }
  }
}

/**
 * @tsplus fluent fncts.Conc traverse
 */
export const traverse: P.Traversable<ConcF>["traverse"] = (self, f, G) => self.traverseWithIndex((_, a) => f(a), G);

/**
 * @tsplus fluent fncts.Conc traverseWithIndex
 */
export function traverseWithIndex<G extends HKT, KG, QG, WG, XG, IG, SG, RG, EG, A, B>(
  self: Conc<A>,
  f: (i: number, a: A) => HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, B>,
  /** @tsplus auto */ G: P.Applicative<G>,
): HKT.Kind<G, KG, QG, WG, XG, IG, SG, RG, EG, Conc<B>> {
  return self.foldLeftWithIndex(G.pure(Conc.empty()), (i, fbs, a) => fbs.zipWith(f(i, a), (bs, b) => bs.append(b), G));
}

/**
 * @tsplus fluent fncts.ConcOps unfold
 */
export function unfold<A, B>(b: B, f: (b: B) => Maybe<readonly [A, B]>): Conc<A> {
  const out = builder<A>();
  let bb    = b;
  while (true) {
    const mt = f(bb);
    if (mt.isJust()) {
      const [a, b] = mt.value;
      out.append(a);
      bb = b;
    } else {
      return out.result();
    }
  }
}

/**
 * @tsplus fluent fncts.Conc unsafeGet
 * @tsplus index fncts.Conc
 */
export function unsafeGet_<A>(self: Conc<A>, n: number): A {
  concrete(self);
  return self.get(n);
}

/**
 * Returns the first element of this Conc. Note that this method is partial
 * in that it will throw an exception if the Conc is empty. Consider using
 * `head` to explicitly handle the possibility that the Conc is empty
 * or iterating over the elements of the Conc in lower level, performance
 * sensitive code unless you really only need the first element of the Conc.
 *
 * @tsplus getter fncts.Conc unsafeHead
 */
export function unsafeHead<A>(as: Conc<A>): A {
  concrete(as);
  return as.get(0);
}

/**
 * Returns every element after the first. Note that this method is partial
 * in that it will throw an exception if the Conc is empty. Consider using
 * `tail` to explicitly handle the possibility that the Conc is empty
 *
 * @tsplus getter fncts.Conc unsafeTail
 */
export function unsafeTail<A>(self: Conc<A>): Conc<A> {
  if (self.length === 0) {
    throw new ArrayIndexOutOfBoundsError("Chunk.unsafeTail access to 1");
  }
  return self.drop(1);
}

/**
 * @tsplus fluent fncts.Conc unsafeUpdateAt
 */
export function unsafeUpdateAt_<A, A1>(self: Conc<A>, i: number, a: A1): Conc<A | A1> {
  concrete(self);
  return self.update(i, a);
}

/**
 * @tsplus fluent fncts.Conc updateAt
 */
export function updateAt_<A, A1>(self: Conc<A>, i: number, a: A1): Maybe<Conc<A | A1>> {
  try {
    return Just(self.unsafeUpdateAt(i, a));
  } catch {
    return Nothing();
  }
}

/**
 * @tsplus fluent fncts.Conc zip
 */
export function zip_<A, B>(self: Conc<A>, fb: Conc<B>): Conc<readonly [A, B]> {
  return self.zipWith(fb, tuple);
}

/**
 * @tsplus fluent fncts.Conc zipWith
 */
export function zipWith_<A, B, C>(self: Conc<A>, fb: Conc<B>, f: (a: A, b: B) => C): Conc<C> {
  concrete(self);
  concrete(fb);
  const length = Math.min(self.length, fb.length);
  if (length === 0) {
    return Conc.empty();
  } else {
    const leftIterator  = self.arrayIterator();
    const rightIterator = fb.arrayIterator();
    const out           = builder<C>();
    let left: IteratorResult<ArrayLike<A>>  = null as any;
    let right: IteratorResult<ArrayLike<B>> = null as any;
    let leftLength  = 0;
    let rightLength = 0;
    let i           = 0;
    let j           = 0;
    let k           = 0;
    while (i < length) {
      if (j < leftLength && k < rightLength) {
        const a = left.value[j];
        const b = right.value[k];
        const c = f(a, b);
        out.append(c);
        i++;
        j++;
        k++;
      } else if (j === leftLength && !(left = leftIterator.next()).done) {
        leftLength = left.value.length;
        j          = 0;
      } else if (k === rightLength && !(right = rightIterator.next()).done) {
        rightLength = right.value.length;
        k           = 0;
      }
    }
    return out.result();
  }
}

/**
 * @tsplus getter fncts.Conc zipWithIndex
 */
export function zipWithIndex<A>(self: Conc<A>): Conc<readonly [A, number]> {
  return self.zipWithIndexOffset(0);
}

/**
 * @tsplus fluent fncts.Conc zipWithIndexOffset
 */
export function zipWithIndexOffset_<A>(as: Conc<A>, offset: number): Conc<readonly [A, number]> {
  concrete(as);
  const iterator = as.arrayIterator();
  let next: IteratorResult<ArrayLike<A>>;
  let i          = offset;
  const out      = builder<readonly [A, number]>();
  while (!(next = iterator.next()).done) {
    const array = next.value;
    const len   = array.length;
    for (let j = 0; i < len; j++, i++) {
      out.append([array[j]!, i]);
    }
  }
  return out.result();
}
