import type { Ord } from "../../../prelude.js";
import type { SortedMapIterable, SortedMapIterator } from "./iterator.js";
import type { RBNode } from "./node.js";

import { forward } from "./iterator.js";

/**
 * @tsplus type fncts.collection.immutable.SortedMap
 * @tsplus companion fncts.collection.immutable.SortedMapOps
 */
export class SortedMap<K, V> implements SortedMapIterable<K, V> {
  constructor(readonly ord: Ord<K>, readonly root: RBNode<K, V>) {}

  [Symbol.iterator](): SortedMapIterator<K, V> {
    return forward(this)[Symbol.iterator]();
  }
}
