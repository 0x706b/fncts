import type { MapValue } from "@fncts/cache/Cache/MapValue";
import type { MapKey } from "@fncts/cache/MapKey";

import { HashMap as MutableHashMap } from "@fncts/base/collection/mutable/HashMap";
import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import { KeySet } from "@fncts/cache/KeySet";
import { MutableQueue } from "@fncts/io/internal/MutableQueue";

/**
 * @tsplus type fncts.cache.CacheState
 * @tsplus companion fncts.cache.CacheStateOps
 */
export class CacheState<Key, Error, Value> {
  constructor(
    readonly map: MutableHashMap<Key, MapValue<Key, Error, Value>>,
    readonly keys: KeySet<Key>,
    readonly accesses: MutableQueue<MapKey<Key>>,
    public hits: number,
    public misses: number,
    readonly updating: AtomicBoolean,
  ) {}
}

/**
 * @tsplus static fncts.cache.CacheStateOps initial
 */
export function initial<Key, Error, Value>(): CacheState<Key, Error, Value> {
  return new CacheState(MutableHashMap.empty(), new KeySet(), MutableQueue.unbounded(), 0, 0, new AtomicBoolean(false));
}
