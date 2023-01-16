import type { CacheStats } from "@fncts/cache/CacheStats";
import type { EntryStats } from "@fncts/cache/EntryStats";

export const CacheVariance = Symbol.for("fncts.cache.Cache.Variance");
export type CacheVariance = typeof CacheVariance;

export const CacheTypeId = Symbol.for("fncts.cache.Cache");
export type CacheTypeId = typeof CacheTypeId;

/**
 * A `Cache` is defined in terms of a lookup function that, given a key of
 * type `Key`, can either fail with an error of type `Error` or succeed with a
 * value of type `Value`. Getting a value from the cache will either return
 * the previous result of the lookup function if it is available or else
 * compute a new result with the lookup function, put it in the cache, and
 * return it.
 *
 * A cache also has a specified capacity and time to live. When the cache is
 * at capacity the least recently accessed values in the cache will be
 * removed to make room for new values. Getting a value with a life older than
 * the specified time to live will result in a new value being computed with
 * the lookup function and returned when available.
 *
 * The cache is safe for concurrent access. If multiple fibers attempt to get
 * the same key the lookup function will only be computed once and the result
 * will be returned to all fibers.
 *
 * @tsplus type fncts.cache.Cache
 * @tsplus companion fncts.cache.CacheOps
 */
export abstract class Cache<in Key, out Error, out Value> {
  readonly [CacheTypeId]: CacheTypeId = CacheTypeId;
  declare [CacheVariance]: {
    readonly _Key: (_: Key) => void;
    readonly _Error: (_: never) => Error;
    readonly _Value: (_: never) => Value;
  };

  abstract get cacheStats(): UIO<CacheStats>;

  abstract contains(key: Key, __tsplusTrace?: string): UIO<boolean>;

  abstract entryStats(key: Key, __tsplusTrace?: string): UIO<Maybe<EntryStats>>;

  abstract get(key: Key, __tsplusTrace?: string): FIO<Error, Value>;

  abstract refresh(key: Key, __tsplusTrace?: string): FIO<Error, void>;

  abstract invalidate(key: Key, __tsplusTrace?: string): UIO<void>;

  abstract get invalidateAll(): UIO<void>;

  abstract get size(): UIO<number>;
}
