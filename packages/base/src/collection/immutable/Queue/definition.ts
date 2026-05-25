/*
 * This file is ported from
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

import type { EqualsContext } from "@fncts/base/data/Equatable";

import { _Nil } from "@fncts/base/collection/immutable/List";

export const QueueTypeId = Symbol.for("fncts.Queue");
export type QueueTypeId = typeof QueueTypeId;

/**
 * @tsplus static fncts.ImmutableQueueOps is
 */
export function isQueue(u: unknown): u is Queue<unknown> {
  return isObject(u) && QueueTypeId in u;
}

/**
 * @tsplus type fncts.ImmutableQueue
 * @tsplus companion fncts.ImmutableQueueOps
 */
export class Queue<A> implements Iterable<A>, Equatable {
  readonly [QueueTypeId]: QueueTypeId = QueueTypeId;

  constructor(
    /* @internal */
    public _in: List<A>,
    /* @internal */
    public _out: List<A>,
  ) {}

  [Symbol.equals](that: unknown, context: EqualsContext): boolean {
    return isQueue(that) && this.toIterable.corresponds(that.toIterable, context.comparator);
  }

  [Symbol.iterator]() {
    return this._out.concat(this._in.reverse)[Symbol.iterator]();
  }
}

export const EmptyQueue: Queue<never> = new Queue(_Nil, _Nil);
