import type { SortedMapIterable, SortedMapIterator } from "@fncts/base/collection/immutable/SortedMap/iterator";
import type { RBNode } from "@fncts/base/collection/immutable/SortedMap/node";
import type { EqualsContext } from "@fncts/base/data/Equatable";
import type { Ord } from "@fncts/base/typeclass";

import { forward } from "@fncts/base/collection/immutable/SortedMap/iterator";

export const TypeId = Symbol.for("fncts.SortedMap");
export type TypeId = typeof TypeId;

/**
 * @tsplus type fncts.SortedMap
 * @tsplus companion fncts.SortedMapOps
 */
export class SortedMap<K, V> implements SortedMapIterable<K, V>, Equatable {
  readonly [TypeId]: TypeId = TypeId;

  constructor(
    readonly ord: Ord<K>,
    readonly root: RBNode<K, V>,
  ) {}

  [Symbol.iterator](): SortedMapIterator<K, V> {
    return forward(this)[Symbol.iterator]();
  }

  [Symbol.equals](that: unknown, context: EqualsContext): boolean {
    if (!SortedMap.is(that)) {
      return false;
    }

    return this.corresponds(that, context.comparator);
  }
}

/**
 * @tsplus static fncts.SortedMapOps is
 */
export function isSortedMap(u: unknown): u is SortedMap<unknown, unknown> {
  return isObject(u) && TypeId in u;
}
