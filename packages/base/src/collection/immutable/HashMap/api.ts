import type { Node, UpdateFn } from "./internal.js";
import type { HashMapF } from "@fncts/base/collection/immutable/HashMap/definition";

import { HashMapIterator } from "@fncts/base/collection/immutable/HashMap/definition";
import {
  _EmptyNode,
  fromBitmap,
  hashFragment,
  isEmptyNode,
  SIZE,
  toBitmap,
} from "@fncts/base/collection/immutable/HashMap/internal";
import * as P from "@fncts/base/prelude";

/**
 * Does `map` contain any elements?
 *
 * @tsplus getter fncts.collection.immutable.HashMap isEmpty
 */
export function isEmpty<K, V>(map: HashMap<K, V>): boolean {
  return map && !!isEmptyNode(map.root);
}

/**
 * Creates a new map
 *
 * @tsplus static fncts.collection.immutable.HashMapOps make
 */
export function make<K, V>(K: P.Hash<K> & P.Eq<K>) {
  return new HashMap<K, V>(false, 0, K, _EmptyNode, 0);
}

/**
 * Make a new map that has randomly cached hash and structural equality
 *
 * @tsplus static fncts.collection.immutable.HashMapOps makeDefault
 */
export function makeDefault<K, V>() {
  return make<K, V>(P.HashEq.StructuralStrict);
}

/**
 * Makes a new map from a Foldable of key-value pairs
 *
 * @tsplus fluent fncts.collection.immutable.HashMapOps fromFoldable
 */
export function fromFoldable<F extends P.HKT, C, K, A>(
  C: P.HashEq<K>,
  S: P.Semigroup<A>,
  F: P.Foldable<F, C>,
) {
  return <K_, Q, W, X, I, S, R, E>(
    fka: P.HKT.Kind<F, C, K_, Q, W, X, I, S, R, E, readonly [K, A]>,
  ): HashMap<K, A> => {
    return F.foldLeft_(fka, make(C), (b, [k, a]) => {
      const oa = get_(b, k);
      if (oa.isJust()) {
        return set_(b, k, S.combine_(oa.value, a));
      } else {
        return set_(b, k, a);
      }
    });
  };
}

/**
 * Lookup the value for `key` in `map` using custom hash.
 *
 * @tsplus fluent fncts.collection.immutable.HashMap getHash
 */
export function getHash_<K, V>(map: HashMap<K, V>, key: K, hash: number): Maybe<V> {
  return tryGetHash(map, key, hash);
}

/**
 * Lookup the value for `key` in `map` using internal hash function.
 *
 * @tsplus fluent fncts.collection.immutable.HashMap get
 */
export function get_<K, V>(map: HashMap<K, V>, key: K): Maybe<V> {
  return tryGetHash(map, key, map.config.hash(key));
}

/**
 * Does an entry exist for `key` in `map`? Uses custom `hash`.
 *
 * @tsplus fluent fncts.collection.immutable.HashMap hashHash
 */
export function hasHash_<K, V>(map: HashMap<K, V>, key: K, hash: number): boolean {
  return tryGetHash(map, key, hash).isJust();
}

/**
 * Does an entry exist for `key` in `map`? Uses internal hash function.
 *
 * @tsplus fluent fncts.collection.immutable.HashMap has
 */
export function has_<K, V>(map: HashMap<K, V>, key: K): boolean {
  return tryGetHash(map, key, map.config.hash(key)).isJust();
}

/**
 * Alter the value stored for `key` in `map` using function `f` using custom hash.
 *
 *  `f` is invoked with the current value for `k` if it exists,
 * or no arguments if no such value exists.
 *
 * `modify` will always either update or insert a value into the map.
 * Returns a map with the modified value. Does not alter `map`.
 *
 * @tsplus fluent fncts.collection.immutable.HashMap modifyHash
 */
export function modifyHash_<K, V>(
  map: HashMap<K, V>,
  key: K,
  hash: number,
  f: UpdateFn<V>,
): HashMap<K, V> {
  const size    = { value: map.size };
  const newRoot = map.root.modify(
    map.editable ? map.edit : NaN,
    map.config.equals_,
    0,
    f,
    hash,
    key,
    size,
  );
  return setTree(map, newRoot, size.value);
}

/**
 * Alter the value stored for `key` in `map` using function `f` using internal hash function.
 *
 *  `f` is invoked with the current value for `k` if it exists,
 * or no arguments if no such value exists.
 *
 * `modify` will always either update or insert a value into the map.
 * Returns a map with the modified value. Does not alter `map`.
 *
 * @tsplus fluent fncts.collection.immutable.HashMap modify
 */
export function modify_<K, V>(map: HashMap<K, V>, key: K, f: UpdateFn<V>): HashMap<K, V> {
  return map.modifyHash(key, map.config.hash(key), f);
}

/**
 * Store `value` for `key` in `map` using internal hash function.
 *
 * @tsplus fluent fncts.collection.immutable.HashMap set
 */
export function set_<K, V>(map: HashMap<K, V>, key: K, value: V): HashMap<K, V> {
  return map.modify(key, () => Just(value));
}

/**
 *  Remove the entry for `key` in `map` using internal hash.
 *
 * @tsplus fluent fncts.collection.immutable.HashMap remove
 */
export function remove_<K, V>(map: HashMap<K, V>, key: K): HashMap<K, V> {
  return map.modify(key, () => Nothing());
}

/**
 * Remove many keys
 *
 * @tsplus fluent fncts.collection.immutable.HashMap removeMany
 */
export function removeMany_<K, V>(map: HashMap<K, V>, ks: Iterable<K>): HashMap<K, V> {
  return mutate_(map, (m) => {
    for (const k of ks) {
      m.remove(k);
    }
  });
}

/**
 * Mark `map` as mutable.
 *
 * @tsplus getter fncts.collection.immutable.HashMap beginMutation
 */
export function beginMutation<K, V>(map: HashMap<K, V>) {
  return new HashMap(true, map.edit + 1, map.config, map.root, map.size);
}

/**
 * Mark `map` as immutable.
 *
 * @tsplus getter fncts.collection.immutable.HashMap endMutation
 */
export function endMutation<K, V>(map: HashMap<K, V>) {
  map.editable = false;
  return map;
}

/**
 * Mutate `map` within the context of `f`.
 *
 * @tsplus fluent fncts.collection.immutable.HashMap mutate
 */
export function mutate_<K, V>(map: HashMap<K, V>, f: (map: HashMap<K, V>) => void) {
  const transient = map.beginMutation;
  f(transient);
  return transient.endMutation;
}

/**
 * Get an IterableIterator of the map keys
 *
 * @tsplus getter fncts.collection.immutable.HashMap keys
 */
export function keys<K, V>(map: HashMap<K, V>): IterableIterator<K> {
  return new HashMapIterator(map, ([k]) => k);
}

/**
 * Get the set of keys
 */
export function keySet<K, V>(self: HashMap<K, V>): HashSet<K> {
  return HashSet.make(self.config).mutate((set) => {
    self.forEachWithIndex((k) => {
      set.add(k);
    });
  });
}

/**
 * Get the set of values
 */
export function toSetDefault<K, V>(map: HashMap<K, V>): HashSet<V> {
  return HashSet.makeDefault<V>().mutate((set) => {
    map.forEach((v) => {
      set.add(v);
    });
  });
}

/**
 * Get an IterableIterator of the map values
 *
 * @tsplus getter fncts.collection.immutable.HashMap values
 */
export function values<K, V>(map: HashMap<K, V>): IterableIterator<V> {
  return new HashMapIterator(map, ([, v]) => v);
}

/**
 * Update a value if exists
 *
 * @tsplus fluent fncts.collection.immutable.HashMap update
 */
export function update_<K, V>(map: HashMap<K, V>, key: K, f: (v: V) => V) {
  return map.modify(key, (v) => v.map(f));
}

/**
 * Apply f to each element
 *
 * @tsplus fluent fncts.collection.immutable.HashMap forEachWithIndex
 */
export function forEachWithIndex_<K, V>(
  map: HashMap<K, V>,
  f: (k: K, v: V, m: HashMap<K, V>) => void,
): void {
  map.foldLeftWithIndex(undefined as void, (key, _, value) => f(key, value, map));
}

/**
 * Apply f to each element
 *
 * @tsplus fluent fncts.collection.immutable.HashMap forEach
 */
export function forEach_<K, V>(map: HashMap<K, V>, f: (v: V, m: HashMap<K, V>) => void): void {
  return map.forEachWithIndex((_, v, m) => f(v, m));
}

/**
 * Maps over the map entries
 *
 * @tsplus fluent fncts.collection.immutable.HashMap mapWithIndex
 */
export function mapWithIndex_<K, V, A>(fa: HashMap<K, V>, f: (k: K, v: V) => A): HashMap<K, A> {
  return fa.foldLeftWithIndex(make<K, A>(fa.config), (k, z, v) => z.set(k, f(k, v)));
}

/**
 * Maps over the map entries
 *
 * @tsplus fluent fncts.collection.immutable.HashMap map
 */
export function map_<K, V, A>(fa: HashMap<K, V>, f: (v: V) => A): HashMap<K, A> {
  return fa.mapWithIndex((_, a) => f(a));
}

/**
 * Chain over the map entries, the hash and equal of the 2 maps has to be the same
 *
 * @tsplus fluent fncts.collection.immutable.HashMap chainWithIndex
 */
export function chainWithIndex_<K, V, A>(
  ma: HashMap<K, V>,
  f: (k: K, v: V) => HashMap<K, A>,
): HashMap<K, A> {
  return ma.foldLeftWithIndex(make<K, A>(ma.config), (k, z, v) =>
    z.mutate((m) => {
      f(k, v).forEachWithIndex((k1, a1) => {
        m.set(k1, a1);
      });
    }),
  );
}

/**
 * Chain over the map entries, the hash and equal of the 2 maps has to be the same
 *
 * @tsplus fluent fncts.collection.immutable.HashMap chain
 */
export function chain_<K, V, A>(ma: HashMap<K, V>, f: (v: V) => HashMap<K, A>): HashMap<K, A> {
  return ma.chainWithIndex((_, a) => f(a));
}

/**
 * Removes None values
 */
export function compact<K, A>(fa: HashMap<K, Maybe<A>>): HashMap<K, A> {
  return filterMap_(fa, (a) => a);
}

export function separate<K, A, B>(
  fa: HashMap<K, Either<A, B>>,
): readonly [HashMap<K, A>, HashMap<K, B>] {
  return partitionMap_(fa, (a) => a);
}

/**
 * Filter out None and map
 *
 * @tsplus fluent fncts.collection.immutable.HashMap filterMapWithIndex
 */
export function filterMapWithIndex_<K, A, B>(
  fa: HashMap<K, A>,
  f: (k: K, a: A) => Maybe<B>,
): HashMap<K, B> {
  const m = make<K, B>(fa.config);

  return m.mutate((m) => {
    for (const [k, a] of fa) {
      const o = f(k, a);
      if (o.isJust()) {
        m.set(k, o.value);
      }
    }
  });
}

/**
 * Filter out None and map
 *
 * @tsplus fluent fncts.collection.immutable.HashMap filterMap
 */
export function filterMap_<K, A, B>(fa: HashMap<K, A>, f: (a: A) => Maybe<B>): HashMap<K, B> {
  return fa.filterMapWithIndex((_, a) => f(a));
}

/**
 * Filter out by predicate
 *
 * @tsplus fluent fncts.collection.immutable.HashMap filterWithIndex
 */
export function filterWithIndex_<K, A, B extends A>(
  fa: HashMap<K, A>,
  refinement: RefinementWithIndex<K, A, B>,
): HashMap<K, B>;
export function filterWithIndex_<K, A>(
  fa: HashMap<K, A>,
  predicate: PredicateWithIndex<K, A>,
): HashMap<K, A>;
export function filterWithIndex_<K, A>(
  fa: HashMap<K, A>,
  predicate: PredicateWithIndex<K, A>,
): HashMap<K, A> {
  const m = make<K, A>(fa.config);

  return m.mutate((m) => {
    for (const [k, a] of fa) {
      if (predicate(k, a)) {
        m.set(k, a);
      }
    }
  });
}

/**
 * Filter out by predicate
 *
 * @tsplus fluent fncts.collection.immutable.HashMap filter
 */
export function filter_<K, A, B extends A>(
  fa: HashMap<K, A>,
  refinement: Refinement<A, B>,
): HashMap<K, B>;
export function filter_<K, A>(fa: HashMap<K, A>, predicate: Predicate<A>): HashMap<K, A>;
export function filter_<K, A>(fa: HashMap<K, A>, predicate: Predicate<A>): HashMap<K, A> {
  return fa.filterWithIndex((_, a) => predicate(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.HashMap partitionMapWithIndex
 */
export function partitionMapWithIndex_<K, V, A, B>(
  fa: HashMap<K, V>,
  f: (i: K, a: V) => Either<A, B>,
): readonly [HashMap<K, A>, HashMap<K, B>] {
  const left  = make<K, A>(fa.config).beginMutation;
  const right = make<K, B>(fa.config).beginMutation;

  fa.forEachWithIndex((k, v) => {
    f(k, v).match(
      (a) => {
        left.set(k, a);
      },
      (b) => {
        right.set(k, b);
      },
    );
  });

  return [left.endMutation, right.endMutation];
}

/**
 * @tsplus fluent fncts.collection.immutable.HashMap partitionMap
 */
export function partitionMap_<K, V, A, B>(
  fa: HashMap<K, V>,
  f: (a: V) => Either<A, B>,
): readonly [HashMap<K, A>, HashMap<K, B>] {
  return fa.partitionMapWithIndex((_, a) => f(a));
}

/**
 * @tsplus fluent fncts.collection.immutable.HashMap partitionWithIndex
 */
export function partitionWithIndex_<K, V, B extends V>(
  fa: HashMap<K, V>,
  refinement: RefinementWithIndex<K, V, B>,
): readonly [HashMap<K, V>, HashMap<K, B>];
export function partitionWithIndex_<K, V>(
  fa: HashMap<K, V>,
  predicate: PredicateWithIndex<K, V>,
): readonly [HashMap<K, V>, HashMap<K, V>];
export function partitionWithIndex_<K, V>(
  fa: HashMap<K, V>,
  predicate: PredicateWithIndex<K, V>,
): readonly [HashMap<K, V>, HashMap<K, V>] {
  const left  = make<K, V>(fa.config).beginMutation;
  const right = make<K, V>(fa.config).beginMutation;

  fa.forEachWithIndex((k, v) => {
    if (predicate(k, v)) {
      right.set(k, v);
    } else {
      left.set(k, v);
    }
  });

  return [left.endMutation, right.endMutation];
}

/**
 * @tsplus fluent fncts.collection.immutable.HashMap partition
 */
export function partition_<K, V, B extends V>(
  fa: HashMap<K, V>,
  refinement: Refinement<V, B>,
): readonly [HashMap<K, V>, HashMap<K, B>];
export function partition_<K, V>(
  fa: HashMap<K, V>,
  predicate: Predicate<V>,
): readonly [HashMap<K, V>, HashMap<K, V>];
export function partition_<K, V>(
  fa: HashMap<K, V>,
  predicate: Predicate<V>,
): readonly [HashMap<K, V>, HashMap<K, V>] {
  return fa.partitionWithIndex((_, a) => predicate(a));
}

/**
 * Reduce a state over the map entries
 *
 * @tsplus fluent fncts.collection.immutable.HashMap foldLeftWithIndex
 */
export function foldLeftWithIndex_<K, V, Z>(
  map: HashMap<K, V>,
  z: Z,
  f: (r: K, z: Z, v: V) => Z,
): Z {
  const root = map.root;
  if (root._tag === "LeafNode") return root.value.isJust() ? f(root.key, z, root.value.value) : z;
  if (root._tag === "EmptyNode") {
    return z;
  }
  const toVisit = [root.children];
  let children;
  while ((children = toVisit.pop())) {
    for (let i = 0, len = children.length; i < len; ) {
      const child = children[i++];
      if (child && !isEmptyNode(child)) {
        if (child._tag === "LeafNode") {
          if (child.value.isJust()) {
            // eslint-disable-next-line no-param-reassign
            z = f(child.key, z, child.value.value);
          }
        } else {
          toVisit.push(child.children);
        }
      }
    }
  }
  return z;
}

/**
 * Reduce a state over the map entries
 *
 * @tsplus fluent fncts.collection.immutable.HashMap foldLeft
 */
export function foldLeft_<K, V, Z>(map: HashMap<K, V>, z: Z, f: (z: Z, v: V) => Z): Z {
  return map.foldLeftWithIndex(z, (_, b, a) => f(b, a));
}

export const traverseWithIndex_: P.traverseWithIndex_<HashMapF> =
  P.mkTraverseWithIndex_<HashMapF>()(
    () => (A) => (ta, f) =>
      foldLeftWithIndex_(ta, A.pure(make(ta.config)), (k, b, a) =>
        A.zipWith_(b, f(k, a), (map, b) => map.set(k, b)),
      ),
  );

export const traverseWithIndex: P.traverseWithIndex<HashMapF> = (A) => {
  const traverseWithIndexA_ = traverseWithIndex_(A);
  return (f) => (ta) => traverseWithIndexA_(ta, f);
};

/**
 * @tsplus getter fncts.collection.immutable.HashMap traverseWithIndex
 */
export const traverseWithIndexSelf: P.traverseWithIndexSelf<HashMapF> = (self) => (A) => (f) =>
  traverseWithIndex_(A)(self, f);

export const traverse_: P.traverse_<HashMapF> = (A) => {
  const traverseWithIndexA_ = traverseWithIndex_(A);
  return (ta, f) => traverseWithIndexA_(ta, (_, a) => f(a));
};

export const traverse: P.traverse<HashMapF> = (A) => {
  const traverseWithIndexA_ = traverseWithIndex_(A);
  return (f) => (ta) => traverseWithIndexA_(ta, (_, a) => f(a));
};

/**
 * @tsplus getter fncts.collection.immutable.HashMap traverse
 */
export const traverseSelf: P.traverseSelf<HashMapF> = (self) => (A) => (f) =>
  traverseWithIndex_(A)(self, (_, a) => f(a));

export const witherWithIndex_: P.witherWithIndex_<HashMapF> = (A) => (wa, f) =>
  A.map_(wa.traverseWithIndex(A)(f), compact);

export const witherWithIndex: P.witherWithIndex<HashMapF> = (A) => {
  const witherWithIndexA_ = witherWithIndex_(A);
  return (f) => (ta) => witherWithIndexA_(ta, f);
};

/**
 * @tsplus getter fncts.collection.immutable.HashMap witherWithIndex
 */
export const witherWithIndexSelf: P.witherWithIndexSelf<HashMapF> = (self) => (A) => (f) =>
  witherWithIndex_(A)(self, f);

export const wither_: P.wither_<HashMapF> = (A) => {
  const witherWithIndexA_ = witherWithIndex_(A);
  return (wa, f) => witherWithIndexA_(wa, (_, a) => f(a));
};

export const wither: P.wither<HashMapF> = (A) => {
  const witherWithIndexA_ = witherWithIndex_(A);
  return (f) => (wa) => witherWithIndexA_(wa, (_, a) => f(a));
};

/**
 * @tsplus getter fncts.collection.immutable.HashMap wither
 */
export const witherSelf: P.witherSelf<HashMapF> = (self) => (A) => (f) =>
  self.witherWithIndex(A)((_, a) => f(a));

export const wiltWithIndex_: P.wiltWithIndex_<HashMapF> = (A) => {
  const traverseWithIndexA_ = traverseWithIndex_(A);
  return (wa, f) => traverseWithIndexA_(wa, f).via(A.map(separate));
};

export const wiltWithIndex: P.wiltWithIndex<HashMapF> = (A) => {
  const wiltWithIndexA_ = wiltWithIndex_(A);
  return (f) => (wa) => wiltWithIndexA_(wa, f);
};

/**
 * @tsplus getter fncts.collection.immutable.HashMap wiltWithIndex
 */
export const wiltWithIndexSelf: P.wiltWithIndexSelf<HashMapF> = (self) => (A) => (f) =>
  wiltWithIndex_(A)(self, f);

export const wilt_: P.wilt_<HashMapF> = (A) => {
  const wiltWithIndexA_ = wiltWithIndex_(A);
  return (wa, f) => wiltWithIndexA_(wa, (_, a) => f(a));
};

export const wilt: P.wilt<HashMapF> = (A) => {
  const wiltWithIndexA_ = wiltWithIndex_(A);
  return (f) => (wa) => wiltWithIndexA_(wa, (_, a) => f(a));
};

/**
 * @tsplus getter fncts.collection.immutable.HashMap wilt
 */
export const wiltSelf: P.wiltSelf<HashMapF> = (self) => (A) => (f) =>
  self.wiltWithIndex(A)((_, a) => f(a));

/**
 * @tsplus fluent fncts.collection.immutable.HashMap concatWith
 */
export function concatWith_<K, A>(
  xs: HashMap<K, A>,
  ys: Iterable<readonly [K, A]>,
  f: (x: A, y: A) => A,
): HashMap<K, A> {
  return xs.mutate((m) => {
    for (const [k, a] of ys) {
      m.modify(k, (v) =>
        v.match(
          () => Just(a),
          (a0) => Just(f(a0, a)),
        ),
      );
    }
  });
}

/**
 * @tsplus fluent fncts.collection.immutable.HashMap concat
 */
export function concat_<K, A>(xs: HashMap<K, A>, ys: Iterable<readonly [K, A]>): HashMap<K, A> {
  return xs.mutate((m) => {
    for (const [k, a] of ys) {
      m.set(k, a);
    }
  });
}

/**
 * @tsplus fluent fncts.collection.immutable.HashMap pop
 */
export function pop_<K, A>(m: HashMap<K, A>, k: K): Maybe<readonly [A, HashMap<K, A>]> {
  return m.get(k).map((a) => [a, m.remove(k)]);
}

/*
 * -------------------------------------------------------------------------------------------------
 * internal
 * -------------------------------------------------------------------------------------------------
 */

/**
 * Set the root of the map
 */
function setTree<K, V>(map: HashMap<K, V>, newRoot: Node<K, V>, newSize: number) {
  if (map.editable) {
    map.root = newRoot;
    map.size = newSize;
    return map;
  }
  return newRoot === map.root
    ? map
    : new HashMap(map.editable, map.edit, map.config, newRoot, newSize);
}

/**
 * Lookup the value for `key` in `map` using custom hash.
 */
function tryGetHash<K, V>(map: HashMap<K, V>, key: K, hash: number): Maybe<V> {
  let node    = map.root;
  let shift   = 0;
  const keyEq = map.config.equals_;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    switch (node._tag) {
      case "LeafNode": {
        return keyEq(node.key, key) ? node.value : Nothing();
      }
      case "CollisionNode": {
        if (hash === node.hash) {
          const children = node.children;
          for (let i = 0, len = children.length; i < len; ++i) {
            const child = children[i]!;
            if ("key" in child && keyEq(child.key, key)) return child.value;
          }
        }
        return Nothing();
      }
      case "IndexedNode": {
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
      default:
        return Nothing();
    }
  }
}
