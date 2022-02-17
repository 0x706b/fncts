import type { Either } from "../../../data/Either";
import type { Maybe } from "../../../data/Maybe";
import type { Predicate } from "../../../data/Predicate";
import type { Refinement } from "../../../data/Refinement";
import type { Config } from "../HashMap";
import type { Node } from "./definition";

import { tuple } from "../../../data/function";
import { Just, Nothing } from "../../../data/Maybe";
import { Stack } from "../../../internal/Stack";
import * as P from "../../../prelude";
import { fromBitmap, hashFragment, SIZE, toBitmap } from "../HashMap/internal";
import { _EmptyNode, HashSet, isEmptyNode } from "./definition";

/**
 * @tsplus fluent fncts.collection.immutable.HashSet add
 */
export function add_<A>(set: HashSet<A>, value: A): HashSet<A> {
  return modifyHash(set, value, set.config.hash(value), false);
}

export const Default: Config<any> = {
  ...P.Eq({ equals_: P.Equatable.strictEquals }),
  ...P.Hash({ hash: P.Hashable.hash }),
};

/**
 * Mark `set` as mutable.
 *
 * @tsplus getter fncts.collection.immutable.HashSet beginMutation
 */
export function beginMutation<K>(set: HashSet<K>): HashSet<K> {
  return new HashSet(true, set._edit + 1, set.config, set._root, set._size);
}

/**
 * Mark `set` as immutable.
 *
 * @tsplus getter fncts.collection.immutable.HashSet endMutation
 */
export function endMutation<K>(set: HashSet<K>): HashSet<K> {
  set._editable = false;
  return set;
}

/**
 * Appy f to each element
 *
 * @tsplus fluent fncts.collection.immutable.HashSet forEach
 */
export function forEach_<V>(
  map: HashSet<V>,
  f: (v: V, m: HashSet<V>) => void
): void {
  foldLeft_(map, undefined as void, (_, value) => f(value, map));
}

/**
 * @tsplus fluent fncts.collection.immutable.HashSet has
 */
export function has_<A>(set: HashSet<A>, value: A): boolean {
  return hasHash(set, value, set.config.hash(value));
}

/**
 * @tsplus static fncts.collection.immutable.HashSetOps make
 */
export function make<A>(config: P.Hash<A> & P.Eq<A>): HashSet<A> {
  return new HashSet(false, 0, config, _EmptyNode, 0);
}

/**
 * @tsplus static fncts.collection.immutable.HashSetOps makeDefault
 */
export function makeDefault<A>(): HashSet<A> {
  return make<A>(Default);
}

/**
 * @tsplus static fncts.collection.immutable.HashSetOps fromDefault
 */
export function fromDefault<A>(...values: ReadonlyArray<A>): HashSet<A> {
  return mutate_(makeDefault<A>(), (set) => {
    values.forEach((v) => {
      add_(set, v);
    });
  });
}

/**
 * Mutate `set` within the context of `f`.
 *
 * @tsplus fluent fncts.collection.immutable.HashSet mutate
 */
export function mutate_<A>(
  set: HashSet<A>,
  transient: (set: HashSet<A>) => void
) {
  const s = beginMutation(set);
  transient(s);
  return endMutation(s);
}

/**
 * @tsplus fluent fncts.collection.immutable.HashSet remove
 */
export function remove_<A>(set: HashSet<A>, value: A): HashSet<A> {
  return modifyHash(set, value, set.config.hash(value), true);
}

/**
 * Calculate the number of keys pairs in a set
 *
 * @tsplus getter fncts.collection.immutable.HashSet size
 */
export function size<A>(set: HashSet<A>): number {
  return set._size;
}

/**
 * If element is present remove it, if not add it
 *
 * @tsplus fluent fncts.collection.immutable.HashSet toggle
 */
export function toggle_<A>(set: HashSet<A>, a: A): HashSet<A> {
  return (has_(set, a) ? remove_ : add_)(set, a);
}

/**
 * Projects a Set through a function
 *
 * @tsplus fluent fncts.collection.immutable.HashSet map
 */
export function map_<B>(
  C: Config<B>
): <A>(fa: HashSet<A>, f: (x: A) => B) => HashSet<B> {
  const r = make(C);

  return (fa, f) =>
    mutate_(r, (r) => {
      forEach_(fa, (e) => {
        const v = f(e);
        if (!has_(r, v)) {
          add_(r, v);
        }
      });
      return r;
    });
}

/**
 * Map + Flatten
 *
 * @tsplus fluent fncts.collection.immutable.HashSet chain
 */
export function chain_<B>(
  C: Config<B>
): <A>(set: HashSet<A>, f: (x: A) => Iterable<B>) => HashSet<B> {
  const r = make<B>(C);
  return (set, f) =>
    mutate_(r, (r) => {
      forEach_(set, (e) => {
        for (const a of f(e)) {
          if (!has_(r, a)) {
            add_(r, a);
          }
        }
      });
      return r;
    });
}

/**
 * Creates an equal for a set
 *
 * @tsplus static fncts.collection.immutable.HashSetOps getEq
 */
export function getEq<A>(): P.Eq<HashSet<A>> {
  return P.Eq({
    equals_: (x, y) => {
      if (y === x) {
        return true;
      }
      if (size(x) !== size(y)) {
        return false;
      }
      let eq = true;
      for (const vx of x) {
        if (!has_(y, vx)) {
          eq = false;
          break;
        }
      }
      return eq;
    },
  });
}

/**
 * Filter set values using predicate
 *
 * @tsplus fluent fncts.collection.immutable.HashSet filter
 */
export function filter_<A, B extends A>(
  set: HashSet<A>,
  refinement: Refinement<A, B>
): HashSet<B>;
export function filter_<A>(
  set: HashSet<A>,
  predicate: Predicate<A>
): HashSet<A>;
export function filter_<A>(
  set: HashSet<A>,
  predicate: Predicate<A>
): HashSet<A> {
  const r = make(set.config);

  return mutate_(r, (r) => {
    forEach_(set, (v) => {
      if (predicate(v)) {
        add_(r, v);
      }
    });
  });
}

export function filterMap_<B>(
  B: Config<B>
): <A>(fa: HashSet<A>, f: (a: A) => Maybe<B>) => HashSet<B> {
  return (fa, f) => {
    const out = beginMutation(make(B));
    forEach_(fa, (a) => {
      const ob = f(a);
      if (ob.isJust()) {
        add_(out, ob.value);
      }
    });
    return endMutation(out);
  };
}

/**
 * Partition set values using predicate
 *
 * @tsplus fluent fncts.collection.immutable.HashSet partition
 */
export function partition_<A, B extends A>(
  self: HashSet<A>,
  p: Refinement<A, B>
): readonly [HashSet<A>, HashSet<B>];
export function partition_<A>(
  self: HashSet<A>,
  p: Predicate<A>
): readonly [HashSet<A>, HashSet<A>];
export function partition_<A>(
  self: HashSet<A>,
  p: Predicate<A>
): readonly [HashSet<A>, HashSet<A>] {
  const right = beginMutation(make(self.config));
  const left  = beginMutation(make(self.config));
  forEach_(self, (v) => {
    if (p(v)) {
      add_(right, v);
    } else {
      add_(left, v);
    }
  });
  return tuple(endMutation(left), endMutation(right));
}

/**
 * Partition set values using predicate
 */
export function partitionMap_<B, C>(
  B: Config<B>,
  C: Config<C>
): <A>(
  self: HashSet<A>,
  f: (a: A) => Either<B, C>
) => readonly [HashSet<B>, HashSet<C>] {
  return (fa, f) => {
    const right = beginMutation(make(C));
    const left  = beginMutation(make(B));
    forEach_(fa, (v) => {
      f(v).match(
        (b) => {
          add_(left, b);
        },
        (c) => {
          add_(right, c);
        }
      );
    });
    return [endMutation(left), endMutation(right)];
  };
}

/**
 * Reduce a state over the set elements
 *
 * @tsplus fluent fncts.collection.immutable.HashSet foldLeft
 */
export function foldLeft_<A, B>(fa: HashSet<A>, b: B, f: (b: B, v: A) => B): B {
  const root = fa._root;
  if (root._tag === "LeafNode") return f(b, root.value);
  if (root._tag === "EmptyNode") return b;
  let toVisit: Stack<Array<Node<A>>> | undefined = Stack.make(root.children);
  while (toVisit) {
    const children = toVisit.value;
    toVisit        = toVisit.previous;
    for (let i = 0, len = children.length; i < len; ) {
      const child = children[i++];
      if (child && !isEmptyNode(child)) {
        if (child._tag === "LeafNode") {
          // eslint-disable-next-line no-param-reassign
          b = f(b, child.value);
        } else {
          toVisit = Stack.make(child.children, toVisit);
        }
      }
    }
  }
  return b;
}

/**
 * Form the set difference
 *
 * @tsplus fluent fncts.collection.immutable.HashSet difference
 */
export function difference_<A>(x: HashSet<A>, y: Iterable<A>): HashSet<A> {
  return mutate_(x, (s) => {
    for (const k of y) {
      remove_(s, k);
    }
  });
}

/**
 * true if all elements match predicate
 *
 * @tsplus fluent fncts.collection.immutable.HashSet every
 */
export function every_<A>(self: HashSet<A>, predicate: Predicate<A>): boolean {
  for (const e of self) {
    if (!predicate(e)) {
      return false;
    }
  }
  return true;
}

/**
 * The set of elements which are in both the first and second set,
 *
 * the hash and equal of the 2 sets has to be the same
 */
export function intersection_<A>(
  self: HashSet<A>,
  that: Iterable<A>
): HashSet<A> {
  const out = make<A>(self.config);

  return out.mutate((y) => {
    for (const k of that) {
      if (has_(self, k)) {
        y.add(k);
      }
    }
  });
}

/**
 * `true` if and only if every element in the first set is an element of the second set,
 *
 * the hash and equal of the 2 sets has to be the same
 */
export function isSubset_<A>(x: HashSet<A>, y: HashSet<A>): boolean {
  return every_(x, (a: A) => has_(y, a));
}

/**
 * true if one or more elements match predicate
 */
export function some_<A>(set: HashSet<A>, predicate: Predicate<A>): boolean {
  let found = false;
  for (const e of set) {
    found = predicate(e);
    if (found) {
      break;
    }
  }
  return found;
}

/**
 * Form the union of two sets,
 *
 * the hash and equal of the 2 sets has to be the same
 *
 * @tsplus fluent fncts.collection.immutable.HashSet union
 */
export function union_<A>(l: HashSet<A>, r: Iterable<A>): HashSet<A> {
  return mutate_(l, (x) => {
    for (const a of r) {
      add_(x, a);
    }
  });
}

/**
 * @tsplus static fncts.collection.immutable.HashSet toArray
 */
export function toArray_<A>(set: HashSet<A>, O: P.Ord<A>): ReadonlyArray<A> {
  const r: Array<A> = [];
  set.forEach((a) => r.push(a));
  return r.sort(O);
}

/*
 * -------------------------------------------------------------------------------------------------
 * internal
 * -------------------------------------------------------------------------------------------------
 */

function setTree<A>(set: HashSet<A>, newRoot: Node<A>, newSize: number) {
  if (set._editable) {
    set._root = newRoot;
    set._size = newSize;
    return set;
  }
  return newRoot === set._root
    ? set
    : new HashSet(set._editable, set._edit, set.config, newRoot, newSize);
}

function modifyHash<A>(
  set: HashSet<A>,
  value: A,
  hash: number,
  remove: boolean
): HashSet<A> {
  const size    = { value: set._size };
  const newRoot = set._root.modify(
    remove,
    set._editable ? set._edit : NaN,
    set.config.equals_,
    0,
    hash,
    value,
    size
  );
  return setTree(set, newRoot, size.value);
}

function tryGetHash<A>(set: HashSet<A>, value: A, hash: number): Maybe<A> {
  let node  = set._root;
  let shift = 0;
  const eq  = set.config.equals_;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    switch (node._tag) {
      case "LeafNode": {
        return eq(node.value, value) ? Just(node.value) : Nothing();
      }
      case "CollisionNode": {
        if (hash === node.hash) {
          const children = node.children;
          for (let i = 0, len = children.length; i < len; ++i) {
            const child = children[i]!;
            if ("value" in child && eq(child.value, value))
              return Just(child.value);
          }
        }
        return Nothing();
      }
      case "IndexNode": {
        const frag = hashFragment(shift, hash);
        const bit  = toBitmap(frag);
        if (node.mask & bit) {
          node   = node.children[fromBitmap(node.mask, bit)]!;
          shift += SIZE;
          break;
        }
        return Nothing();
      }
      case "ArrayNode": {
        node = node.children[hashFragment(shift, hash)]!;
        if (node) {
          shift += SIZE;
          break;
        }
        return Nothing();
      }
      default: {
        return Nothing();
      }
    }
  }
}

function hasHash<A>(set: HashSet<A>, value: A, hash: number): boolean {
  return tryGetHash(set, value, hash).isJust();
}
