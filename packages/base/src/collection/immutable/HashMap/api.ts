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
import { pipe } from "@fncts/base/data/function";
import * as P from "@fncts/base/typeclass";

/**
 * Does `map` contain any elements?
 *
 * @tsplus getter fncts.HashMap isEmpty
 */
export function isEmpty<K, V>(self: HashMap<K, V>): boolean {
  return self && isEmptyNode(self.root);
}

/**
 * Creates a new map
 *
 * @tsplus static fncts.HashMapOps makeWith
 */
export function makeWith<K, V>(config: P.HashEq<K>): HashMap<K, V> {
  return new HashMap<K, V>(false, 0, config, _EmptyNode, 0);
}

/**
 * @tsplus static fncts.HashMapOps __call
 */
export function make<K, V>(...items: ReadonlyArray<readonly [K, V]>): HashMap<K, V> {
  return HashMap.empty<any, any>().mutate((map) => {
    for (const [key, value] of items) {
      map.set(key, value);
    }
  });
}

/**
 * @tsplus static fncts.HashMapOps from
 */
export function from<K, V>(items: Iterable<readonly [K, V]>): HashMap<K, V> {
  return HashMap.empty<K, V>().mutate((map) => {
    for (const [key, value] of items) {
      map.set(key, value);
    }
  });
}

/**
 * Make a new map that has randomly cached hash and structural equality
 *
 * @tsplus static fncts.HashMapOps empty
 */
export function empty<K, V>(): HashMap<K, V> {
  return HashMap.makeWith<K, V>(P.HashEq.StructuralStrict);
}

/**
 * Makes a new map from a Foldable of key-value pairs
 *
 * @tsplus pipeable fncts.HashMapOps fromFoldable
 */
export function fromFoldable<F extends HKT, C, K, A>(config: P.HashEq<K>, S: P.Semigroup<A>, F: P.Foldable<F, C>) {
  return <K_, Q, W, X, I, S, R, E>(self: HKT.Kind<F, C, K_, Q, W, X, I, S, R, E, readonly [K, A]>): HashMap<K, A> => {
    return pipe(
      self,
      F.foldLeft(makeWith(config), (b, [k, a]) => {
        const oa: Maybe<A> = b.get(k);
        if (oa.isJust()) {
          return b.set(k, S.combine(a)(oa.value));
        } else {
          return b.set(k, a);
        }
      }),
    );
  };
}

/**
 * Lookup the value for `key` in `map` using custom hash.
 *
 * @tsplus pipeable fncts.HashMap getHash
 */
export function getHash<K>(key: K, hash: number) {
  return <V>(self: HashMap<K, V>): Maybe<V> => {
    return tryGetHash(self, key, hash);
  };
}

/**
 * Lookup the value for `key` in `map` using internal hash function.
 *
 * @tsplus pipeable fncts.HashMap get
 */
export function get<K>(key: K) {
  return <V>(self: HashMap<K, V>): Maybe<V> => {
    return tryGetHash(self, key, self.config.hash(key));
  };
}

/**
 * Does an entry exist for `key` in `map`? Uses custom `hash`.
 *
 * @tsplus pipeable fncts.HashMap hasHash
 */
export function hasHash<K>(key: K, hash: number) {
  return <V>(self: HashMap<K, V>): boolean => {
    return tryGetHash(self, key, hash).isJust();
  };
}

/**
 * Does an entry exist for `key` in `map`? Uses internal hash function.
 *
 * @tsplus pipeable fncts.HashMap has
 */
export function has<K>(key: K) {
  return <V>(self: HashMap<K, V>): boolean => {
    return tryGetHash(self, key, self.config.hash(key)).isJust();
  };
}

/**
 * Alter the value stored for `key` in `map` using function `f` using custom hash.
 *
 * `f` is invoked with the current value for `k` if it exists,
 * or no arguments if no such value exists.
 *
 * `modify` will always either update or insert a value into the map.
 * Returns a map with the modified value. Does not alter `map`.
 *
 * @tsplus pipeable fncts.HashMap modifyHash
 */
export function modifyHash<K, V>(key: K, hash: number, f: UpdateFn<V>) {
  return (self: HashMap<K, V>): HashMap<K, V> => {
    const size    = { value: self.size };
    const newRoot = self.root.modify(self.editable ? self.edit : NaN, self.config.equals, 0, f, hash, key, size);
    return setTree(self, newRoot, size.value);
  };
}

/**
 * Alter the value stored for `key` in `map` using function `f` using internal hash function.
 *
 * `f` is invoked with the current value for `k` if it exists,
 * or no arguments if no such value exists.
 *
 * `modify` will always either update or insert a value into the map.
 * Returns a map with the modified value. Does not alter `map`.
 *
 * @tsplus pipeable fncts.HashMap modify
 */
export function modify<K, V>(key: K, f: UpdateFn<V>) {
  return (self: HashMap<K, V>): HashMap<K, V> => {
    return self.modifyHash(key, self.config.hash(key), f);
  };
}

/**
 * Store `value` for `key` in `map` using internal hash function.
 *
 * @tsplus pipeable fncts.HashMap set
 */
export function set<K, V>(key: K, value: V) {
  return (self: HashMap<K, V>): HashMap<K, V> => {
    return self.modify(key, () => Just(value));
  };
}

/**
 * Remove the entry for `key` in `map` using internal hash.
 *
 * @tsplus pipeable fncts.HashMap remove
 */
export function remove<K>(key: K) {
  return <V>(self: HashMap<K, V>): HashMap<K, V> => {
    return self.modify(key, () => Nothing());
  };
}

/**
 * Remove many keys
 *
 * @tsplus pipeable fncts.HashMap removeMany
 */
export function removeMany<K>(keys: Iterable<K>) {
  return <V>(self: HashMap<K, V>): HashMap<K, V> => {
    return self.mutate((m) => {
      for (const k of keys) {
        m.remove(k);
      }
    });
  };
}

/**
 * Mark `map` as mutable.
 *
 * @tsplus getter fncts.HashMap beginMutation
 */
export function beginMutation<K, V>(self: HashMap<K, V>): HashMap<K, V> {
  return new HashMap(true, self.edit + 1, self.config, self.root, self.size);
}

/**
 * Mark `map` as immutable.
 *
 * @tsplus getter fncts.HashMap endMutation
 */
export function endMutation<K, V>(self: HashMap<K, V>): HashMap<K, V> {
  self.editable = false;
  return self;
}

/**
 * Mutate `map` within the context of `f`.
 *
 * @tsplus pipeable fncts.HashMap mutate
 */
export function mutate<K, V>(f: (map: HashMap<K, V>) => void) {
  return (self: HashMap<K, V>): HashMap<K, V> => {
    const transient = self.beginMutation;
    f(transient);
    return transient.endMutation;
  };
}

/**
 * Get an IterableIterator of the map keys
 *
 * @tsplus getter fncts.HashMap keys
 */
export function keys<K, V>(self: HashMap<K, V>): IterableIterator<K> {
  return new HashMapIterator(self, ([k]) => k);
}

/**
 * Get the set of keys
 *
 * @tsplus getter fncts.HashMap keySet
 */
export function keySet<K, V>(self: HashMap<K, V>): HashSet<K> {
  return HashSet.emptyWith(self.config).mutate((set) => {
    self.forEachWithIndex((k) => {
      set.add(k);
    });
  });
}

/**
 * Get the set of values
 *
 * @tsplus getter fncts.HashMap toSet
 */
export function toSet<K, V>(self: HashMap<K, V>): HashSet<V> {
  return HashSet.empty<V>().mutate((set) => {
    self.forEach((v) => {
      set.add(v);
    });
  });
}

/**
 * Get the set of values
 *
 * @tsplus getter fncts.HashMap toList
 */
export function toList<K, V>(self: HashMap<K, V>): List<readonly [K, V]> {
  const buffer = new ListBuffer<readonly [K, V]>();
  self.forEachWithIndex((k, v) => {
    buffer.append([k, v]);
  });
  return buffer.toList;
}

/**
 * Get the set of values
 *
 * @tsplus getter fncts.HashMap toArray
 */
export function toArray<K, V>(self: HashMap<K, V>): Array<readonly [K, V]> {
  const buffer: Array<readonly [K, V]> = Array(self.size);
  let i = 0;
  self.forEachWithIndex((k, v) => {
    buffer[i] = [k, v];
    i++;
  });
  return buffer;
}

/**
 * Get an IterableIterator of the map values
 *
 * @tsplus getter fncts.HashMap values
 */
export function values<K, V>(self: HashMap<K, V>): IterableIterator<V> {
  return new HashMapIterator(self, ([, v]) => v);
}

/**
 * Update a value if exists
 *
 * @tsplus pipeable fncts.HashMap update
 */
export function update<K, V>(key: K, f: (v: V) => V) {
  return (self: HashMap<K, V>): HashMap<K, V> => {
    return self.modify(key, (v) => v.map(f));
  };
}

/**
 * Apply f to each element
 *
 * @tsplus pipeable fncts.HashMap forEachWithIndex
 */
export function forEachWithIndex<K, V>(f: (k: K, v: V, m: HashMap<K, V>) => void) {
  return (self: HashMap<K, V>): void => {
    self.foldLeftWithIndex(undefined as void, (key, _, value) => f(key, value, self));
  };
}

/**
 * Apply f to each element
 *
 * @tsplus pipeable fncts.HashMap forEach
 */
export function forEach<K, V>(f: (v: V, m: HashMap<K, V>) => void) {
  return (self: HashMap<K, V>): void => {
    return self.forEachWithIndex((_, v, m) => f(v, m));
  };
}

/**
 * Maps over the map entries
 *
 * @tsplus pipeable fncts.HashMap mapWithIndex
 */
export function mapWithIndex<K, V, A>(f: (k: K, v: V) => A) {
  return (self: HashMap<K, V>): HashMap<K, A> => {
    return self.foldLeftWithIndex(makeWith<K, A>(self.config), (k, z, v) => z.set(k, f(k, v)));
  };
}

/**
 * Maps over the map entries
 *
 * @tsplus pipeable fncts.HashMap map
 */
export function map<V, A>(f: (v: V) => A) {
  return <K>(self: HashMap<K, V>): HashMap<K, A> => {
    return self.mapWithIndex((_, a) => f(a));
  };
}

/**
 * Chain over the map entries, the hash and equal of the 2 maps has to be the same
 *
 * @tsplus pipeable fncts.HashMap flatMapWithIndex
 */
export function flatMapWithIndex<K, V, A>(f: (k: K, v: V) => HashMap<K, A>) {
  return (self: HashMap<K, V>): HashMap<K, A> => {
    return self.foldLeftWithIndex(makeWith<K, A>(self.config), (k, z, v) =>
      z.mutate((m) => {
        f(k, v).forEachWithIndex((k1, a1) => {
          m.set(k1, a1);
        });
      }),
    );
  };
}

/**
 * Chain over the map entries, the hash and equal of the 2 maps has to be the same
 *
 * @tsplus pipeable fncts.HashMap flatMap
 */
export function flatMap<K, V, A>(f: (v: V) => HashMap<K, A>) {
  return (self: HashMap<K, V>): HashMap<K, A> => {
    return self.flatMapWithIndex((_, a) => f(a));
  };
}

/**
 * Removes values that are `Nothing`
 *
 * @tsplus getter fncts.HashMap compact
 */
export function compact<K, A>(self: HashMap<K, Maybe<A>>): HashMap<K, A> {
  return self.filterMap(Function.identity);
}

/**
 * Removes `Either` values into two separate `HashMaps`
 *
 * @tsplus getter fncts.HashMap separate
 */
export function separate<K, A, B>(self: HashMap<K, Either<A, B>>): readonly [HashMap<K, A>, HashMap<K, B>] {
  return self.partitionMap(Function.identity);
}

/**
 * Filter out None and map
 *
 * @tsplus pipeable fncts.HashMap filterMapWithIndex
 */
export function filterMapWithIndex<K, A, B>(f: (k: K, a: A) => Maybe<B>) {
  return (self: HashMap<K, A>): HashMap<K, B> => {
    return makeWith<K, B>(self.config).mutate((m) => {
      for (const [k, a] of self) {
        const o = f(k, a);
        if (o.isJust()) {
          m.set(k, o.value);
        }
      }
    });
  };
}

/**
 * Filter out None and map
 *
 * @tsplus pipeable fncts.HashMap filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return <K>(self: HashMap<K, A>): HashMap<K, B> => {
    return self.filterMapWithIndex((_, a) => f(a));
  };
}

/**
 * Filter out by predicate
 *
 * @tsplus pipeable fncts.HashMap filterWithIndex
 */
export function filterWithIndex<K, A, B extends A>(
  refinement: RefinementWithIndex<K, A, B>,
): (self: HashMap<K, A>) => HashMap<K, B>;
export function filterWithIndex<K, A>(predicate: PredicateWithIndex<K, A>): (self: HashMap<K, A>) => HashMap<K, A>;
export function filterWithIndex<K, A>(predicate: PredicateWithIndex<K, A>) {
  return (self: HashMap<K, A>): HashMap<K, A> => {
    return makeWith<K, A>(self.config).mutate((m) => {
      for (const [k, a] of self) {
        if (predicate(k, a)) {
          m.set(k, a);
        }
      }
    });
  };
}

/**
 * Filter out by predicate
 *
 * @tsplus pipeable fncts.HashMap filter
 */
export function filter<A, B extends A>(refinement: Refinement<A, B>): <K>(self: HashMap<K, A>) => HashMap<K, B>;
export function filter<A>(predicate: Predicate<A>): <K>(self: HashMap<K, A>) => HashMap<K, A>;
export function filter<A>(predicate: Predicate<A>) {
  return <K>(self: HashMap<K, A>): HashMap<K, A> => {
    return self.filterWithIndex((_, a) => predicate(a));
  };
}

/**
 * @tsplus pipeable fncts.HashMap partitionMapWithIndex
 */
export function partitionMapWithIndex<K, V, A, B>(f: (i: K, a: V) => Either<A, B>) {
  return (self: HashMap<K, V>): readonly [HashMap<K, A>, HashMap<K, B>] => {
    const left  = makeWith<K, A>(self.config).beginMutation;
    const right = makeWith<K, B>(self.config).beginMutation;
    self.forEachWithIndex((k, v) => {
      f(k, v).match({
        Left: (a) => {
          left.set(k, a);
        },
        Right: (b) => {
          right.set(k, b);
        },
      });
    });
    return [left.endMutation, right.endMutation];
  };
}

/**
 * @tsplus pipeable fncts.HashMap partitionMap
 */
export function partitionMap<V, A, B>(f: (a: V) => Either<A, B>) {
  return <K>(self: HashMap<K, V>): readonly [HashMap<K, A>, HashMap<K, B>] => {
    return self.partitionMapWithIndex((_, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.HashMap partitionWithIndex
 */
export function partitionWithIndex<K, V, B extends V>(
  refinement: RefinementWithIndex<K, V, B>,
): (self: HashMap<K, V>) => readonly [HashMap<K, V>, HashMap<K, B>];
export function partitionWithIndex<K, V>(
  predicate: PredicateWithIndex<K, V>,
): (self: HashMap<K, V>) => readonly [HashMap<K, V>, HashMap<K, V>];
export function partitionWithIndex<K, V>(predicate: PredicateWithIndex<K, V>) {
  return (self: HashMap<K, V>): readonly [HashMap<K, V>, HashMap<K, V>] => {
    const left  = makeWith<K, V>(self.config).beginMutation;
    const right = makeWith<K, V>(self.config).beginMutation;
    self.forEachWithIndex((k, v) => {
      if (predicate(k, v)) {
        right.set(k, v);
      } else {
        left.set(k, v);
      }
    });
    return [left.endMutation, right.endMutation];
  };
}

/**
 * @tsplus pipeable fncts.HashMap partition
 */
export function partition<V, B extends V>(
  refinement: Refinement<V, B>,
): <K>(self: HashMap<K, V>) => readonly [HashMap<K, V>, HashMap<K, B>];
export function partition<V>(
  predicate: Predicate<V>,
): <K>(self: HashMap<K, V>) => readonly [HashMap<K, V>, HashMap<K, V>];
export function partition<V>(predicate: Predicate<V>) {
  return <K>(self: HashMap<K, V>): readonly [HashMap<K, V>, HashMap<K, V>] => {
    return self.partitionWithIndex((_, a) => predicate(a));
  };
}

/**
 * Reduce a state over the map entries
 *
 * @tsplus pipeable fncts.HashMap foldLeftWithIndexWhile
 */
export function foldLeftWithIndexWhile<K, V, Z>(z: Z, f: (k: K, z: Z, v: V) => Z, p: Predicate<Z>) {
  return (self: HashMap<K, V>): Z => {
    const root = self.root;
    if (root._tag === "LeafNode") return root.value.isJust() ? f(root.key, z, root.value.value) : z;
    if (root._tag === "EmptyNode") {
      return z;
    }
    const toVisit = [root.children];
    let children;
    let acc       = z;
    loop: while ((children = toVisit.pop())) {
      for (let i = 0, len = children.length; i < len; ) {
        const child = children[i++];
        if (child && !isEmptyNode(child)) {
          if (child._tag === "LeafNode") {
            if (child.value.isJust()) {
              // eslint-disable-next-line no-param-reassign
              acc = f(child.key, acc, child.value.value);
              if (p(acc)) {
                break loop;
              }
            }
          } else {
            toVisit.push(child.children);
          }
        }
      }
    }
    return acc;
  };
}

/**
 * Reduce a state over the map entries
 *
 * @tsplus pipeable fncts.HashMap foldLeftWithIndex
 */
export function foldLeftWithIndex<K, V, Z>(z: Z, f: (k: K, z: Z, v: V) => Z) {
  return (self: HashMap<K, V>): Z => {
    const root = self.root;
    if (root._tag === "LeafNode") return root.value.isJust() ? f(root.key, z, root.value.value) : z;
    if (root._tag === "EmptyNode") {
      return z;
    }
    const toVisit = [root.children];
    let children;
    let acc       = z;
    while ((children = toVisit.pop())) {
      for (let i = 0, len = children.length; i < len; ) {
        const child = children[i++];
        if (child && !isEmptyNode(child)) {
          if (child._tag === "LeafNode") {
            if (child.value.isJust()) {
              // eslint-disable-next-line no-param-reassign
              acc = f(child.key, acc, child.value.value);
            }
          } else {
            toVisit.push(child.children);
          }
        }
      }
    }
    return acc;
  };
}

/**
 * Reduce a state over the map entries
 *
 * @tsplus pipeable fncts.HashMap foldLeftWhile
 */
export function foldLeftWhile<V, Z>(z: Z, f: (z: Z, v: V) => Z, p: Predicate<Z>) {
  return <K>(self: HashMap<K, V>): Z => {
    return self.foldLeftWithIndexWhile(z, (_, z, v) => f(z, v), p);
  };
}

/**
 * Reduce a state over the map entries
 *
 * @tsplus pipeable fncts.HashMap foldLeft
 */
export function foldLeft<V, Z>(z: Z, f: (z: Z, v: V) => Z) {
  return <K>(self: HashMap<K, V>): Z => {
    return self.foldLeftWithIndex(z, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.HashMap findWithIndex
 */
export function findWithIndex<K, V, B extends V>(p: RefinementWithIndex<K, V, B>): (self: HashMap<K, V>) => Maybe<B>;
export function findWithIndex<K, V>(p: PredicateWithIndex<K, V>): (self: HashMap<K, V>) => Maybe<V>;
export function findWithIndex<K, V>(p: PredicateWithIndex<K, V>) {
  return (self: HashMap<K, V>): Maybe<V> =>
    self.foldLeftWithIndexWhile(
      Nothing(),
      (k, _, v) => (p(k, v) ? Just(v) : Nothing()),
      (v) => v.isNothing(),
    );
}

/**
 * @tsplus pipeable fncts.HashMap find
 */
export function find<V, B extends V>(p: Refinement<V, B>): <K>(self: HashMap<K, V>) => Maybe<B>;
export function find<V>(p: Predicate<V>): <K>(self: HashMap<K, V>) => Maybe<V>;
export function find<V>(p: Predicate<V>) {
  return <K>(self: HashMap<K, V>): Maybe<V> =>
    self.foldLeftWhile(
      Nothing(),
      (_, v) => (p(v) ? Just(v) : Nothing()),
      (v) => v.isNothing(),
    );
}

/**
 * @tsplus getter fncts.HashMap traverseWithIndex
 */
export function _traverseWithIndex<K, A>(
  self: HashMap<K, A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K1, Q, W, X, I, S, R, E, B>(
  f: (i: K, a: A) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, HashMap<K, B>>;
export function _traverseWithIndex<K, A>(
  self: HashMap<K, A>,
): <G>(G: P.Applicative<HKT.F<G>>) => <B>(f: (i: K, a: A) => HKT.FK1<G, B>) => HKT.FK1<G, HashMap<K, B>> {
  return (G) => (f) =>
    self.foldLeftWithIndex(G.pure(HashMap.makeWith(self.config)), (k, b, a) =>
      pipe(
        b,
        G.zipWith(f(k, a), (map, b) => map.set(k, b)),
      ),
    );
}

/**
 * @tsplus getter fncts.HashMap traverse
 */
export function _traverse<K, A>(
  self: HashMap<K, A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K1, Q, W, X, I, S, R, E, B>(
  f: (a: A) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, HashMap<K, B>> {
  return (G) => (f) => self.traverseWithIndex(G)((_, a) => f(a));
}

export const traverseWithIndex: P.TraversableWithIndex<HashMapF>["traverseWithIndex"] = (G) => (f) => (ta) =>
  ta.traverseWithIndex(G)(f);

export const traverse: P.Traversable<HashMapF>["traverse"] = (G) => (f) => (ta) =>
  ta.traverseWithIndex(G)((_, a) => f(a));

/**
 * @tsplus pipeable fncts.HashMap unsafeGet
 */
export function unsafeGet<K>(key: K) {
  return <V>(self: HashMap<K, V>): V | undefined => {
    return self.getHash(key, self.config.hash(key)).value;
  };
}

/**
 * @tsplus getter fncts.HashMap witherWithIndex
 */
export function _witherWithIndex<K, A>(
  self: HashMap<K, A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K1, Q, W, X, I, S, R, E, B>(
  f: (i: K, a: A) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, Maybe<B>>,
) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, HashMap<K, B>> {
  return (G) => (f) => self.traverseWithIndex(G)(f).pipe(G.map(compact));
}

/**
 * @tsplus getter fncts.HashMap wither
 */
export function _wither<K, A>(
  self: HashMap<K, A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K1, Q, W, X, I, S, R, E, B>(
  f: (a: A) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, Maybe<B>>,
) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, HashMap<K, B>> {
  return (G) => (f) => self.witherWithIndex(G)((_, a) => f(a));
}

export const witherWithIndex: P.WitherableWithIndex<HashMapF>["witherWithIndex"] = (G) => (f) => (wa) =>
  wa.witherWithIndex(G)(f);

export const wither: P.Witherable<HashMapF>["wither"] = (G) => (f) => (wa) => wa.witherWithIndex(G)((_, a) => f(a));

/**
 * @tsplus getter fncts.HashMap wiltWithIndex
 */
export function _wiltWithIndex<K, A>(
  self: HashMap<K, A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K1, Q, W, X, I, S, R, E, B, B2>(
  f: (i: K, a: A) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, Either<B, B2>>,
) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, readonly [HashMap<K, B>, HashMap<K, B2>]> {
  return (G) => (f) => self.traverseWithIndex(G)(f).pipe(G.map(separate));
}

/**
 * @tsplus getter fncts.HashMap wilt
 */
export function _wilt<K, A>(
  self: HashMap<K, A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K1, Q, W, X, I, S, R, E, B, B2>(
  f: (a: A) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, Either<B, B2>>,
) => HKT.Kind<G, GC, K1, Q, W, X, I, S, R, E, readonly [HashMap<K, B>, HashMap<K, B2>]> {
  return (G) => (f) => self.wiltWithIndex(G)((_, a) => f(a));
}

export const wiltWithIndex: P.WitherableWithIndex<HashMapF>["wiltWithIndex"] = (G) => (f) => (wa) =>
  wa.wiltWithIndex(G)(f);

export const wilt: P.Witherable<HashMapF>["wilt"] = (G) => (f) => (wa) => wa.wiltWithIndex(G)((_, a) => f(a));

/**
 * @tsplus pipeable fncts.HashMap unionWith
 */
export function unionWith<K, A>(that: Iterable<readonly [K, A]>, f: (x: A, y: A) => A) {
  return (self: HashMap<K, A>): HashMap<K, A> => {
    return self.mutate((m) => {
      for (const [k, a] of that) {
        m.modify(k, (v) =>
          v.match(
            () => Just(a),
            (a0) => Just(f(a0, a)),
          ),
        );
      }
    });
  };
}

/**
 * @tsplus pipeable fncts.HashMap union
 */
export function union<K, A>(that: Iterable<readonly [K, A]>) {
  return (self: HashMap<K, A>): HashMap<K, A> => {
    return self.mutate((m) => {
      for (const [k, a] of that) {
        m.set(k, a);
      }
    });
  };
}

/**
 * @tsplus pipeable fncts.HashMap pop
 */
export function pop<K>(k: K) {
  return <A>(self: HashMap<K, A>): Maybe<readonly [A, HashMap<K, A>]> => {
    return self.get(k).map((a) => [a, self.remove(k)]);
  };
}

/**
 * Set the root of the map
 */
function setTree<K, V>(map: HashMap<K, V>, newRoot: Node<K, V>, newSize: number) {
  if (map.editable) {
    map.root = newRoot;
    map.size = newSize;
    return map;
  }
  return newRoot === map.root ? map : new HashMap(map.editable, map.edit, map.config, newRoot, newSize);
}

/**
 * Lookup the value for `key` in `map` using custom hash.
 */
function tryGetHash<K, V>(map: HashMap<K, V>, key: K, hash: number): Maybe<V> {
  let node    = map.root;
  let shift   = 0;
  const keyEq = map.config.equals;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    switch (node._tag) {
      case "LeafNode": {
        return keyEq(key)(node.key) ? node.value : Nothing();
      }
      case "CollisionNode": {
        if (hash === node.hash) {
          const children = node.children;
          for (let i = 0, len = children.length; i < len; ++i) {
            const child = children[i]!;
            if ("key" in child && keyEq(key)(child.key)) return child.value;
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
