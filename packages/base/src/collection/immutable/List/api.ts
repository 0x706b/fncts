/*
 * This file contains software ported from:
 *
 * Scala (https://www.scala-lang.org)
 *
 * Copyright EPFL and Lightbend, Inc.
 *
 * Licensed under Apache License 2.0
 * (http://www.apache.org/licenses/LICENSE-2.0).
 *
 * See the doc/LICENSE.md file in the root of this source tree
 * for more information regarding copyright ownership
 */

import type * as P from "@fncts/base/typeclass";

import { _Nil } from "@fncts/base/collection/immutable/List/definition";
import { ListBuffer } from "@fncts/base/collection/mutable/ListBuffer";

/**
 * @tsplus pipeable fncts.List flatMap
 */
export function flatMap<A, B>(f: (a: A) => List<B>) {
  return (self: List<A>): List<B> => {
    let rest = self;
    let h: Cons<B> | undefined;
    let t: Cons<B> | undefined;
    while (!rest.isEmpty()) {
      let bs = f(rest.head);
      while (!bs.isEmpty()) {
        const nx = new Cons(bs.head, _Nil);
        if (t === undefined) {
          h = nx;
        } else {
          t.tail = nx;
        }
        t  = nx;
        bs = bs.tail;
      }
      rest = rest.tail;
    }
    if (h === undefined) return _Nil;
    else return h;
  };
}

/**
 * @tsplus pipeable fncts.List concat
 */
export function concat<B>(that: List<B>) {
  return <A>(self: List<A>): List<A | B> => {
    return that.prependAll(self);
  };
}

/**
 * @tsplus pipeable fncts.List some
 */
export function some<A>(p: Predicate<A>) {
  return (self: List<A>): boolean => {
    let these = self;
    while (!these.isEmpty()) {
      if (p(these.head)) {
        return true;
      }
      these = these.tail;
    }
    return false;
  };
}

/**
 * @tsplus pipeable fncts.List filter
 */
export function filter<A, B extends A>(p: Refinement<A, B>): (self: List<A>) => List<B>;
export function filter<A>(p: Predicate<A>): (self: List<A>) => List<A>;
export function filter<A>(p: Predicate<A>) {
  return (self: List<A>): List<A> => {
    return filterCommon(self, p, false);
  };
}

function noneIn<A>(l: List<A>, p: Predicate<A>, isFlipped: boolean): List<A> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (l.isEmpty()) {
      return Nil();
    } else {
      if (p(l.head) !== isFlipped) {
        return allIn(l, l.tail, p, isFlipped);
      } else {
        // eslint-disable-next-line no-param-reassign
        l = l.tail;
      }
    }
  }
}

function allIn<A>(start: List<A>, remaining: List<A>, p: Predicate<A>, isFlipped: boolean): List<A> {
  while (true) {
    if (remaining.isEmpty()) {
      return start;
    } else {
      if (p(remaining.head) !== isFlipped) {
        // eslint-disable-next-line no-param-reassign
        remaining = remaining.tail;
      } else {
        return partialFill(start, remaining, p, isFlipped);
      }
    }
  }
}

function partialFill<A>(origStart: List<A>, firstMiss: List<A>, p: Predicate<A>, isFlipped: boolean): List<A> {
  const newHead   = new Cons(unsafeHead(origStart), _Nil);
  let toProcess   = origStart.unsafeTail as Cons<A>;
  let currentLast = newHead;
  while (!(toProcess === firstMiss)) {
    const newElem    = Cons(unsafeHead(toProcess), _Nil);
    currentLast.tail = newElem;
    currentLast      = newElem;
    toProcess        = unsafeCoerce(toProcess.tail);
  }
  let next                = firstMiss.tail;
  let nextToCopy: Cons<A> = unsafeCoerce(next);
  while (!next.isEmpty()) {
    const head = unsafeHead(next);
    if (p(head) !== isFlipped) {
      next = next.tail;
    } else {
      while (!(nextToCopy === next)) {
        const newElem    = new Cons(unsafeHead(nextToCopy), _Nil);
        currentLast.tail = newElem;
        currentLast      = newElem;
        nextToCopy       = unsafeCoerce(nextToCopy.tail);
      }
      nextToCopy = unsafeCoerce(next.tail);
      next       = next.tail;
    }
  }

  if (!nextToCopy.isEmpty()) {
    currentLast.tail = nextToCopy;
  }

  return newHead;
}

function filterCommon<A>(list: List<A>, p: Predicate<A>, isFlipped: boolean): List<A> {
  return noneIn(list, p, isFlipped);
}

/**
 * @tsplus pipeable fncts.List forEach
 */
export function forEach<A, U>(f: (a: A) => U) {
  return (self: List<A>): void => {
    let these = self;
    while (!these.isEmpty()) {
      f(these.head);
      these = these.tail;
    }
  };
}

/**
 * @tsplus getter fncts.List head
 */
export function head<A>(self: List<A>): Maybe<A> {
  return self.isEmpty() ? Nothing() : Just(self.head);
}

/**
 * @tsplus pipeable fncts.List join
 */
export function join(separator: string) {
  return (self: List<string>): string => {
    if (self.isEmpty()) {
      return "";
    }
    return self.unsafeTail.foldLeft(self.unsafeHead, (acc, s) => acc + separator + s);
  };
}

/**
 * @tsplus getter fncts.List length
 */
export function length<A>(list: List<A>): number {
  let these = list;
  let len   = 0;
  while (!these.isEmpty()) {
    len  += 1;
    these = these.tail;
  }
  return len;
}

/**
 * @tsplus pipeable fncts.List map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: List<A>): List<B> => {
    if (self.isEmpty()) {
      return self as unknown as List<B>;
    } else {
      const h        = new Cons(f(self.head), _Nil);
      let t: Cons<B> = h;
      let rest       = self.tail;
      while (!rest.isEmpty()) {
        const nx = new Cons(f(rest.head), _Nil);
        t.tail   = nx;
        t        = nx;
        rest     = rest.tail;
      }
      return h;
    }
  };
}

/**
 * @tsplus pipeable fncts.List prepend
 */
export function prepend<B>(elem: B) {
  return <A>(self: List<A>): List<A | B> => {
    return new Cons<A | B>(elem, self);
  };
}

/**
 * @tsplus operator fncts.List +
 */
export function prependOperator<A, B>(elem: A, self: List<B>): List<A | B> {
  return new Cons<A | B>(elem, self);
}

/**
 * @tsplus pipeable fncts.List prependAll
 */
export function prependAll<B>(prefix: List<B>) {
  return <A>(self: List<A>): List<A | B> => {
    if (self.isEmpty()) {
      return prefix;
    } else if (prefix.isEmpty()) {
      return self;
    } else {
      const result = new Cons<A | B>(prefix.head, self);
      let curr     = result;
      let that     = prefix.tail;
      while (!that.isEmpty()) {
        const temp = new Cons<A | B>(that.head, self);
        curr.tail  = temp;
        curr       = temp;
        that       = that.tail;
      }
      return result;
    }
  };
}

/**
 * @tsplus getter fncts.List reverse
 */
export function reverse<A>(self: List<A>): List<A> {
  let result: List<A> = Nil();
  let these           = self;
  while (!these.isEmpty()) {
    result = result.prepend(these.head);
    these  = these.tail;
  }
  return result;
}

/**
 * @tsplus pipeable fncts.List sort
 */
export function sort<A>(/** @tsplus auto */ O: P.Ord<A>) {
  return (self: List<A>): List<A> => {
    return self.sortWith((x, y) => O.compare(y)(x));
  };
}

/**
 * @tsplus pipeable fncts.List sortWith
 */
export function sortWith<A>(compare: (x: A, y: A) => P.Ordering) {
  return (self: List<A>): List<A> => {
    const len = length(self);
    const b   = new ListBuffer<A>();
    if (len === 1) {
      b.append(unsafeHead(self));
    } else if (len > 1) {
      const arr = new Array<[number, A]>(len);
      copyToArrayWithIndex(self, arr);
      arr.sort(([i, x], [j, y]) => {
        const c = compare(x, y);
        return c !== 0 ? c : i < j ? -1 : 1;
      });
      for (let i = 0; i < len; i++) {
        b.append(arr[i]![1]!);
      }
    }
    return b.toList;
  };
}

/**
 * @tsplus getter fncts.List tail
 */
export function tail<A>(self: List<A>): Maybe<List<A>> {
  return self.isEmpty() ? Nothing() : Just(self.tail);
}

/**
 * @tsplus pipeable fncts.List take
 */
export function take(n: number) {
  return <A>(self: List<A>): List<A> => {
    if (self.isEmpty() || n <= 0) {
      return _Nil;
    } else {
      const h  = new Cons(self.head, _Nil);
      let t    = h;
      let rest = self.tail;
      let i    = 1;
      while (i < n) {
        if (rest.isEmpty()) {
          return self;
        }
        i       += 1;
        const nx = new Cons(rest.head, _Nil);
        t.tail   = nx;
        t        = nx;
        rest     = rest.tail;
      }
      return h;
    }
  };
}

/**
 * @tsplus getter fncts.List unsafeHead
 */
export function unsafeHead<A>(self: List<A>): A {
  if (self.isEmpty()) {
    throw new NoSuchElementError("unsafeHead on empty List");
  }
  return self.head;
}

/**
 * @tsplus getter fncts.List unsafeLast
 */
export function unsafeLast<A>(self: List<A>): A {
  if (self.isEmpty()) {
    throw new NoSuchElementError("unsafeLast on empty List");
  }
  let these = self;
  let scout = self.tail;
  while (!scout.isEmpty()) {
    these = scout;
    scout = scout.tail;
  }
  return these.head;
}

function copyToArrayWithIndex<A>(list: List<A>, arr: Array<[number, A]>): void {
  let these = list;
  let i     = 0;
  while (!these.isEmpty()) {
    arr[i] = [i, these.head];
    these  = these.tail;
    i++;
  }
}
