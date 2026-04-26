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

import { _Nil } from "@fncts/base/collection/immutable/List/definition";

export class ListBuffer<A> implements Iterable<A> {
  private first: List<A>             = _Nil;
  private last0: Cons<A> | undefined = undefined;
  private len = 0;

  /**
   * Returns an iterator over the current elements in insertion order.
   */
  [Symbol.iterator](): Iterator<A> {
    return this.first[Symbol.iterator]();
  }

  /**
   * Number of elements currently stored in this buffer.
   */
  get length(): number {
    return this.len;
  }

  /**
   * Whether this buffer has no elements.
   */
  get isEmpty(): boolean {
    return this.len === 0;
  }

  /**
   * First element in the buffer.
   *
   * @throws NoSuchElementError if the buffer is empty
   */
  get unsafeHead(): A {
    if (this.isEmpty) {
      throw new NoSuchElementError("head on empty ListBuffer");
    }
    return (this.first as Cons<A>).head;
  }

  /**
   * All elements except the first one.
   *
   * @throws NoSuchElementError if the buffer is empty
   */
  get unsafeTail(): List<A> {
    if (this.isEmpty) {
      throw new NoSuchElementError("tail on empty ListBuffer");
    }
    return (this.first as Cons<A>).tail;
  }

  /**
   * Appends `elem` to the end of this buffer.
   */
  append(elem: A): this {
    const last1 = new Cons(elem, _Nil);
    if (this.len === 0) {
      this.first = last1;
    } else {
      this.last0!.tail = last1;
    }
    this.last0 = last1;
    this.len  += 1;
    return this;
  }

  /**
   * Inserts `elem` at the beginning of this buffer.
   */
  prepend(elem: A): this {
    this.insert(0, elem);
    return this;
  }

  /**
   * Removes and returns the first element.
   *
   * @throws NoSuchElementError if the buffer is empty
   */
  unprepend(): A {
    if (this.isEmpty) {
      throw new NoSuchElementError("unprepend on empty ListBuffer");
    }
    const h    = (this.first as Cons<A>).head;
    this.first = (this.first as Cons<A>).tail;
    this.len  -= 1;
    return h;
  }

  /**
   * Returns the current elements as an immutable list view.
   */
  get toList(): List<A> {
    return this.first;
  }

  /**
   * Inserts `elem` at `idx`, shifting later elements to the right.
   *
   * @throws IndexOutOfBoundsError if `idx` is outside `[0, length]`
   */
  insert(idx: number, elem: A): this {
    if (idx < 0 || idx > this.len) {
      throw new IndexOutOfBoundsError(`${idx} is out of bounds (min 0, max ${this.len - 1})`);
    }
    if (idx === this.len) {
      this.append(elem);
    } else {
      const p  = this.locate(idx);
      const nx = new Cons(elem, this.getNext(p));
      if (p === undefined) {
        this.first = nx;
      } else {
        (p as Cons<A>).tail = nx;
      }
      this.len += 1;
    }
    return this;
  }

  /**
   * Folds elements from left to right starting with `b`.
   */
  foldLeft<B>(b: B, f: (b: B, a: A) => B): B {
    return this.first.foldLeft(b, f);
  }

  /**
   * Returns the node after `p`, or the current head when `p` is absent.
   */
  private getNext(p: List<A> | undefined): List<A> {
    if (p === undefined) {
      return this.first;
    } else {
      return p.unsafeTail;
    }
  }

  /**
   * Finds the node preceding index `i`, or `undefined` for the head position.
   */
  private locate(i: number): List<A> | undefined {
    if (i === 0) {
      return undefined;
    } else if (i === this.len) {
      return this.last0;
    } else {
      let p = this.first;
      for (let j = i - 1; j > 0; j--) {
        p = p.unsafeTail;
      }
      return p;
    }
  }
}
