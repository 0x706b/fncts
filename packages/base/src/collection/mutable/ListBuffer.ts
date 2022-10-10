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

  [Symbol.iterator](): Iterator<A> {
    return this.first[Symbol.iterator]();
  }

  get length(): number {
    return this.len;
  }

  get isEmpty(): boolean {
    return this.len === 0;
  }

  get unsafeHead(): A {
    if (this.isEmpty) {
      throw new NoSuchElementError("head on empty ListBuffer");
    }
    return (this.first as Cons<A>).head;
  }

  get unsafeTail(): List<A> {
    if (this.isEmpty) {
      throw new NoSuchElementError("tail on empty ListBuffer");
    }
    return (this.first as Cons<A>).tail;
  }

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

  prepend(elem: A): this {
    this.insert(0, elem);
    return this;
  }

  unprepend(): A {
    if (this.isEmpty) {
      throw new NoSuchElementError("unprepend on empty ListBuffer");
    }
    const h    = (this.first as Cons<A>).head;
    this.first = (this.first as Cons<A>).tail;
    this.len  -= 1;
    return h;
  }

  get toList(): List<A> {
    return this.first;
  }

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

  foldLeft<B>(b: B, f: (b: B, a: A) => B): B {
    return this.first.foldLeft(b, f);
  }

  private getNext(p: List<A> | undefined): List<A> {
    if (p === undefined) {
      return this.first;
    } else {
      return p.unsafeTail;
    }
  }

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
