import type { Either } from "../../../data/Either.js";
import type { Predicate, PredicateWithIndex } from "../../../data/Predicate.js";
import type { Refinement, RefinementWithIndex } from "../../../data/Refinement.js";
import type { Eq } from "../../../prelude.js";
import type { Concat, ConcF } from "./definition.js";

import { EitherTag } from "../../../data/Either.js";
import { ArrayIndexOutOfBoundsError } from "../../../data/exceptions.js";
import { identity, tuple } from "../../../data/function.js";
import { Just, Maybe, Nothing } from "../../../data/Maybe.js";
import { These } from "../../../data/These.js";
import { Stack } from "../../../internal/Stack.js";
import * as P from "../../../prelude.js";
import { Iterable } from "../../Iterable/definition.js";
import {
  _Empty,
  BUFFER_SIZE,
  Chunk,
  Conc,
  concrete,
  ConcTag,
  Singleton,
  Slice,
} from "./definition.js";

/**
 * @tsplus fluent fncts.collection.immutable.Conc align
 */
export function align_<A, B>(self: Conc<A>, fb: Conc<B>): Conc<These<A, B>> {
  return self.alignWith(fb, identity);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc alignWith
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
 * @tsplus fluent fncts.collection.immutable.Conc append
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
 * @tsplus static fncts.collection.immutable.ConcOps builder
 */
export function builder<A>(): ConcBuilder<A> {
  return new ConcBuilder(Conc.empty());
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc chain
 */
export function chain_<A, B>(ma: Conc<A>, f: (a: A) => Conc<B>): Conc<B> {
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
 * @tsplus static fncts.collection.immutable.ConcOps chainRecDepthFirst
 */
export function chainRecDepthFirst<A, B>(a: A, f: (a: A) => Conc<Either<A, B>>): Conc<B> {
  let buffer = f(a);
  let out    = Conc.empty<B>();

  while (buffer.length > 0) {
    const e = buffer.unsafeHead;
    buffer  = buffer.unsafeTail;
    if (e._tag === EitherTag.Left) {
      buffer = f(e.left).concat(buffer);
    } else {
      out = out.append(e.right);
    }
  }

  return out;
}

/**
 * @tsplus static fncts.collection.immutable.ConcOps chainRecBreadthFirst
 */
export function chainRecBreadthFirst<A, B>(a: A, f: (a: A) => Conc<Either<A, B>>): Conc<B> {
  const initial = f(a);
  let buffer    = Conc.empty<Either<A, B>>();
  let out       = Conc.empty<B>();

  function go(e: Either<A, B>): void {
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
 * @tsplus fluent fncts.collection.immutable.Conc chop
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
 * @tsplus fluent fncts.collection.immutable.Conc chunksOf
 */
export function chunksOf_<A>(self: Conc<A>, n: number): Conc<Conc<A>> {
  return self.chop((as) => as.splitAt(n));
}

/**
 * Transforms all elements of the Conc for as long as the specified partial function is defined.
 *
 * @tsplus fluent fncts.collection.immutable.Conc collectWhile
 */
export function collectWhile_<A, B>(as: Conc<A>, f: (a: A) => Maybe<B>): Conc<B> {
  concrete(as);

  switch (as._concTag) {
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
 * @tsplus getter fncts.collection.immutable.Conc compact
 */
export function compact<A>(self: Conc<Maybe<A>>): Conc<A> {
  return self.filterMap(identity);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc concat
 */
export function concat_<A, B>(self: Conc<A>, that: Conc<B>): Conc<A | B> {
  concrete(self);
  concrete(that);
  return self.concat(that);
}

/**
 * @tsplus getter fncts.collection.immutable.Conc elem
 */
export function elem_<A>(self: Conc<A>) {
  return (E: Eq<A>) =>
    (a: A): boolean =>
      self.exists((el) => E.equals_(el, a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc exists
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
 * @tsplus fluent fncts.collection.immutable.Conc drop
 */
export function drop_<A>(self: Conc<A>, n: number): Conc<A> {
  concrete(self);
  const len = self.length;
  if (len <= 0) {
    return self;
  } else if (n >= len) {
    return Conc.empty();
  } else {
    switch (self._concTag) {
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
 * @tsplus fluent fncts.collection.immutable.Conc dropWhile
 */
export function dropWhile_<A>(self: Conc<A>, p: Predicate<A>): Conc<A> {
  concrete(self);
  switch (self._concTag) {
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
 * @tsplus fluent fncts.collection.immutable.Conc filter
 */
export function filter_<A, B extends A>(self: Conc<A>, p: Refinement<A, B>): Conc<B>;
export function filter_<A>(self: Conc<A>, p: Predicate<A>): Conc<A>;
export function filter_<A>(self: Conc<A>, p: Predicate<A>): Conc<A> {
  return self.filterWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc filterMap
 */
export function filterMap_<A, B>(self: Conc<A>, f: (a: A) => Maybe<B>): Conc<B> {
  return self.filterMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc filterMapWithIndex
 */
export function filterMapWithIndex_<A, B>(
  self: Conc<A>,
  f: (i: number, a: A) => Maybe<B>,
): Conc<B> {
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
 * @tsplus fluent fncts.collection.immutable.Conc filterWithIndex
 */
export function filterWithIndex_<A, B extends A>(
  self: Conc<A>,
  p: RefinementWithIndex<number, A, B>,
): Conc<B>;
export function filterWithIndex_<A>(self: Conc<A>, p: PredicateWithIndex<number, A>): Conc<A>;
export function filterWithIndex_<A>(self: Conc<A>, p: PredicateWithIndex<number, A>): Conc<A> {
  concrete(self);
  switch (self._concTag) {
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
 * @tsplus fluent fncts.collection.immutable.Conc find
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
 * @tsplus getter fncts.collection.immutable.Conc flatten
 */
export function flatten<A>(self: Conc<Conc<A>>): Conc<A> {
  return self.chain(identity);
}
/**
 * Folds over the elements in this Conc from the left.
 * Stops the fold early when the condition is not fulfilled.
 *
 * @tsplus fluent fncts.collection.immutable.Conc foldLeftWhile
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
 * @tsplus fluent fncts.collection.immutable.Conc foldLeft
 */
export function foldLeft_<A, B>(self: Conc<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc foldLeftWithIndex
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
      out = f(i, out, array[i]!);
      i++;
    }
  }
  return out;
}

/**
 * @constrained
 */
export function foldMap_<M>(M: P.Monoid<M>) {
  return <A>(fa: Conc<A>, f: (a: A) => M) => fa.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @tsplus getter fncts.collection.immutable.Conc foldMap
 */
export function foldMapSelf<A>(self: Conc<A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (a: A) => M): M =>
      self.foldMapWithIndex(M)((_, a) => f(a));
}

/**
 * @constrained
 */
export function foldMapWithIndex_<M>(M: P.Monoid<M>) {
  return <A>(fa: Conc<A>, f: (i: number, a: A) => M): M =>
    fa.foldLeftWithIndex(M.nat, (i, b, a) => M.combine_(b, f(i, a)));
}

/**
 * @tsplus getter fncts.collection.immutable.Conc foldMapWithIndex
 */
export function foldMapWithIndexSelf<A>(self: Conc<A>) {
  return <M>(M: P.Monoid<M>) =>
    (f: (i: number, a: A) => M): M =>
      foldMapWithIndex_(M)(self, f);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc foldRight
 */
export function foldRight_<A, B>(fa: Conc<A>, b: B, f: (a: A, b: B) => B): B {
  return fa.foldRightWithIndex(b, (_, a, b) => f(a, b));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc foldRightWithIndex
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
 * @tsplus fluent fncts.collection.immutable.Conc forEach
 */
export function forEach_<A, B>(self: Conc<A>, f: (a: A) => B): void {
  concrete(self);
  return self.forEach(0, (_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc forEachWithIndex
 */
export function forEachWithIndex_<A, B>(self: Conc<A>, f: (i: number, a: A) => B): void {
  concrete(self);
  self.forEach(0, f);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc get
 */
export function get_<A>(as: Conc<A>, n: number): Maybe<A> {
  return Maybe.tryCatch(() => unsafeGet_(as, n));
}

/**
 * @tsplus getter fncts.collection.immutable.Conc head
 */
export function head<A>(self: Conc<A>): Maybe<A> {
  concrete(self);
  if (isEmpty(self)) {
    return Nothing();
  }
  return Just(self.get(0));
}

/**
 * @tsplus getter fncts.collection.immutable.Conc init
 */
export function init<A>(self: Conc<A>): Maybe<Conc<A>> {
  if (isEmpty(self)) {
    return Nothing();
  }
  return Just(self.take(self.length - 1));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc join
 */
export function join_(self: Conc<string>, separator: string): string {
  if (self.length === 0) {
    return "";
  }
  return self.unsafeTail.foldLeft(self.unsafeGet(0), (b, s) => b + separator + s);
}

/**
 * @tsplus getter fncts.collection.immutable.Conc last
 */
export function last<A>(self: Conc<A>): Maybe<A> {
  concrete(self);
  if (isEmpty(self)) {
    return Nothing();
  }
  return Just(self.get(self.length - 1));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc map
 */
export function map_<A, B>(self: Conc<A>, f: (a: A) => B): Conc<B> {
  return self.mapWithIndex((_, a) => f(a));
}

/**
 * Statefully maps over the Conc, producing new elements of type `B`.
 *
 * @tsplus fluent fncts.collection.immutable.Conc mapAccum
 */
export function mapAccum_<A, S, B>(
  self: Conc<A>,
  s: S,
  f: (s: S, a: A) => readonly [B, S],
): readonly [Conc<B>, S] {
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
      out.append(tup[0]);
      state = tup[1];
    }
  }
  return tuple(out.result(), s);
}

function mapArrayLike<A, B>(
  as: ArrayLike<A>,
  len: number,
  startIndex: number,
  f: (i: number, a: A) => B,
): Conc<B> {
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
  constructor(
    readonly buffer: ArrayLike<A>,
    readonly bufferUsed: number,
    readonly startIndex: number,
  ) {}
}

class PrependFrame<A, B> {
  readonly _tag = "Prepend";
  constructor(readonly pre: Conc<B>, readonly end: Conc<A>) {}
}

type Frame<A, B> =
  | DoneFrame
  | ConcatLeftFrame<A>
  | ConcatRightFrame<B>
  | AppendFrame<A>
  | PrependFrame<A, B>;

/**
 * @tsplus fluent fncts.collection.immutable.Conc mapWithIndex
 */
export function mapWithIndex_<A, B>(self: Conc<A>, f: (i: number, a: A) => B): Conc<B> {
  let current = self;

  let index = 0;

  let stack: Stack<Frame<A, B>> = Stack.make(new DoneFrame());

  let result: Conc<B> = Conc.empty();

  recursion: while (stack) {
    // eslint-disable-next-line no-constant-condition
    pushing: while (true) {
      concrete<A>(current);
      switch (current._concTag) {
        case ConcTag.Singleton: {
          result = new Singleton(f(index++, current.value));
          break pushing;
        }
        case ConcTag.Empty: {
          result = _Empty;
          break pushing;
        }
        case ConcTag.Chunk: {
          result = new Chunk(current._array.mapWithIndex((i, a) => f(i + index, a)));
          index += current.length;
          break pushing;
        }
        case ConcTag.Concat: {
          stack   = Stack.make(new ConcatLeftFrame(current, index), stack);
          current = current.left;
          continue pushing;
        }
        case ConcTag.AppendN: {
          stack = Stack.make(
            new AppendFrame(current.buffer as ArrayLike<A>, current.bufferUsed, index),
            stack,
          );
          current = current.start;
          continue pushing;
        }
        case ConcTag.PrependN: {
          stack = Stack.make(
            new PrependFrame(
              mapArrayLikeReverse(
                current.buffer as ArrayLike<A>,
                current.bufferUsed,
                index + current.bufferUsed - 1,
                f,
              ),
              current.end,
            ),
            stack,
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
      const top = stack.value;
      stack     = stack.previous!;
      switch (top._tag) {
        case "Done": {
          return result;
        }
        case "ConcatLeft": {
          current = top.conc.right;
          stack   = Stack.make(new ConcatRightFrame(result), stack);
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
          stack   = Stack.make(new ConcatRightFrame(top.pre), stack);
          continue recursion;
        }
      }
    }
  }
  throw new Error("bug");
}

/**
 * @tsplus getter fncts.collection.immutable.Conc isEmpty
 */
export function isEmpty<A>(self: Conc<A>): boolean {
  concrete(self);
  return self.length === 0;
}

/**
 * @tsplus getter fncts.collection.immutable.Conc isNonEmpty
 */
export function isNonEmpty<A>(conc: Conc<A>): boolean {
  return !isEmpty(conc);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc partition
 */
export function partition_<A, B extends A>(
  self: Conc<A>,
  p: Refinement<A, B>,
): readonly [Conc<A>, Conc<B>];
export function partition_<A>(self: Conc<A>, p: Predicate<A>): readonly [Conc<A>, Conc<A>];
export function partition_<A>(self: Conc<A>, p: Predicate<A>): readonly [Conc<A>, Conc<A>] {
  return self.partitionWithIndex((_, a) => p(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc partitionMap
 */
export function partitionMap_<A, B, C>(
  self: Conc<A>,
  f: (a: A) => Either<B, C>,
): readonly [Conc<B>, Conc<C>] {
  return self.partitionMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc partitionMapWithIndex
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
 * @tsplus fluent fncts.collection.immutable.Conc partitionWithIndex
 */
export function partitionWithIndex_<A, B extends A>(
  self: Conc<A>,
  p: RefinementWithIndex<number, A, B>,
): readonly [Conc<A>, Conc<B>];
export function partitionWithIndex_<A>(
  self: Conc<A>,
  p: PredicateWithIndex<number, A>,
): readonly [Conc<A>, Conc<A>];
export function partitionWithIndex_<A>(
  self: Conc<A>,
  p: PredicateWithIndex<number, A>,
): readonly [Conc<A>, Conc<A>] {
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
 * @tsplus fluent fncts.collection.immutable.Conc prepend
 */
export function prepend_<A, B>(self: Conc<A>, a: B): Conc<A | B> {
  concrete(self);
  return self.prepend(a);
}

/**
 * @tsplus getter fncts.collection.immutable.Conc reverse
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
 * @tsplus getter fncts.collection.immutable.Conc separate
 */
export function separate<E, A>(self: Conc<Either<E, A>>): readonly [Conc<E>, Conc<A>] {
  return self.partitionMap(identity);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc splitAt
 */
export function splitAt_<A>(self: Conc<A>, n: number): readonly [Conc<A>, Conc<A>] {
  return [self.take(n), self.drop(n)];
}

/**
 * Splits this Conc on the first element that matches this predicate.
 *
 * @tsplus fluent fncts.collection.immutable.Conc splitWhere
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
 * @tsplus getter fncts.collection.immutable.Conc tail
 */
export function tail<A>(conc: Conc<A>): Maybe<Conc<A>> {
  if (conc.isEmpty) {
    return Nothing();
  }
  return Just(conc.drop(1));
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc take
 */
export function take_<A>(self: Conc<A>, n: number): Conc<A> {
  concrete(self);
  return self.take(n);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc takeWhile
 */
export function takeWhile_<A>(self: Conc<A>, p: Predicate<A>): Conc<A> {
  concrete(self);
  switch (self._concTag) {
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

export const traverse_: P.traverse_<ConcF> = (A) => (ta, f) =>
  traverseWithIndex_(A)(ta, (_, a) => f(a));

/**
 * @tsplus getter fncts.collection.immutable.Conc traverse
 */
export const traverseSelf: P.traverseSelf<ConcF> = (ta) => (A) => (f) =>
  traverseWithIndex_(A)(ta, (_, a) => f(a));

export const traverseWithIndex_: P.traverseWithIndex_<ConcF> = P.mkTraverseWithIndex_<ConcF>()(
  (_) => (A) => (ta, f) =>
    ta.foldLeftWithIndex(A.pure(Conc.empty()), (i, fbs, a) =>
      A.zipWith_(fbs, f(i, a), (bs, b) => bs.append(b)),
    ),
);

/**
 * @tsplus getter fncts.collection.immutable.Conc traverseWithIndex
 */
export const traverseSelfWithIndex: P.traverseWithIndexSelf<ConcF> = (ta) => (A) => (f) =>
  traverseWithIndex_(A)(ta, f);

/**
 * @tsplus fluent fncts.collection.immutable.ConcOps unfold
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
 * @tsplus fluent fncts.collection.immutable.Conc unsafeGet
 * @tsplus index fncts.collection.immutable.Conc
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
 * @tsplus getter fncts.collection.immutable.Conc unsafeHead
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
 * @tsplus getter fncts.collection.immutable.Conc unsafeTail
 */
export function unsafeTail<A>(self: Conc<A>): Conc<A> {
  if (self.length === 0) {
    throw new ArrayIndexOutOfBoundsError("Chunk.unsafeTail access to 1");
  }
  return self.drop(1);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc unsafeUpdateAt
 */
export function unsafeUpdateAt_<A, A1>(self: Conc<A>, i: number, a: A1): Conc<A | A1> {
  concrete(self);
  return self.update(i, a);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc updateAt
 */
export function updateAt_<A, A1>(self: Conc<A>, i: number, a: A1): Maybe<Conc<A | A1>> {
  try {
    return Just(self.unsafeUpdateAt(i, a));
  } catch {
    return Nothing();
  }
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc zip
 */
export function zip_<A, B>(self: Conc<A>, fb: Conc<B>): Conc<readonly [A, B]> {
  return self.zipWith(fb, tuple);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc zipWith
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
 * @tsplus getter fncts.collection.immutable.Conc zipWithIndex
 */
export function zipWithIndex<A>(self: Conc<A>): Conc<readonly [A, number]> {
  return self.zipWithIndexOffset(0);
}

/**
 * @tsplus fluent fncts.collection.immutable.Conc zipWithIndexOffset
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

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst align_
 */
export function align<B>(fb: Conc<B>) {
  return <A>(self: Conc<A>): Conc<These<A, B>> => align_(self, fb);
}
/**
 * @tsplus dataFirst alignWith_
 */
export function alignWith<A, B, C>(fb: Conc<B>, f: (_: These<A, B>) => C) {
  return (self: Conc<A>): Conc<C> => alignWith_(self, fb, f);
}
/**
 * @tsplus dataFirst append_
 */
export function append<A2>(a: A2) {
  return <A1>(self: Conc<A1>): Conc<A1 | A2> => append_(self, a);
}
/**
 * @tsplus dataFirst chain_
 */
export function chain<A, B>(f: (a: A) => Conc<B>) {
  return (ma: Conc<A>): Conc<B> => chain_(ma, f);
}
/**
 * @tsplus dataFirst chop_
 */
export function chop<A, B>(f: (as: Conc<A>) => readonly [B, Conc<A>]) {
  return (self: Conc<A>): Conc<B> => chop_(self, f);
}
/**
 * @tsplus dataFirst chunksOf_
 */
export function chunksOf(n: number) {
  return <A>(self: Conc<A>): Conc<Conc<A>> => chunksOf_(self, n);
}
/**
 * Transforms all elements of the Conc for as long as the specified partial function is defined.
 * @tsplus dataFirst collectWhile_
 */
export function collectWhile<A, B>(f: (a: A) => Maybe<B>) {
  return (as: Conc<A>): Conc<B> => collectWhile_(as, f);
}
/**
 * @tsplus dataFirst concat_
 */
export function concat<B>(that: Conc<B>) {
  return <A>(self: Conc<A>): Conc<A | B> => concat_(self, that);
}
/**
 * @tsplus dataFirst exists_
 */
export function exists<A>(predicate: Predicate<A>) {
  return (as: Conc<A>): boolean => exists_(as, predicate);
}
/**
 * @tsplus dataFirst drop_
 */
export function drop(n: number) {
  return <A>(self: Conc<A>): Conc<A> => drop_(self, n);
}
/**
 * @tsplus dataFirst dropWhile_
 */
export function dropWhile<A>(p: Predicate<A>) {
  return (self: Conc<A>): Conc<A> => dropWhile_(self, p);
}
/**
 * @tsplus dataFirst filter_
 */
export function filter<A, B extends A>(p: Refinement<A, B>): (self: Conc<A>) => Conc<B>;
/**
 * @tsplus dataFirst filter_
 */
export function filter<A>(p: Predicate<A>): (self: Conc<A>) => Conc<A>;
/**
 * @tsplus dataFirst filter_
 */
export function filter<A>(p: Predicate<A>) {
  return (self: Conc<A>): Conc<A> => filter_(self, p);
}
/**
 * @tsplus dataFirst filterMap_
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: Conc<A>): Conc<B> => filterMap_(self, f);
}
/**
 * @tsplus dataFirst filterMapWithIndex_
 */
export function filterMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (self: Conc<A>): Conc<B> => filterMapWithIndex_(self, f);
}
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: Conc<A>) => Conc<B>;
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>): (self: Conc<A>) => Conc<A>;
/**
 * @tsplus dataFirst filterWithIndex_
 */
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: Conc<A>): Conc<A> => filterWithIndex_(self, p);
}
/**
 * @tsplus dataFirst find_
 */
export function find<A>(f: (a: A) => boolean) {
  return (self: Conc<A>): Maybe<A> => find_(self, f);
}
/**
 * Folds over the elements in this Conc from the left.
 * Stops the fold early when the condition is not fulfilled.
 * @tsplus dataFirst foldLeftWhile_
 */
export function foldLeftWhile<A, B>(b: B, p: Predicate<B>, f: (b: B, a: A) => B) {
  return (as: Conc<A>): B => foldLeftWhile_(as, b, p, f);
}
/**
 * @tsplus dataFirst foldLeft_
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: Conc<A>): B => foldLeft_(self, b, f);
}
/**
 * @tsplus dataFirst foldLeftWithIndex_
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: Conc<A>): B => foldLeftWithIndex_(self, b, f);
}
/**
 * @tsplus dataFirst foldRight_
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (fa: Conc<A>): B => foldRight_(fa, b, f);
}
/**
 * @tsplus dataFirst foldRightWithIndex_
 */
export function foldRightWithIndex<A, B>(b: B, f: (i: number, a: A, b: B) => B) {
  return (self: Conc<A>): B => foldRightWithIndex_(self, b, f);
}
/**
 * @tsplus dataFirst forEach_
 */
export function forEach<A, B>(f: (a: A) => B) {
  return (self: Conc<A>): void => forEach_(self, f);
}
/**
 * @tsplus dataFirst forEachWithIndex_
 */
export function forEachWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: Conc<A>): void => forEachWithIndex_(self, f);
}
/**
 * @tsplus dataFirst get_
 */
export function get(n: number) {
  return <A>(as: Conc<A>): Maybe<A> => get_(as, n);
}
/**
 * @tsplus dataFirst join_
 */
export function join(separator: string) {
  return (self: Conc<string>): string => join_(self, separator);
}
/**
 * @tsplus dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Conc<A>): Conc<B> => map_(self, f);
}
/**
 * Statefully maps over the Conc, producing new elements of type `B`.
 * @tsplus dataFirst mapAccum_
 */
export function mapAccum<A, S, B>(s: S, f: (s: S, a: A) => readonly [B, S]) {
  return (self: Conc<A>): readonly [Conc<B>, S] => mapAccum_(self, s, f);
}
/**
 * @tsplus dataFirst mapWithIndex_
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: Conc<A>): Conc<B> => mapWithIndex_(self, f);
}
/**
 * @tsplus dataFirst partition_
 */
export function partition<A, B extends A>(
  p: Refinement<A, B>,
): (self: Conc<A>) => readonly [Conc<A>, Conc<B>];
/**
 * @tsplus dataFirst partition_
 */
export function partition<A>(p: Predicate<A>): (self: Conc<A>) => readonly [Conc<A>, Conc<A>];
/**
 * @tsplus dataFirst partition_
 */
export function partition<A>(p: Predicate<A>) {
  return (self: Conc<A>): readonly [Conc<A>, Conc<A>] => partition_(self, p);
}
/**
 * @tsplus dataFirst partitionMap_
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: Conc<A>): readonly [Conc<B>, Conc<C>] => partitionMap_(self, f);
}
/**
 * @tsplus dataFirst partitionMapWithIndex_
 */
export function partitionMapWithIndex<A, B, C>(f: (i: number, a: A) => Either<B, C>) {
  return (fa: Conc<A>): readonly [Conc<B>, Conc<C>] => partitionMapWithIndex_(fa, f);
}
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: Conc<A>) => readonly [Conc<A>, Conc<B>];
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A>(
  p: PredicateWithIndex<number, A>,
): (self: Conc<A>) => readonly [Conc<A>, Conc<A>];
/**
 * @tsplus dataFirst partitionWithIndex_
 */
export function partitionWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: Conc<A>): readonly [Conc<A>, Conc<A>] => partitionWithIndex_(self, p);
}
/**
 * @tsplus dataFirst prepend_
 */
export function prepend<A>(a: A) {
  return (self: Conc<A>): Conc<A> => prepend_(self, a);
}
/**
 * @tsplus dataFirst splitAt_
 */
export function splitAt(n: number) {
  return <A>(self: Conc<A>): readonly [Conc<A>, Conc<A>] => splitAt_(self, n);
}
/**
 * Splits this Conc on the first element that matches this predicate.
 * @tsplus dataFirst splitWhere_
 */
export function splitWhere<A>(f: (a: A) => boolean) {
  return (self: Conc<A>): readonly [Conc<A>, Conc<A>] => splitWhere_(self, f);
}
/**
 * @tsplus dataFirst take_
 */
export function take(n: number) {
  return <A>(self: Conc<A>): Conc<A> => take_(self, n);
}
/**
 * @tsplus dataFirst takeWhile_
 */
export function takeWhile<A>(p: Predicate<A>) {
  return (self: Conc<A>): Conc<A> => takeWhile_(self, p);
}
/**
 * @tsplus dataFirst unsafeGet_
 */
export function unsafeGet(n: number) {
  return <A>(self: Conc<A>): A => unsafeGet_(self, n);
}
/**
 * @tsplus dataFirst unsafeUpdateAt_
 */
export function unsafeUpdateAt<A1>(i: number, a: A1) {
  return <A>(self: Conc<A>): Conc<A | A1> => unsafeUpdateAt_(self, i, a);
}
/**
 * @tsplus dataFirst updateAt_
 */
export function updateAt<A1>(i: number, a: A1) {
  return <A>(self: Conc<A>): Maybe<Conc<A | A1>> => updateAt_(self, i, a);
}
/**
 * @tsplus dataFirst zip_
 */
export function zip<B>(fb: Conc<B>) {
  return <A>(self: Conc<A>): Conc<readonly [A, B]> => zip_(self, fb);
}
/**
 * @tsplus dataFirst zipWith_
 */
export function zipWith<A, B, C>(fb: Conc<B>, f: (a: A, b: B) => C) {
  return (self: Conc<A>): Conc<C> => zipWith_(self, fb, f);
}
/**
 * @tsplus dataFirst zipWithIndexOffset_
 */
export function zipWithIndexOffset(offset: number) {
  return <A>(as: Conc<A>): Conc<readonly [A, number]> => zipWithIndexOffset_(as, offset);
}
/**
 * @constrained
 * @tsplus dataFirst foldMap_
 */
export function foldMap<M>(M: P.Monoid<M>) {
  return <A>(f: (a: A) => M) =>
    (fa: Conc<A>) =>
      foldMap_(M)(fa, f);
}
/**
 * @constrained
 * @tsplus dataFirst foldMapWithIndex_
 */
export function foldMapWithIndex<M>(M: P.Monoid<M>) {
  return <A>(f: (i: number, a: A) => M) =>
    (fa: Conc<A>) =>
      foldMapWithIndex_(M)(fa, f);
}
// codegen:end
