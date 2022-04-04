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

import { _Nil } from "./definition.js";

/**
 * @tsplus static fncts.ConsOps __call
 */
export function cons<A>(head: A, tail: List<A> = _Nil): Cons<A> {
  return new Cons(head, tail);
}

/**
 * @tsplus static fncts.ListOps empty
 */
export function empty<A>(): List<A> {
  return _Nil;
}

/**
 * @tsplus static fncts.ListOps from
 */
export function from<A>(prefix: Iterable<A>): List<A> {
  const iter = prefix[Symbol.iterator]();
  let a: IteratorResult<A>;
  if (!(a = iter.next()).done) {
    const result = new Cons(a.value, _Nil);
    let curr     = result;
    while (!(a = iter.next()).done) {
      const temp = new Cons(a.value, _Nil);
      curr.tail  = temp;
      curr       = temp;
    }
    return result;
  } else {
    return _Nil;
  }
}

/**
 * @tsplus static fncts.ListOps __call
 */
export function make<A>(...as: ReadonlyArray<A>): List<A> {
  return List.from(as);
}

/**
 * @tsplus static fncts.NilOps __call
 */
export function nil<A>(): Nil<A> {
  return _Nil;
}
