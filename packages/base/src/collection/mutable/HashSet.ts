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

import { unsafeCoerce } from "../../data/function";
import { HashEq } from "../../prelude/HashEq";
import { assert } from "../../util/assert";
import { copyOfArray, improveHash, tableSizeFor } from "./internal";

const DEFAULT_INITIAL_CAPACITY = 16;
const DEFAULT_LOAD_FACTOR      = 0.75;

/**
 * @tsplus type fncts.collection.mutable.HashSet
 * @tsplus companion fncts.collection.mutable.HashSetOps
 */
export class HashSet<A> implements Iterable<A> {
  constructor(
    private initialCapacity: number,
    private loadFactor: number,
    private config: HashEq<A> = HashEq.StructuralStrict,
  ) {
    this.table = new Array<Node<A> | undefined>(tableSizeFor(this.initialCapacity));

    this.threshold = this.newThreshold(this.table.length);
  }

  [Symbol.iterator](): Iterator<A> {
    return new HashSetIterator(this.table, (nd) => nd.key);
  }

  private table: Array<Node<A> | undefined>;

  private threshold: number;

  private contentSize = 0;

  static empty<A>(config?: HashEq<A>) {
    return new HashSet(DEFAULT_INITIAL_CAPACITY, DEFAULT_LOAD_FACTOR, config);
  }

  get size(): number {
    return this.contentSize;
  }

  has(key: A): boolean {
    return this.findNode(key) !== undefined;
  }

  add(elem: A): boolean {
    this.contentSize + 1 >= this.threshold && this.growTable(this.table.length * 2);
    return this.addHash(elem, this.computeHash(elem));
  }

  remove(elem: A): boolean {
    return this.removeHash(elem, this.computeHash(elem));
  }

  forEach<U>(f: (elem: A) => U): void {
    for (let i = 0; i < this.table.length; i++) {
      const n = this.table[i];
      if (n) n.forEach(f);
    }
  }

  private addHash(elem: A, hash: number): boolean {
    const idx = this.index(hash);
    let n     = this.table[idx];
    if (n === undefined) {
      this.table[idx] = new Node(elem, hash, undefined);
    } else {
      const old                     = n;
      let prev: Node<A> | undefined = undefined;
      while (n !== undefined && n.hash <= hash) {
        if (n.hash === hash && this.config.equals_(elem, n.key)) {
          return false;
        }
        prev = n;
        n    = n.next;
      }
      if (prev === undefined) {
        this.table[idx] = new Node(elem, hash, old);
      } else {
        prev.next = new Node(elem, hash, prev.next);
      }
    }
    this.contentSize += 1;
    return true;
  }

  private removeHash(elem: A, hash: number): boolean {
    const idx = this.index(hash);
    const n   = this.table[idx];
    if (n === undefined) {
      return false;
    } else if (n.hash === hash && this.config.equals_(n.key, elem)) {
      this.table[idx]   = n.next;
      this.contentSize -= 1;
      return true;
    } else {
      let prev = n;
      let next = n.next;
      while (next && next.hash <= hash) {
        if (next.hash === hash && this.config.equals_(next.key, elem)) {
          prev.next         = next.next;
          this.contentSize -= 1;
          return true;
        }
        prev = next;
        next = next.next;
      }
      return false;
    }
  }

  private newThreshold(size: number) {
    return Math.floor(size * this.loadFactor);
  }

  private computeHash(k: A): number {
    return improveHash(this.config.hash(k));
  }

  private index(hash: number) {
    return hash & (this.table.length - 1);
  }

  private findNode(key: A): Node<A> | undefined {
    const hash = this.computeHash(key);
    const n    = this.table[this.index(hash)];
    return n === undefined ? n : n.findNode(key, hash, this.config.equals_);
  }

  private growTable(newLen: number) {
    assert(newLen >= 0, `New HashSet table size ${newLen}`);
    let oldLen     = this.table.length;
    this.threshold = this.newThreshold(newLen);
    if (this.size === 0) {
      this.table = new Array(newLen);
    } else {
      this.table    = copyOfArray(this.table, newLen);
      const preLow  = new Node<A>(unsafeCoerce(undefined), 0, undefined);
      const preHigh = new Node<A>(unsafeCoerce(undefined), 0, undefined);
      while (oldLen < newLen) {
        let i = 0;
        while (i < oldLen) {
          const old = this.table[i];
          if (old !== undefined) {
            preLow.next                = undefined;
            preHigh.next               = undefined;
            let lastLow                = preLow;
            let lastHigh               = preHigh;
            let n: Node<A> | undefined = old;
            while (n) {
              const next: Node<A> | undefined = n.next;
              if ((n.hash & oldLen) === 0) {
                lastLow.next = n;
                lastLow      = n;
              } else {
                lastHigh.next = n;
                lastHigh      = n;
              }
              n = next;
            }
            lastLow.next = undefined;
            if (old !== preLow.next) {
              this.table[i] = preLow.next;
            }
            if (preHigh.next !== undefined) {
              this.table[i + oldLen] = preHigh.next;
              lastHigh.next          = undefined;
            }
          }
          i += 1;
        }
        oldLen *= 2;
      }
    }
  }
}

class Node<K> {
  constructor(public key: K, public hash: number, public next: Node<K> | undefined) {}

  findNode(k: K, h: number, equals: (x: K, y: K) => boolean): Node<K> | undefined {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let n: Node<K> | undefined = this;
    while (n) {
      if (h === n.hash && equals(k, n.key)) {
        return n;
      } else {
        n = n.next;
      }
    }
    return undefined;
  }

  forEach<U>(f: (k: K) => U): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let n: Node<K> | undefined = this;
    while (n) {
      f(n.key);
      n = n.next;
    }
  }
}

export class HashSetIterator<V, A> implements Iterator<A> {
  private node: Node<V> | undefined;
  private len: number;
  private i    = 0;
  private done = false;
  constructor(private table: Array<Node<V> | undefined>, private extract: (nd: Node<V>) => A) {
    this.len = table.length;
  }

  next(): IteratorResult<A> {
    if (this.done) {
      return this.return();
    }
    if (this.node === undefined) {
      while (this.i < this.len) {
        const n = this.table[this.i];
        this.i += 1;
        if (n != null) {
          this.node = n;
          break;
        }
      }
      if (this.node === undefined) {
        return this.return();
      }
    }
    const value = this.extract(this.node);
    this.node   = this.node.next;
    return { done: false, value };
  }

  return(value?: unknown): IteratorReturnResult<unknown> {
    if (!this.done) {
      this.done = true;
    }
    return { done: true, value };
  }
}
