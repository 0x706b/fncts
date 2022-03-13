import type { Maybe } from "../../../data/Maybe.js";
import type { Ord, Ordering, Semigroup } from "../../../prelude.js";
import type { SortedMapIterable } from "./iterator.js";
import type { RBNode } from "./node.js";

import { Just, Nothing } from "../../../data/Maybe.js";
import { Stack } from "../../../internal/Stack.js";
import { SortedMap } from "./definition.js";
import { balanceModifiedPath, isEmptyNode, rebuildModifiedPath } from "./internal.js";
import { SortedMapIterator } from "./iterator.js";
import { Color, Leaf, Node } from "./node.js";

/**
 * @tsplus fluent fncts.collection.immutable.SortedMap find
 */
export function find_<K, V>(
  m: SortedMap<K, V>,
  key: K,
  direction: 0 | 1 = 0,
): SortedMapIterable<K, V> {
  return {
    ord: m.ord,
    [Symbol.iterator]() {
      const cmp = m.ord.compare_;
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
 * @tsplus fluent fncts.collection.immutable.SortedMap forEach
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
 * @tsplus fluent fncts.collection.immutable.SortedMap forEachBetween
 */
export function forEachBetween_<K, V>(
  m: SortedMap<K, V>,
  min: K,
  max: K,
  visit: (k: K, v: V) => void,
): void {
  if (m.root) {
    m.visitBetween(min, max, (k, v) => {
      visit(k, v);
      return Nothing();
    });
  }
}

/**
 * @tsplus fluent fncts.collection.immutable.SortedMap forEachLte
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
 * @tsplus fluent fncts.collection.immutable.SortedMap forEachLt
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
 * @tsplus fluent fncts.collection.immutable.SortedMap forEachGte
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
 * @tsplus fluent fncts.collection.immutable.SortedMap forEachGt
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
 * @tsplus fluent fncts.collection.immutable.SortedMap get
 */
export function get_<K, V>(m: SortedMap<K, V>, key: K): Maybe<V> {
  const cmp = m.ord.compare_;
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
 * @tsplus fluent fncts.collection.immutable.SortedMap getGt
 */
export function getGt_<K, V>(m: SortedMap<K, V>, key: K): Maybe<V> {
  const cmp     = m.ord.compare_;
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
 * @tsplus fluent fncts.collection.immutable.SortedMap getLt
 */
export function getLt_<K, V>(m: SortedMap<K, V>, key: K): Maybe<V> {
  const cmp     = m.ord.compare_;
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
 * @tsplus fluent fncts.collection.immutable.SortedMap getLte
 */
export function getLte_<K, V>(m: SortedMap<K, V>, key: K): Maybe<V> {
  const cmp     = m.ord.compare_;
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
 * @tsplus fluent fncts.collection.immutable.SortedMap getGte
 */
export function getGte_<K, V>(m: SortedMap<K, V>, key: K): Maybe<V> {
  const cmp     = m.ord.compare_;
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
 * @tsplus fluent fncts.collection.immutable.SortedMap insert
 */
export function insert_<K, V>(m: SortedMap<K, V>, key: K, value: V): SortedMap<K, V> {
  if (isEmptyNode(m.root)) {
    return new SortedMap(m.ord, new Node(Color.R, Leaf, key, value, Leaf, 1));
  }
  const cmp = m.ord.compare_;
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
export function insertWith_<V>(S: Semigroup<V>) {
  return <K>(m: SortedMap<K, V>, key: K, value: V) => {
    if (isEmptyNode(m.root)) {
      return new SortedMap(m.ord, new Node(Color.R, Leaf, key, value, Leaf, 1));
    }
    const com = S.combine_;
    const cmp = m.ord.compare_;
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
  };
}

/**
 * @tsplus getter fncts.collection.immutable.SortedMap isEmpty
 */
export function isEmpty<K, V>(m: SortedMap<K, V>): boolean {
  return m.root === Leaf;
}

/**
 * @tsplus getter fncts.collection.immutable.SortedMap isNonEmpty
 */
export function isNonEmpty<K, V>(m: SortedMap<K, V>): boolean {
  return m.root !== Leaf;
}

/**
 * @tsplus static fncts.collection.immutable.SortedMapOps make
 */
export function make<K, V>(ord: Ord<K>) {
  return new SortedMap<K, V>(ord, null);
}

/**
 * Removes an element from the map
 *
 * @tsplus fluent fncts.collection.immutable.SortedMap remove
 */
export function remove_<K, V>(m: SortedMap<K, V>, key: K): SortedMap<K, V> {
  const iter = m.find(key)[Symbol.iterator]();
  return iter.isEmpty ? m : iter.remove();
}

/**
 * @tsplus fluent fncts.collection.immutable.SortedMap visitFull
 */
export function visitFull<K, V, A>(
  m: SortedMap<K, V>,
  visit: (key: K, value: V) => Maybe<A>,
): Maybe<A> {
  let current: RBNode<K, V>                = m.root;
  let stack: Stack<Node<K, V>> | undefined = undefined;
  let done = false;

  while (!done) {
    if (current) {
      stack   = Stack.make(current, stack);
      current = current.left;
    } else if (stack) {
      const v = visit(stack.value.key, stack.value.value);
      if (v.isJust()) {
        return v;
      }
      current = stack.value.right;
      stack   = stack.previous;
    } else {
      done = true;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.SortedMap visitLte
 */
export function visitLte<K, V, A>(
  m: SortedMap<K, V>,
  max: K,
  visit: (k: K, v: V) => Maybe<A>,
): Maybe<A> {
  let current: RBNode<K, V>                = m.root;
  let stack: Stack<Node<K, V>> | undefined = undefined;
  let done  = false;
  const cmp = m.ord.compare_;

  while (!done) {
    if (current) {
      stack   = Stack.make(current, stack);
      current = current.left;
    } else if (stack) {
      if (cmp(stack.value.key, max) > 0) {
        break;
      }
      const v = visit(stack.value.key, stack.value.value);
      if (v.isJust()) {
        return v;
      }
      current = stack.value.right;
      stack   = stack.previous;
    } else {
      done = true;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.SortedMap visitLt
 */
export function visitLt<K, V, A>(
  m: SortedMap<K, V>,
  max: K,
  visit: (k: K, v: V) => Maybe<A>,
): Maybe<A> {
  let current: RBNode<K, V>                = m.root;
  let stack: Stack<Node<K, V>> | undefined = undefined;
  let done  = false;
  const cmp = m.ord.compare_;

  while (!done) {
    if (current) {
      stack   = Stack.make(current, stack);
      current = current.left;
    } else if (stack) {
      if (cmp(stack.value.key, max) >= 0) {
        break;
      }
      const v = visit(stack.value.key, stack.value.value);
      if (v.isJust()) {
        return v;
      }
      current = stack.value.right;
      stack   = stack.previous;
    } else {
      done = true;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.SortedMap visitGte
 */
export function visitGte<K, V, A>(
  m: SortedMap<K, V>,
  min: K,
  visit: (k: K, v: V) => Maybe<A>,
): Maybe<A> {
  let current: RBNode<K, V>                = m.root;
  let stack: Stack<Node<K, V>> | undefined = undefined;
  let done  = false;
  const cmp = m.ord.compare_;

  while (!done) {
    if (current) {
      stack = Stack.make(current, stack);
      if (cmp(current.key, min) >= 0) {
        current = current.left;
      } else {
        current = null;
      }
    } else if (stack) {
      if (cmp(stack.value.key, min) >= 0) {
        const v = visit(stack.value.key, stack.value.value);
        if (v.isJust()) {
          return v;
        }
      }
      current = stack.value.right;
      stack   = stack.previous;
    } else {
      done = true;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.SortedMap visitGt
 */
export function visitGt<K, V, A>(
  m: SortedMap<K, V>,
  min: K,
  visit: (k: K, v: V) => Maybe<A>,
): Maybe<A> {
  let current: RBNode<K, V>                = m.root;
  let stack: Stack<Node<K, V>> | undefined = undefined;
  let done  = false;
  const cmp = m.ord.compare_;

  while (!done) {
    if (current) {
      stack = Stack.make(current, stack);
      if (cmp(current.key, min) > 0) {
        current = current.left;
      } else {
        current = null;
      }
    } else if (stack) {
      if (cmp(stack.value.key, min) > 0) {
        const v = visit(stack.value.key, stack.value.value);
        if (v.isJust()) {
          return v;
        }
      }
      current = stack.value.right;
      stack   = stack.previous;
    } else {
      done = true;
    }
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.SortedMap visitBetween
 */
export function visitBetween<K, V, A>(
  m: SortedMap<K, V>,
  min: K,
  max: K,
  visit: (k: K, v: V) => Maybe<A>,
): Maybe<A> {
  let current: RBNode<K, V>                = m.root;
  let stack: Stack<Node<K, V>> | undefined = undefined;
  let done  = false;
  const cmp = m.ord.compare_;

  while (!done) {
    if (current) {
      stack = Stack.make(current, stack);
      if (cmp(current.key, min) > 0) {
        current = current.left;
      } else {
        current = null;
      }
    } else if (stack) {
      if (cmp(stack.value.key, max) >= 0) {
        break;
      }
      const v = visit(stack.value.key, stack.value.value);
      if (v.isJust()) {
        return v;
      }
      current = stack.value.right;
      stack   = stack.previous;
    } else {
      done = true;
    }
  }
  return Nothing();
}