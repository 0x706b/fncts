import type { SortedMapIterable } from "@fncts/base/collection/immutable/SortedMap/iterator";
import type { RBNode } from "@fncts/base/collection/immutable/SortedMap/node";
import type { Ord, Ordering, Semigroup } from "@fncts/base/typeclass";

import { SortedMap } from "@fncts/base/collection/immutable/SortedMap/definition";
import {
  balanceModifiedPath,
  isEmptyNode,
  rebuildModifiedPath,
} from "@fncts/base/collection/immutable/SortedMap/internal";
import { SortedMapIterator } from "@fncts/base/collection/immutable/SortedMap/iterator";
import { Color, Leaf, Node } from "@fncts/base/collection/immutable/SortedMap/node";
import { Stack } from "@fncts/base/internal/Stack";

/**
 * @tsplus fluent fncts.SortedMap find
 */
export function find_<K, V>(m: SortedMap<K, V>, key: K, direction: 0 | 1 = 0): SortedMapIterable<K, V> {
  return {
    ord: m.ord,
    [Symbol.iterator]() {
      const cmp = m.ord.compare;
      let n     = m.root;
      const stack: Array<Node<K, V>> = [];
      while (n) {
        const d = cmp(key, n.key);
        stack.push(n);
        switch (d) {
          case 0: {
            return new SortedMapIterator(m, stack, direction);
          }
          case -1: {
            n = n.left;
            break;
          }
          case 1: {
            n = n!.right;
            break;
          }
        }
      }
      return new SortedMapIterator(m, [], direction);
    },
  };
}

/**
 * Iterates through the elements of the map inorder, performing the given function for each element
 *
 * @tsplus fluent fncts.SortedMap forEach
 */
export function forEach_<K, V>(m: SortedMap<K, V>, visit: (key: K, value: V) => void) {
  if (m.root) {
    m.visitFull((k, v) => {
      visit(k, v);
      return Nothing();
    });
  }
}

/**
 * @tsplus fluent fncts.SortedMap forEachBetween
 */
export function forEachBetween_<K, V>(m: SortedMap<K, V>, min: K, max: K, visit: (k: K, v: V) => void): void {
  if (m.root) {
    m.visitBetween(min, max, (k, v) => {
      visit(k, v);
      return Nothing();
    });
  }
}

/**
 * @tsplus fluent fncts.SortedMap forEachLte
 */
export function forEachLte_<K, V>(m: SortedMap<K, V>, max: K, visit: (k: K, v: V) => void): void {
  if (m.root) {
    m.visitLte(max, (k, v) => {
      visit(k, v);
      return Nothing();
    });
  }
}

/**
 * @tsplus fluent fncts.SortedMap forEachLt
 */
export function forEachLt_<K, V>(m: SortedMap<K, V>, max: K, visit: (k: K, v: V) => void): void {
  if (m.root) {
    m.visitLt(max, (k, v) => {
      visit(k, v);
      return Nothing();
    });
  }
}

/**
 * @tsplus fluent fncts.SortedMap forEachGte
 */
export function forEachGte_<K, V>(m: SortedMap<K, V>, min: K, visit: (k: K, v: V) => void): void {
  if (m.root) {
    m.visitGte(min, (k, v) => {
      visit(k, v);
      return Nothing();
    });
  }
}

/**
 * @tsplus fluent fncts.SortedMap forEachGt
 */
export function forEachGt_<K, V>(m: SortedMap<K, V>, min: K, visit: (k: K, v: V) => void): void {
  if (m.root) {
    m.visitGt(min, (k, v) => {
      visit(k, v);
      return Nothing();
    });
  }
}

/**
 * Searches the map for a given key, returning it's value, if it exists
 *
 * @tsplus fluent fncts.SortedMap get
 */
export function get_<K, V>(m: SortedMap<K, V>, key: K): Maybe<V> {
  const cmp = m.ord.compare;
  let n     = m.root;
  while (n) {
    const d = cmp(key, n.key);
    switch (d) {
      case 0: {
        return Just(n.value);
      }
      case -1: {
        n = n.left;
        break;
      }
      case 1: {
        n = n.right;
        break;
      }
    }
  }
  return Nothing();
}

/**
 * Searches the map and returns the first value in sorted order that is > key, if it exists
 *
 * @tsplus fluent fncts.SortedMap getGt
 */
export function getGt_<K, V>(m: SortedMap<K, V>, key: K): Maybe<V> {
  const cmp     = m.ord.compare;
  let n         = m.root;
  let lastValue = Nothing<V>();
  while (n) {
    const d = cmp(key, n.key);
    if (d < 0) {
      lastValue = Just(n.value);
      n         = n.left;
    } else {
      if (lastValue.isJust()) {
        break;
      }
      n = n.right;
    }
  }
  return lastValue;
}

/**
 * Searches the map and returns the first value in sorted order that is < key, if it exists
 *
 * @tsplus fluent fncts.SortedMap getLt
 */
export function getLt_<K, V>(m: SortedMap<K, V>, key: K): Maybe<V> {
  const cmp     = m.ord.compare;
  let n         = m.root;
  let lastValue = Nothing<V>();
  while (n) {
    const d = cmp(key, n.key);
    if (d > 0) {
      lastValue = Just(n.value);
    }
    if (d <= 0) {
      n = n.left;
    } else {
      n = n.right;
    }
  }
  return lastValue;
}

/**
 * Searches the map and returns the first value in sorted order that is <= key, if it exists
 *
 * @tsplus fluent fncts.SortedMap getLte
 */
export function getLte_<K, V>(m: SortedMap<K, V>, key: K): Maybe<V> {
  const cmp     = m.ord.compare;
  let n         = m.root;
  let lastValue = Nothing<V>();
  while (n) {
    const d = cmp(key, n.key);
    if (d > 0) {
      if (lastValue.isJust()) {
        break;
      }
      n = n.right;
    } else {
      lastValue = Just(n.value);
      n         = n.left;
    }
  }
  return lastValue;
}

/**
 * Searches the map and returns the first value in sorted order that is >= key, if it exists
 *
 * @tsplus fluent fncts.SortedMap getGte
 */
export function getGte_<K, V>(m: SortedMap<K, V>, key: K): Maybe<V> {
  const cmp     = m.ord.compare;
  let n         = m.root;
  let lastValue = Nothing<V>();
  while (n) {
    const d = cmp(key, n.key);
    if (d <= 0) {
      lastValue = Just(n.value);
      n         = n.left;
    } else {
      if (lastValue.isJust()) {
        break;
      }
      n = n.right;
    }
  }
  return lastValue;
}

/**
 * Inserts an element into the correct position in the map.
 * This function inserts duplicate keys. For one that combines duplicate key's values,
 * see `insertWith_`
 *
 * @tsplus fluent fncts.SortedMap insert
 */
export function insert_<K, V>(m: SortedMap<K, V>, key: K, value: V): SortedMap<K, V> {
  if (isEmptyNode(m.root)) {
    return new SortedMap(m.ord, new Node(Color.R, Leaf, key, value, Leaf, 1));
  }
  const cmp = m.ord.compare;
  const nodeStack: Array<Node<K, V>> = [];
  const orderStack: Array<Ordering>  = [];
  let n: RBNode<K, V>                = m.root;
  while (n) {
    const d = cmp(key, n.key);
    nodeStack.push(n);
    orderStack.push(d);
    if (d <= 0) {
      n = n.left;
    } else {
      n = n.right;
    }
  }

  nodeStack.push(new Node(Color.R, Leaf, key, value, Leaf, 1));
  rebuildModifiedPath(nodeStack, orderStack);
  balanceModifiedPath(nodeStack);

  return new SortedMap(m.ord, nodeStack[0]!);
}

/**
 * Inserts an element into the correct position in the map, combining the values of keys of equal ordering
 * with a `Semigroup` instance
 */
export function insertWith_<K, V>(
  m: SortedMap<K, V>,
  key: K,
  value: V,
  /** @tsplus auto */ S: Semigroup<V>,
): SortedMap<K, V> {
  if (isEmptyNode(m.root)) {
    return new SortedMap(m.ord, new Node(Color.R, Leaf, key, value, Leaf, 1));
  }
  const com = S.combine;
  const cmp = m.ord.compare;
  const nodeStack: Array<Node<K, V>> = [];
  const orderStack: Array<1 | -1>    = [];
  let n: RBNode<K, V>                = m.root;
  let cv: V | null                   = null;
  while (n && !cv) {
    const d = cmp(key, n.key);
    nodeStack.push(n);
    switch (d) {
      case -1: {
        orderStack.push(d);
        n = n.left;
        break;
      }
      case 1: {
        orderStack.push(d);
        n = n.right;
        break;
      }
      case 0: {
        cv = com(n.value, value);
        break;
      }
    }
  }
  if (cv) {
    const u                         = nodeStack[nodeStack.length - 1]!;
    const updated                   = new Node(u.color, u.left, u.key, cv, u.right, u.count);
    nodeStack[nodeStack.length - 1] = updated;
    rebuildModifiedPath(nodeStack, orderStack, 0);
  } else {
    nodeStack.push(new Node(Color.R, Leaf, key, value, Leaf, 1));
    rebuildModifiedPath(nodeStack, orderStack);
    balanceModifiedPath(nodeStack);
  }
  return new SortedMap(m.ord, nodeStack[0]!);
}

/**
 * @tsplus getter fncts.SortedMap isEmpty
 */
export function isEmpty<K, V>(m: SortedMap<K, V>): boolean {
  return m.root === Leaf;
}

/**
 * @tsplus getter fncts.SortedMap isNonEmpty
 */
export function isNonEmpty<K, V>(m: SortedMap<K, V>): boolean {
  return m.root !== Leaf;
}

/**
 * @tsplus static fncts.SortedMapOps make
 */
export function make<K, V>(ord: Ord<K>) {
  return new SortedMap<K, V>(ord, null);
}

/**
 * Removes an element from the map
 *
 * @tsplus fluent fncts.SortedMap remove
 */
export function remove_<K, V>(m: SortedMap<K, V>, key: K): SortedMap<K, V> {
  const iter = m.find(key)[Symbol.iterator]();
  return iter.isEmpty ? m : iter.remove();
}

/**
 * @tsplus fluent fncts.SortedMap visitFull
 */
export function visitFull<K, V, A>(m: SortedMap<K, V>, visit: (key: K, value: V) => Maybe<A>): Maybe<A> {
  let current: RBNode<K, V>      = m.root;
  const stack: Stack<Node<K, V>> = Stack();
  let done = false;

  while (!done) {
    if (current) {
      stack.push(current);
      current = current.left;
    } else if (stack.hasNext) {
      const value = stack.pop()!;
      const v     = visit(value.key, value.value);
      if (v.isJust()) {
        return v;
      }
      current = value.right;
    } else {
      done = true;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.SortedMap visitLte
 */
export function visitLte<K, V, A>(m: SortedMap<K, V>, max: K, visit: (k: K, v: V) => Maybe<A>): Maybe<A> {
  let current: RBNode<K, V>      = m.root;
  const stack: Stack<Node<K, V>> = Stack();
  let done  = false;
  const cmp = m.ord.compare;

  while (!done) {
    if (current) {
      stack.push(current);
      current = current.left;
    } else if (stack.hasNext) {
      const next = stack.pop()!;
      if (cmp(next.key, max) > 0) {
        break;
      }
      const v = visit(next.key, next.value);
      if (v.isJust()) {
        return v;
      }
      current = next.right;
    } else {
      done = true;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.SortedMap visitLt
 */
export function visitLt<K, V, A>(m: SortedMap<K, V>, max: K, visit: (k: K, v: V) => Maybe<A>): Maybe<A> {
  let current: RBNode<K, V>      = m.root;
  const stack: Stack<Node<K, V>> = Stack();
  let done  = false;
  const cmp = m.ord.compare;

  while (!done) {
    if (current) {
      stack.push(current);
      current = current.left;
    } else if (stack.hasNext) {
      const next = stack.pop()!;
      if (cmp(next.key, max) >= 0) {
        break;
      }
      const v = visit(next.key, next.value);
      if (v.isJust()) {
        return v;
      }
      current = next.right;
    } else {
      done = true;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.SortedMap visitGte
 */
export function visitGte<K, V, A>(m: SortedMap<K, V>, min: K, visit: (k: K, v: V) => Maybe<A>): Maybe<A> {
  let current: RBNode<K, V>      = m.root;
  const stack: Stack<Node<K, V>> = Stack();
  let done  = false;
  const cmp = m.ord.compare;

  while (!done) {
    if (current) {
      stack.push(current);
      if (cmp(current.key, min) >= 0) {
        current = current.left;
      } else {
        current = null;
      }
    } else if (stack.hasNext) {
      const next = stack.pop()!;
      if (cmp(next.key, min) >= 0) {
        const v = visit(next.key, next.value);
        if (v.isJust()) {
          return v;
        }
      }
      current = next.right;
    } else {
      done = true;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.SortedMap visitGt
 */
export function visitGt<K, V, A>(m: SortedMap<K, V>, min: K, visit: (k: K, v: V) => Maybe<A>): Maybe<A> {
  let current: RBNode<K, V>      = m.root;
  const stack: Stack<Node<K, V>> = Stack();
  let done  = false;
  const cmp = m.ord.compare;

  while (!done) {
    if (current) {
      stack.push(current);
      if (cmp(current.key, min) > 0) {
        current = current.left;
      } else {
        current = null;
      }
    } else if (stack.hasNext) {
      const next = stack.pop()!;
      if (cmp(next.key, min) > 0) {
        const v = visit(next.key, next.value);
        if (v.isJust()) {
          return v;
        }
      }
      current = next.right;
    } else {
      done = true;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.SortedMap visitBetween
 */
export function visitBetween<K, V, A>(m: SortedMap<K, V>, min: K, max: K, visit: (k: K, v: V) => Maybe<A>): Maybe<A> {
  let current: RBNode<K, V>      = m.root;
  const stack: Stack<Node<K, V>> = Stack();
  let done  = false;
  const cmp = m.ord.compare;

  while (!done) {
    if (current) {
      stack.push(current);
      if (cmp(current.key, min) > 0) {
        current = current.left;
      } else {
        current = null;
      }
    } else if (stack.hasNext) {
      const next = stack.pop()!;
      if (cmp(next.key, max) >= 0) {
        break;
      }
      const v = visit(next.key, next.value);
      if (v.isJust()) {
        return v;
      }
      current = next.right;
    } else {
      done = true;
    }
  }
  return Nothing();
}
