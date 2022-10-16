import type { Node } from "@fncts/base/collection/immutable/HashMap/internal";
import type { HashEq } from "@fncts/base/typeclass";

import { isEmptyNode } from "@fncts/base/collection/immutable/HashMap/internal";
import { identity, tuple } from "@fncts/base/data/function";

export interface HashMapF extends HKT {
  type: HashMap<this["K"], this["A"]>;
  variance: {
    K: "+";
    A: "+";
  };
  index: this["K"];
}

export const TypeId = Symbol.for("fncts.HashMap");
export type TypeId = typeof TypeId;

/**
 * @tsplus type fncts.HashMap
 * @tsplus companion fncts.HashMapOps
 */
export class HashMap<K, V> implements Iterable<readonly [K, V]>, Hashable, Equatable {
  readonly _typeId: TypeId = TypeId;

  declare _K: () => K;
  declare _A: () => V;

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

  get [Symbol.hash](): number {
    return Hashable.iterator(
      new HashMapIterator(this, ([k, v]) => Hashable.combine(Hashable.unknown(k), Hashable.unknown(v))),
    );
  }

  [Symbol.equals](other: unknown): boolean {
    return (
      isHashMap(other) &&
      other.size === this.size &&
      (this as Iterable<readonly [K, V]>).corresponds(other, Equatable.strictEquals)
    );
  }
}

/**
 * @tsplus static fncts.HashMapOps is
 */
export function isHashMap<K, V>(u: Iterable<readonly [K, V]>): u is HashMap<K, V>;
export function isHashMap(u: unknown): u is HashMap<unknown, unknown>;
export function isHashMap(u: unknown): u is HashMap<unknown, unknown> {
  return hasTypeId(u, TypeId);
}

export class HashMapIterator<K, V, T> implements IterableIterator<T> {
  v: Maybe<VisitResult<K, V, T>>;

  constructor(readonly map: HashMap<K, V>, readonly f: (node: readonly [K, V]) => T) {
    this.v = visitLazy(this.map.root, this.f, undefined);
  }

  next(): IteratorResult<T> {
    this.v.concrete();
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
  | [len: number, children: Node<K, V>[], i: number, f: (node: readonly [K, V]) => A, cont: Cont<K, V, A>]
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
