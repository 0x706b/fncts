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

export const ListTypeId = Symbol.for("fncts.List");
export type ListTypeId = typeof ListTypeId;

/**
 * @tsplus type fncts.List.Cons
 * @tsplus companion fncts.ConsOps
 */
export class Cons<A> implements Iterable<A> {
  readonly _tag                     = "Cons";
  readonly [ListTypeId]: ListTypeId = ListTypeId;
  constructor(
    readonly head: A,
    public tail: List<A> = _Nil,
  ) {}

  [Symbol.iterator](): Iterator<A> {
    let done = false;

    let these: List<A> = this;
    return {
      next() {
        if (done) {
          return this.return!();
        }
        if (these.isEmpty()) {
          done = true;
          return this.return!();
        }
        const value: A = these.head;
        these          = these.tail;
        return { done, value };
      },
      return(value?: unknown) {
        if (!done) {
          done = true;
        }
        return { done: true, value };
      },
    };
  }
}

/**
 * @tsplus type fncts.List.Nil
 * @tsplus companion fncts.NilOps
 */
export class Nil<A> implements Iterable<A> {
  readonly _tag                     = "Nil";
  readonly [ListTypeId]: ListTypeId = ListTypeId;
  [Symbol.iterator](): Iterator<A> {
    return {
      next() {
        return { done: true, value: undefined };
      },
    };
  }
}

/**
 * @tsplus static fncts.ListOps is
 */
export function isList(u: unknown): u is List<unknown> {
  return isObject(u) && ListTypeId in u;
}

export const _Nil = new Nil<never>();

/**
 * @tsplus type fncts.List
 */
export type List<A> = Cons<A> | Nil<A>;

/**
 * @tsplus type fncts.ListOps
 */
export interface ListOps {}

export const List: ListOps = {};

/**
 * @tsplus fluent fncts.List isEmpty
 */
export function isEmpty<A>(list: List<A>): list is Nil<A> {
  return list._tag === "Nil";
}

/**
 * @tsplus fluent fncts.List isNonEmpty
 */
export function isNonEmpty<A>(list: List<A>): list is Cons<A> {
  return list._tag === "Cons";
}
