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

import { _Nil } from "@fncts/base/collection/immutable/List";

/**
 * @tsplus type fncts.ImmutableQueue
 * @tsplus companion fncts.ImmutableQueueOps
 */
export class Queue<A> implements Iterable<A> {
  constructor(
    /* @internal */
    public _in: List<A>,
    /* @internal */
    public _out: List<A>,
  ) {}

  [Symbol.iterator]() {
    return this._in.concat(this._out.reverse)[Symbol.iterator]();
  }
}

export const EmptyQueue: Queue<never> = new Queue(_Nil, _Nil);
