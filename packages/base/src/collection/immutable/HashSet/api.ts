import type { Node } from "@fncts/base/collection/immutable/HashSet/definition";

import { fromBitmap, hashFragment, SIZE, toBitmap } from "@fncts/base/collection/immutable/HashMap/internal";
import { _EmptyNode, HashSet, isEmptyNode } from "@fncts/base/collection/immutable/HashSet/definition";
import { tuple } from "@fncts/base/data/function";
import { Stack } from "@fncts/base/internal/Stack";
import * as P from "@fncts/base/typeclass";
import { HashEq } from "@fncts/base/typeclass";

/**
 * @tsplus pipeable fncts.HashSet add
 */
export function add<A>(value: A) {
  return (self: HashSet<A>): HashSet<A> => {
    return modifyHash(self, value, self.config.hash(value), false);
  };
}

/**
 * Mark `set` as mutable.
 *
 * @tsplus getter fncts.HashSet beginMutation
 */
export function beginMutation<K>(self: HashSet<K>): HashSet<K> {
  return new HashSet(true, self._edit + 1, self.config, self._root, self._size);
}

/**
 * Mark `set` as immutable.
 *
 * @tsplus getter fncts.HashSet endMutation
 */
export function endMutation<K>(self: HashSet<K>): HashSet<K> {
  self._editable = false;
  return self;
}

/**
 * Appy f to each element
 *
 * @tsplus pipeable fncts.HashSet forEach
 */
export function forEach<V>(f: (v: V, m: HashSet<V>) => void) {
  return (self: HashSet<V>): void => {
    self.foldLeft(undefined as void, (_, value) => f(value, self));
  };
}

/**
 * @tsplus pipeable fncts.HashSet has
 */
export function has<A>(value: A) {
  return (self: HashSet<A>): boolean => {
    return hasHash(self, value, self.config.hash(value));
  };
}

/**
 * @tsplus static fncts.HashSetOps emptyWith
 */
export function emptyWith<A>(config: HashEq<A>): HashSet<A> {
  return new HashSet(false, 0, config, _EmptyNode, 0);
}

/**
 * @tsplus static fncts.HashSetOps empty
 */
export function empty<A>(): HashSet<A> {
  return emptyWith<A>(P.HashEq.StructuralStrict);
}

/**
 * @tsplus static fncts.HashSetOps make
 */
export function make<A>(...values: ReadonlyArray<A>): HashSet<A> {
  return empty<A>().mutate((set) => {
    values.forEach((v) => {
      set.add(v);
    });
  });
}

/**
 * Mutate `set` within the context of `f`.
 *
 * @tsplus pipeable fncts.HashSet mutate
 */
export function mutate<A>(transient: (set: HashSet<A>) => void) {
  return (self: HashSet<A>): HashSet<A> => {
    const s = beginMutation(self);
    transient(s);
    return endMutation(s);
  };
}

/**
 * @tsplus pipeable fncts.HashSet remove
 */
export function remove<A>(value: A) {
  return (self: HashSet<A>): HashSet<A> => {
    return modifyHash(self, value, self.config.hash(value), true);
  };
}

/**
 * @tsplus pipeable fncts.HashSet removeMany
 */
export function removeMany<A>(values: Iterable<A>) {
  return (self: HashSet<A>): HashSet<A> => {
    const out = self.beginMutation;
    for (const v of values) {
      out.remove(v);
    }
    return out.endMutation;
  };
}

/**
 * Calculate the number of keys pairs in a set
 *
 * @tsplus getter fncts.HashSet size
 */
export function size<A>(self: HashSet<A>): number {
  return self._size;
}

/**
 * If element is present remove it, if not add it
 *
 * @tsplus pipeable fncts.HashSet toggle
 */
export function toggle<A>(a: A) {
  return (self: HashSet<A>): HashSet<A> => {
    return self.has(a) ? self.remove(a) : self.add(a);
  };
}

/**
 * Projects a Set through a function
 */
export function mapWith<B>(B: P.HashEq<B>): <A>(f: (a: A) => B) => (self: HashSet<A>) => HashSet<B> {
  const r = emptyWith(B);
  return (f) => (fa) =>
    r.mutate((r) => {
      fa.forEach((e) => {
        const v = f(e);
        if (!r.has(v)) {
          r.add(v);
        }
      });
      return r;
    });
}

/**
 * Projects a Set through a function
 *
 * @tsplus pipeable fncts.HashSet map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: HashSet<A>): HashSet<B> => {
    return mapWith<B>(HashEq.StructuralStrict)(f)(self);
  };
}

/**
 * Map + Flatten
 */
export function flatMapWith<B>(C: P.HashEq<B>): <A>(f: (x: A) => Iterable<B>) => (self: HashSet<A>) => HashSet<B> {
  const r = emptyWith<B>(C);
  return (f) => (self) =>
    r.mutate((r) => {
      self.forEach((e) => {
        for (const a of f(e)) {
          if (!r.has(a)) {
            r.add(a);
          }
        }
      });
      return r;
    });
}

/**
 * @tsplus pipeable fncts.HashSet flatMap
 */
export function flatMap<A, B>(f: (a: A) => Iterable<B>) {
  return (self: HashSet<A>): HashSet<B> => {
    return flatMapWith<B>(HashEq.StructuralStrict)(f)(self);
  };
}

/**
 * Creates an equal for a set
 *
 * @tsplus static fncts.HashSetOps getEq
 */
export function getEq<A>(): P.Eq<HashSet<A>> {
  return P.Eq({
    equals: (y) => (x) => {
      if (y === x) {
        return true;
      }
      if (size(x) !== size(y)) {
        return false;
      }
      let eq = true;
      for (const vx of x) {
        if (!y.has(vx)) {
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
 * @tsplus pipeable fncts.HashSet filter
 */
export function filter<A, B extends A>(refinement: Refinement<A, B>): (set: HashSet<A>) => HashSet<B>;
export function filter<A>(predicate: Predicate<A>): (set: HashSet<A>) => HashSet<A>;
export function filter<A>(predicate: Predicate<A>) {
  return (set: HashSet<A>): HashSet<A> => {
    const r = emptyWith(set.config);
    return r.mutate((r) => {
      set.forEach((v) => {
        if (predicate(v)) {
          r.add(v);
        }
      });
    });
  };
}

export function filterMapWith<B>(B: P.HashEq<B>): <A>(f: (a: A) => Maybe<B>) => (fa: HashSet<A>) => HashSet<B> {
  return (f) => (fa) => {
    const out = beginMutation(emptyWith(B));
    fa.forEach((a) => {
      const ob = f(a);
      if (ob.isJust()) {
        out.add(ob.value);
      }
    });
    return endMutation(out);
  };
}

/**
 * @tsplus pipeable fncts.HashSet filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>): (self: HashSet<A>) => HashSet<B> {
  return filterMapWith<B>(HashEq.StructuralStrict)(f);
}

/**
 * Partition set values using predicate
 *
 * @tsplus pipeable fncts.HashSet partition
 */
export function partition<A, B extends A>(p: Refinement<A, B>): (self: HashSet<A>) => readonly [HashSet<A>, HashSet<B>];
export function partition<A>(p: Predicate<A>): (self: HashSet<A>) => readonly [HashSet<A>, HashSet<A>];
export function partition<A>(p: Predicate<A>) {
  return (self: HashSet<A>): readonly [HashSet<A>, HashSet<A>] => {
    const right = beginMutation(emptyWith(self.config));
    const left  = beginMutation(emptyWith(self.config));
    self.forEach((v) => {
      if (p(v)) {
        right.add(v);
      } else {
        left.add(v);
      }
    });
    return tuple(endMutation(left), endMutation(right));
  };
}

/**
 * Partition set values using predicate
 */
export function partitionMapWith<B, C>(
  B: P.HashEq<B>,
  C: P.HashEq<C>,
): <A>(f: (a: A) => Either<B, C>) => (self: HashSet<A>) => readonly [HashSet<B>, HashSet<C>] {
  return (f) => (fa) => {
    const right = beginMutation(emptyWith(C));
    const left  = beginMutation(emptyWith(B));
    fa.forEach((v) => {
      f(v).match(
        (b) => {
          left.add(b);
        },
        (c) => {
          right.add(c);
        },
      );
    });
    return [endMutation(left), endMutation(right)];
  };
}

/**
 * @tsplus pipeable fncts.HashSet partitionMap
 */
export function partitionMap<A, B, C>(
  f: (a: A) => Either<B, C>,
): (self: HashSet<A>) => readonly [HashSet<B>, HashSet<C>] {
  return partitionMapWith<B, C>(HashEq.StructuralStrict, HashEq.StructuralStrict)(f);
}

/**
 * Reduce a state over the set elements
 *
 * @tsplus pipeable fncts.HashSet foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, v: A) => B) {
  return (self: HashSet<A>): B => {
    const root = self._root;
    if (root._tag === "LeafNode") return f(b, root.value);
    if (root._tag === "EmptyNode") return b;
    const toVisit: Stack<Array<Node<A>>> = Stack();
    toVisit.push(root.children);
    while (toVisit.hasNext) {
      const children = toVisit.pop()!;
      for (let i = 0, len = children.length; i < len; ) {
        const child = children[i++];
        if (child && !isEmptyNode(child)) {
          if (child._tag === "LeafNode") {
            // eslint-disable-next-line no-param-reassign
            b = f(b, child.value);
          } else {
            toVisit.push(child.children);
          }
        }
      }
    }
    return b;
  };
}

/**
 * @tsplus pipeable fncts.HashSet join
 */
export function join(separator: string) {
  return (self: HashSet<string>): string => {
    if (self.size === 0) {
      return "";
    }
    const iterator = self[Symbol.iterator]();
    let first      = true;
    let s          = "";
    let result: IteratorResult<string>;
    while (!(result = iterator.next()).done) {
      if (first) {
        first  = false;
        s     += result.value;
        result = iterator.next();
      } else {
        s += separator;
        s += result.value;
      }
    }
    return s;
  };
}

/**
 * Form the set difference
 *
 * @tsplus pipeable fncts.HashSet difference
 */
export function difference<A>(that: Iterable<A>) {
  return (self: HashSet<A>): HashSet<A> => {
    return self.mutate((s) => {
      for (const k of that) {
        s.remove(k);
      }
    });
  };
}

/**
 * true if all elements match predicate
 *
 * @tsplus pipeable fncts.HashSet every
 */
export function every<A>(predicate: Predicate<A>) {
  return (self: HashSet<A>): boolean => {
    for (const e of self) {
      if (!predicate(e)) {
        return false;
      }
    }
    return true;
  };
}

/**
 * The set of elements which are in both the first and second set,
 *
 * the hash and equal of the 2 sets has to be the same
 *
 * @tsplus pipeable fncts.HashSet intersection
 */
export function intersection<A>(that: Iterable<A>) {
  return (self: HashSet<A>): HashSet<A> => {
    const out = emptyWith<A>(self.config);
    return out.mutate((y) => {
      for (const k of that) {
        if (self.has(k)) {
          y.add(k);
        }
      }
    });
  };
}

/**
 * `true` if and only if every element in the first set is an element of the second set,
 *
 * the hash and equal of the 2 sets has to be the same
 *
 * @tsplus pipeable fncts.HashSet isSubset
 */
export function isSubset<A>(that: HashSet<A>) {
  return (self: HashSet<A>): boolean => self.every((a) => that.has(a));
}

/**
 * true if one or more elements match predicate
 *
 * @tsplus pipeable fncts.HashSet some
 */
export function some<A>(predicate: Predicate<A>) {
  return (self: HashSet<A>): boolean => {
    let found = false;
    for (const e of self) {
      found = predicate(e);
      if (found) {
        break;
      }
    }
    return found;
  };
}

/**
 * Form the union of two sets,
 *
 * the hash and equal of the 2 sets has to be the same
 *
 * @tsplus pipeable fncts.HashSet union
 */
export function union<A>(that: Iterable<A>) {
  return (self: HashSet<A>): HashSet<A> => {
    return self.mutate((x) => {
      for (const a of that) {
        x.add(a);
      }
    });
  };
}

/**
 * @tsplus pipeable fncts.HashSet toArray
 */
export function toArray<A>(O: P.Ord<A>) {
  return (self: HashSet<A>): ReadonlyArray<A> => {
    const r: Array<A> = [];
    self.forEach((a) => r.push(a));
    return r.sort((a, b) => O.compare(b)(a));
  };
}

function setTree<A>(set: HashSet<A>, newRoot: Node<A>, newSize: number) {
  if (set._editable) {
    set._root = newRoot;
    set._size = newSize;
    return set;
  }
  return newRoot === set._root ? set : new HashSet(set._editable, set._edit, set.config, newRoot, newSize);
}

function modifyHash<A>(set: HashSet<A>, value: A, hash: number, remove: boolean): HashSet<A> {
  const size    = { value: set._size };
  const newRoot = set._root.modify(remove, set._editable ? set._edit : NaN, set.config.equals, 0, hash, value, size);
  return setTree(set, newRoot, size.value);
}

function tryGetHash<A>(set: HashSet<A>, value: A, hash: number): Maybe<A> {
  let node  = set._root;
  let shift = 0;
  const eq  = set.config.equals;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    switch (node._tag) {
      case "LeafNode": {
        return eq(value)(node.value) ? Just(node.value) : Nothing();
      }
      case "CollisionNode": {
        if (hash === node.hash) {
          const children = node.children;
          for (let i = 0, len = children.length; i < len; ++i) {
            const child = children[i]!;
            if ("value" in child && eq(value)(child.value)) return Just(child.value);
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
