import type { Maybe } from "../../../data/Maybe";
import type { HashEq, HKT } from "../../../prelude";
import type { Node } from "./internal";

import { identity, tuple } from "../../../data/function";
import { Just, Nothing } from "../../../data/Maybe";
import { Equatable, Hashable } from "../../../prelude";
import { isEmptyNode } from "./internal";

export interface HashMapF extends HKT {
  readonly type: HashMap<this["K"], this["A"]>;
  readonly variance: {
    K: "_";
    A: "+";
  };
}

/**
 * @tsplus type fncts.collection.immutable.HashMap
 * @tsplus companion fncts.collection.immutable.HashMapOps
 */
export class HashMap<K, V> implements Iterable<readonly [K, V]>, Hashable, Equatable {
  readonly _K!: () => K;
  readonly _V!: () => V;

  constructor(
    public editable: boolean,
    public edit: number,
    readonly config: HashEq<K>,
    public root: Node<K, V>,
    public size: number,
  ) {}

  [Symbol.iterator](): Iterator<readonly [K, V]> {
    return new HashMapIterator(this, identity);
  }

  get [Symbol.hashable](): number {
    return Hashable.hashIterator(
      new HashMapIterator(this, ([k, v]) =>
        Hashable.combineHash(Hashable.hash(k), Hashable.hash(v)),
      ),
    );
  }

  [Symbol.equatable](other: unknown): boolean {
    return (
      other instanceof HashMap &&
      other.size === this.size &&
      (this as Iterable<readonly [K, V]>).corresponds(other, Equatable.strictEquals)
    );
  }
}

export class HashMapIterator<K, V, T> implements IterableIterator<T> {
  v: Maybe<VisitResult<K, V, T>>;

  constructor(readonly map: HashMap<K, V>, readonly f: (node: readonly [K, V]) => T) {
    this.v = visitLazy(this.map.root, this.f, undefined);
  }

  next(): IteratorResult<T> {
    if (this.v.isNothing()) {
      return { done: true, value: undefined };
    }
    const v0 = this.v.value;
    this.v   = applyCont(v0.cont);
    return { done: false, value: v0.value };
  }

  [Symbol.iterator](): IterableIterator<T> {
    return new HashMapIterator(this.map, this.f);
  }
}

type Cont<K, V, A> =
  | [
      len: number,
      children: Node<K, V>[],
      i: number,
      f: (node: readonly [K, V]) => A,
      cont: Cont<K, V, A>,
    ]
  | undefined;

function applyCont<K, V, A>(cont: Cont<K, V, A>) {
  return cont ? visitLazyChildren(cont[0], cont[1], cont[2], cont[3], cont[4]) : Nothing();
}

function visitLazyChildren<K, V, A>(
  len: number,
  children: Node<K, V>[],
  i: number,
  f: (node: readonly [K, V]) => A,
  cont: Cont<K, V, A>,
): Maybe<VisitResult<K, V, A>> {
  while (i < len) {
    // eslint-disable-next-line no-param-reassign
    const child = children[i++];
    if (child && !isEmptyNode(child)) {
      return visitLazy(child, f, [len, children, i, f, cont]);
    }
  }
  return applyCont(cont);
}

interface VisitResult<K, V, A> {
  value: A;
  cont: Cont<K, V, A>;
}

/**
 * Visit each leaf lazily
 */
function visitLazy<K, V, A>(
  node: Node<K, V>,
  f: (node: readonly [K, V]) => A,
  cont: Cont<K, V, A> = undefined,
): Maybe<VisitResult<K, V, A>> {
  switch (node._tag) {
    case "LeafNode": {
      return node.value.isJust()
        ? Just({
            value: f(tuple(node.key, node.value.value)),
            cont,
          })
        : applyCont(cont);
    }
    case "CollisionNode":
    case "ArrayNode":
    case "IndexedNode": {
      const children = node.children;
      return visitLazyChildren(children.length, children, 0, f, cont);
    }
    default: {
      return applyCont(cont);
    }
  }
}
