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
import { identity, pipe, tuple } from "@fncts/base/data/function";
import { Stack } from "@fncts/base/internal/Stack";

/**
 * @tsplus pipeable fncts.Conc align
 */
export function align<B>(fb: Conc<B>) {
  return <A>(self: Conc<A>): Conc<These<A, B>> => {
    return self.alignWith(fb, identity);
  };
}

/**
 * @tsplus pipeable fncts.Conc alignWith
 */
export function alignWith<A, B, C>(fb: Conc<B>, f: (_: These<A, B>) => C) {
  return (self: Conc<A>): Conc<C> => {
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
  };
}
/**
 * @tsplus pipeable fncts.Conc append
 */
export function append<A2>(a: A2) {
  return <A1>(self: Conc<A1>): Conc<A1 | A2> => {
    concrete(self);
    return self.append(a);
  };
}

export class ConcBuilder<A> {
  constructor(private conc: Conc<A> = Conc.empty()) {}
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
 * @tsplus pipeable fncts.Conc flatMap
 */
export function flatMap<A, B>(f: (a: A) => Conc<B>) {
  return (ma: Conc<A>): Conc<B> => {
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
  };
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
 * @tsplus pipeable fncts.Conc chop
 */
export function chop<A, B>(f: (as: Conc<A>) => readonly [B, Conc<A>]) {
  return (self: Conc<A>): Conc<B> => {
    const out       = builder<B>();
    let cs: Conc<A> = self;
    while (cs.isNonEmpty) {
      const [b, c] = f(cs);
      out.append(b);
      cs = c;
    }
    return out.result();
  };
}

/**
 * @tsplus pipeable fncts.Conc chunksOf
 */
export function chunksOf(n: number) {
  return <A>(self: Conc<A>): Conc<Conc<A>> => {
    return self.chop((as) => as.splitAt(n));
  };
}

/**
 * Transforms all elements of the Conc for as long as the specified partial function is defined.
 *
 * @tsplus pipeable fncts.Conc collectWhile
 */
export function collectWhile<A, B>(f: (a: A) => Maybe<B>) {
  return (as: Conc<A>): Conc<B> => {
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
        return (as.materialize() as Conc<A>).collectWhile(f);
      }
    }
  };
}

/**
 * @tsplus getter fncts.Conc compact
 */
export function compact<A>(self: Conc<Maybe<A>>): Conc<A> {
  return self.filterMap(identity);
}

/**
 * @tsplus pipeable fncts.Conc concat
 */
export function concat<B>(that: Conc<B>) {
  return <A>(self: Conc<A>): Conc<A | B> => {
    concrete(self);
    concrete(that);
    return self.concat(that);
  };
}

/**
 * @tsplus pipeable fncts.Conc elem
 */
export function elem<A>(a: A, /** @tsplus auto */ E: Eq<A>) {
  return (self: Conc<A>): boolean => {
    return self.some((el) => E.equals(a)(el));
  };
}

/**
 * @tsplus pipeable fncts.Conc some
 */
export function some<A>(predicate: Predicate<A>) {
  return (as: Conc<A>): boolean => {
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
  };
}

/**
 * @tsplus pipeable fncts.Conc drop
 */
export function drop(n: number) {
  return <A>(self: Conc<A>): Conc<A> => {
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
  };
}

/**
 * @tsplus pipeable fncts.Conc dropUntil
 */
export function dropUntil<A>(p: Predicate<A>) {
  return (self: Conc<A>): Conc<A> => {
    let cont = true;
    let i    = 0;
    for (const elem of self) {
      if (!cont) {
        break;
      }
      i++;
      cont = !p(elem);
    }
    return self.drop(i);
  };
}

/**
 * @tsplus pipeable fncts.Conc dropWhile
 */
export function dropWhile<A>(p: Predicate<A>) {
  return (self: Conc<A>): Conc<A> => {
    concrete(self);
    switch (self._tag) {
      case ConcTag.Chunk: {
        const arr = self.arrayLike();
        let i     = 0;
        while (i < arr.length && p(arr[i]!)) {
          i++;
        }
        return (self as Conc<A>).drop(i);
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
        return (self as Conc<A>).drop(i);
      }
    }
  };
}

/**
 * @tsplus pipeable fncts.Conc filter
 */
export function filter<A, B extends A>(p: Refinement<A, B>): (self: Conc<A>) => Conc<B>;
export function filter<A>(p: Predicate<A>): (self: Conc<A>) => Conc<A>;
export function filter<A>(p: Predicate<A>) {
  return (self: Conc<A>): Conc<A> => {
    return self.filterWithIndex((_, a) => p(a));
  };
}

/**
 * @tsplus pipeable fncts.Conc filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: Conc<A>): Conc<B> => {
    return self.filterMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.Conc filterMapWithIndex
 */
export function filterMapWithIndex<A, B>(f: (i: number, a: A) => Maybe<B>) {
  return (self: Conc<A>): Conc<B> => {
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
  };
}

/**
 * @tsplus pipeable fncts.Conc filterWithIndex
 */
export function filterWithIndex<A, B extends A>(p: RefinementWithIndex<number, A, B>): (self: Conc<A>) => Conc<B>;
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>): (self: Conc<A>) => Conc<A>;
export function filterWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: Conc<A>): Conc<A> => {
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
  };
}

/**
 * @tsplus pipeable fncts.Conc find
 */
export function find<A>(f: (a: A) => boolean) {
  return (self: Conc<A>): Maybe<A> => {
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
  };
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
 * @tsplus pipeable fncts.Conc foldLeftWhile
 */
export function foldLeftWhile<A, B>(b: B, p: Predicate<B>, f: (b: B, a: A) => B) {
  return (as: Conc<A>): B => {
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
  };
}

/**
 * @tsplus pipeable fncts.Conc foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: Conc<A>): B => {
    return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.Conc foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: Conc<A>): B => {
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
  };
}

/**
 * @tsplus pipeable fncts.Conc foldMap
 */
export function foldMap<A, M>(f: (a: A) => M, /** @tsplus auto */ M: P.Monoid<M>) {
  return (fa: Conc<A>): M => {
    return fa.foldMapWithIndex((_, a) => f(a), M);
  };
}

/**
 * @tsplus pipeable fncts.Conc foldMapWithIndex
 */
export function foldMapWithIndex<A, M>(f: (i: number, a: A) => M, /** @tsplus auto */ M: P.Monoid<M>) {
  return (fa: Conc<A>): M => {
    return fa.foldLeftWithIndex(M.nat, (i, b, a) => M.combine(f(i, a))(b));
  };
}

/**
 * @tsplus pipeable fncts.Conc foldRight
 */
export function foldRight<A, B>(b: B, f: (a: A, b: B) => B) {
  return (fa: Conc<A>): B => {
    return fa.foldRightWithIndex(b, (_, a, b) => f(a, b));
  };
}

/**
 * @tsplus pipeable fncts.Conc foldRightWithIndex
 */
export function foldRightWithIndex<A, B>(b: B, f: (i: number, a: A, b: B) => B) {
  return (self: Conc<A>): B => {
    concrete(self);
    const iterator = self.reverseArrayIterator();
    let out        = b;
    let result: IteratorResult<ArrayLike<A>>;
    let i          = self.length - 1;
    while (!(result = iterator.next()).done) {
      const array = result.value;
      for (let j = array.length - 1; j >= 0; j--) {
        out = f(i, array[j]!, out);
        i--;
      }
    }
    return out;
  };
}

/**
 * @tsplus pipeable fncts.Conc forEach
 */
export function forEach<A, B>(f: (a: A) => B) {
  return (self: Conc<A>): void => {
    concrete(self);
    return self.forEach(0, (_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.Conc forEachWithIndex
 */
export function forEachWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: Conc<A>): void => {
    concrete(self);
    self.forEach(0, f);
  };
}

/**
 * @tsplus pipeable fncts.Conc get
 */
export function get(n: number) {
  return <A>(as: Conc<A>): Maybe<A> => {
    return Maybe.tryCatch(() => as[n]);
  };
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
 * @tsplus pipeable fncts.Conc join
 */
export function join(separator: string) {
  return (self: Conc<string>): string => {
    if (self.length === 0) {
      return "";
    }
    return self.unsafeTail.foldLeft(self.unsafeGet(0), (b, s) => b + separator + s);
  };
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
 * @tsplus pipeable fncts.Conc map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Conc<A>): Conc<B> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * Statefully maps over the Conc, producing new elements of type `B`.
 *
 * @tsplus pipeable fncts.Conc mapAccum
 */
export function mapAccum<A, S, B>(s: S, f: (s: S, a: A) => readonly [S, B]) {
  return (self: Conc<A>): readonly [S, Conc<B>] => {
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
    return tuple(state, out.result());
  };
}

function mapArrayLike<A, B>(as: ArrayLike<A>, len: number, startIndex: number, f: (i: number, a: A) => B): Conc<B> {
  let bs = Conc.empty<B>();
  for (let i = 0; i < len; i++) {
    bs = bs.append(f(i + startIndex, as[i]!));
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
    bs = bs.append(f(endIndex - j, as[i]!));
  }
  return bs;
}

class DoneFrame {
  readonly _tag = "Done";
}

class ConcatLeftFrame<A> {
  readonly _tag = "ConcatLeft";

  constructor(
    readonly conc: Concat<A>,
    readonly currentIndex: number,
  ) {}
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
  constructor(
    readonly pre: Conc<B>,
    readonly end: Conc<A>,
  ) {}
}

type Frame<A, B> = DoneFrame | ConcatLeftFrame<A> | ConcatRightFrame<B> | AppendFrame<A> | PrependFrame<A, B>;

/**
 * @tsplus pipeable fncts.Conc mapWithIndex
 */
export function mapWithIndex<A, B>(f: (i: number, a: A) => B) {
  return (self: Conc<A>): Conc<B> => {
    let current = self;
    let index   = 0;
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
              r = r.append(f(i + index, current.get(i)));
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
            result = top.leftResult.concat(result);
            continue popping;
          }
          case "Append": {
            result = result.concat(mapArrayLike(top.buffer, top.bufferUsed, index, f));
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
  };
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
 * @tsplus pipeable fncts.Conc partition
 */
export function partition<A, B extends A>(p: Refinement<A, B>): (self: Conc<A>) => readonly [Conc<A>, Conc<B>];
export function partition<A>(p: Predicate<A>): (self: Conc<A>) => readonly [Conc<A>, Conc<A>];
export function partition<A>(p: Predicate<A>) {
  return (self: Conc<A>): readonly [Conc<A>, Conc<A>] => {
    return self.partitionWithIndex((_, a) => p(a));
  };
}

/**
 * @tsplus pipeable fncts.Conc partitionMap
 */
export function partitionMap<A, B, C>(f: (a: A) => Either<B, C>) {
  return (self: Conc<A>): readonly [Conc<B>, Conc<C>] => {
    return self.partitionMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.Conc partitionMapWithIndex
 */
export function partitionMapWithIndex<A, B, C>(f: (i: number, a: A) => Either<B, C>) {
  return (fa: Conc<A>): readonly [Conc<B>, Conc<C>] => {
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
  };
}

/**
 * @tsplus pipeable fncts.Conc partitionWithIndex
 */
export function partitionWithIndex<A, B extends A>(
  p: RefinementWithIndex<number, A, B>,
): (self: Conc<A>) => readonly [Conc<A>, Conc<B>];
export function partitionWithIndex<A>(p: PredicateWithIndex<number, A>): (self: Conc<A>) => readonly [Conc<A>, Conc<A>];
export function partitionWithIndex<A>(p: PredicateWithIndex<number, A>) {
  return (self: Conc<A>): readonly [Conc<A>, Conc<A>] => {
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
  };
}

/**
 * @tsplus pipeable fncts.Conc prepend
 */
export function prepend<B>(a: B) {
  return <A>(self: Conc<A>): Conc<A | B> => {
    concrete(self);
    return self.prepend(a);
  };
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
 * @tsplus pipeable fncts.Conc slice
 */
export function slice(from: number, to: number) {
  return <A>(self: Conc<A>): Conc<A> => {
    concrete(self);
    const start = from < 0 ? 0 : from > self.length ? self.length : from;
    const end   = to < start ? start : to > self.length ? self.length : to;
    return new Slice(self, start, end - start);
  };
}

/**
 * @tsplus pipeable fncts.Conc splitAt
 */
export function splitAt(n: number) {
  return <A>(self: Conc<A>): readonly [Conc<A>, Conc<A>] => {
    return [self.take(n), self.drop(n)];
  };
}

/**
 * Splits this Conc on the first element that matches this predicate.
 *
 * @tsplus pipeable fncts.Conc splitWhere
 */
export function splitWhere<A>(f: (a: A) => boolean) {
  return (self: Conc<A>): readonly [Conc<A>, Conc<A>] => {
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
    return (self as Conc<A>).splitAt(i);
  };
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
 * @tsplus pipeable fncts.Conc take
 */
export function take(n: number) {
  return <A>(self: Conc<A>): Conc<A> => {
    concrete(self);
    return self.take(n);
  };
}

/**
 * @tsplus pipeable fncts.Conc takeWhile
 */
export function takeWhile<A>(p: Predicate<A>) {
  return (self: Conc<A>): Conc<A> => {
    concrete(self);
    switch (self._tag) {
      case ConcTag.Chunk: {
        const arr = self.arrayLike();
        let i     = 0;
        while (i < arr.length && p(arr[i]!)) {
          i++;
        }
        return self.take(i);
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
        return self.take(i);
      }
    }
  };
}

export const traverse: P.Traversable<ConcF>["traverse"] = (G) => (f) => (self) => self.traverse(G)(f);

export const traverseWithIndex: P.TraversableWithIndex<ConcF>["traverseWithIndex"] = (G) => (f) => (self) =>
  self.traverseWithIndex(G)(f);

/**
 * @tsplus getter fncts.Conc traverseWithIndex
 */
export function _traverseWithIndex<A>(
  self: Conc<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Conc<B>>;
export function _traverseWithIndex<A>(
  self: Conc<A>,
): <G>(G: P.Applicative<HKT.F<G>>) => <B>(f: (i: number, a: A) => HKT.FK1<G, B>) => HKT.FK1<G, Conc<B>> {
  return (G) => (f) =>
    self.foldLeftWithIndex(G.pure(Conc.empty()), (i, fbs, a) =>
      pipe(
        fbs,
        G.zipWith(f(i, a), (bs, b) => bs.append(b)),
      ),
    );
}

/**
 * @tsplus getter fncts.Conc traverse
 */
export function _traverse<A>(
  self: Conc<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Conc<B>> {
  return (G) => (f) => self.traverseWithIndex(G)((_, a) => f(a));
}

/**
 * @tsplus getter fncts.Conc toBuffer
 */
export function toBuffer(self: Conc<Byte>): Uint8Array {
  concrete(self);
  return unsafeCoerce(self.arrayLike());
}

/**
 * @tsplus static fncts.ConcOps unfold
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
 * @tsplus pipeable fncts.Conc unsafeGet
 * @tsplus pipeable-index fncts.Conc
 */
export function unsafeGet(n: number) {
  return <A>(self: Conc<A>): A => {
    concrete(self);
    return self.get(n);
  };
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
 * @tsplus pipeable fncts.Conc unsafeUpdateAt
 */
export function unsafeUpdateAt<A1>(i: number, a: A1) {
  return <A>(self: Conc<A>): Conc<A | A1> => {
    concrete(self);
    return self.update(i, a);
  };
}

/**
 * @tsplus pipeable fncts.Conc updateAt
 */
export function updateAt<A1>(i: number, a: A1) {
  return <A>(self: Conc<A>): Maybe<Conc<A | A1>> => {
    try {
      return Just(self.unsafeUpdateAt(i, a));
    } catch {
      return Nothing();
    }
  };
}

/**
 * @tsplus pipeable fncts.Conc zip
 */
export function zip<B>(fb: Conc<B>) {
  return <A>(self: Conc<A>): Conc<readonly [A, B]> => {
    return self.zipWith(fb, tuple);
  };
}

/**
 * @tsplus pipeable fncts.Conc zipWith
 */
export function zipWith<A, B, C>(fb: Conc<B>, f: (a: A, b: B) => C) {
  return (self: Conc<A>): Conc<C> => {
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
  };
}

/**
 * @tsplus getter fncts.Conc zipWithIndex
 */
export function zipWithIndex<A>(self: Conc<A>): Conc<readonly [A, number]> {
  return self.zipWithIndexOffset(0);
}

/**
 * @tsplus pipeable fncts.Conc zipWithIndexOffset
 */
export function zipWithIndexOffset(offset: number) {
  return <A>(as: Conc<A>): Conc<readonly [A, number]> => {
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
  };
}
