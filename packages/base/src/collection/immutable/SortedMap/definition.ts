import type { SortedMapIterable, SortedMapIterator } from "@fncts/base/collection/immutable/SortedMap/iterator";
import type { RBNode } from "@fncts/base/collection/immutable/SortedMap/node";
import type { Ord } from "@fncts/base/typeclass";

import { forward } from "@fncts/base/collection/immutable/SortedMap/iterator";

/**
 * @tsplus type fncts.SortedMap
 * @tsplus companion fncts.SortedMapOps
 */
export class SortedMap<K, V> implements SortedMapIterable<K, V> {
  constructor(readonly ord: Ord<K>, readonly root: RBNode<K, V>) {}

  [Symbol.iterator](): SortedMapIterator<K, V> {
    return forward(this)[Symbol.iterator]();
  }
}
