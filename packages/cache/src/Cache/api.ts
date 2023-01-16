import type { Maybe } from "@fncts/base/data/Maybe";
import type { Lookup } from "@fncts/cache/Lookup";
import type { FIO, UIO } from "@fncts/io/IO";

import { CacheState } from "@fncts/cache/Cache/CacheState";
import { Cache } from "@fncts/cache/Cache/definition";
import { Complete, MapValueTag, Pending, Refreshing } from "@fncts/cache/Cache/MapValue";
import { CacheStats } from "@fncts/cache/CacheStats";
import { EntryStats } from "@fncts/cache/EntryStats";
import { MapKey } from "@fncts/cache/MapKey";

/**
 * @tsplus static fncts.cache.CacheOps make
 */
export function make<Key, Environment, Error, Value>(
  capacity: number,
  timeToLive: Duration,
  lookup: Lookup<Key, Environment, Error, Value>,
): URIO<Environment, Cache<Key, Error, Value>> {
  return Cache.makeWith(capacity, lookup, () => timeToLive);
}

/**
 * @tsplus static fncts.cache.CacheOps makeWith
 */
export function makeWith<Key, Environment, Error, Value>(
  capacity: number,
  lookup: Lookup<Key, Environment, Error, Value>,
  timeToLive: (_: Exit<Error, Value>) => Duration,
): URIO<Environment, Cache<Key, Error, Value>> {
  return Cache.makeWithKey(capacity, lookup, timeToLive, Function.identity);
}

/**
 * @tsplus static fncts.cache.CacheOps makeWithKey
 */
export function makeWithKey<In, Key, Environment, Error, Value>(
  capacity: number,
  lookup: Lookup<In, Environment, Error, Value>,
  timeToLive: (_: Exit<Error, Value>) => Duration,
  keyBy: (_: In) => Key,
): URIO<Environment, Cache<In, Error, Value>> {
  return IO.clock.flatMap((clock) =>
    IO.environment<Environment>().flatMap((environment) =>
      IO.fiberId.map((fiberId) => {
        const cacheState = CacheState.initial<Key, Error, Value>();

        function trackAccess(key: MapKey<Key>) {
          cacheState.accesses.enqueue(key);
          if (cacheState.updating.compareAndSet(false, true)) {
            const key = cacheState.accesses.dequeue(undefined);
            if (key !== undefined) {
              cacheState.keys.add(key);
            }
          }
          let size = cacheState.map.size;
          let loop = size > capacity;
          while (loop) {
            const key = cacheState.keys.remove();
            if (key !== null) {
              if (cacheState.map.delete(key.value).isJust()) {
                size -= 1;
                loop  = size > capacity;
              }
            } else {
              loop = false;
            }
          }
          cacheState.updating.set(false);
        }

        function trackHit() {
          cacheState.hits += 1;
        }

        function trackMiss() {
          cacheState.misses += 1;
        }

        return new (class extends Cache<In, Error, Value> {
          get cacheStats(): UIO<CacheStats> {
            return IO.succeed(new CacheStats(cacheState.hits, cacheState.misses, cacheState.map.size));
          }

          contains(key: In, __tsplusTrace?: string | undefined): UIO<boolean> {
            return IO.succeed(cacheState.map.has(keyBy(key)));
          }

          entryStats(key: In, __tsplusTrace?: string | undefined): UIO<Maybe<EntryStats>> {
            return IO.succeed(() => {
              const value = cacheState.map.get(keyBy(key));
              if (value.isNothing()) {
                return Nothing();
              } else {
                const mapValue = value.value!;
                switch (mapValue._tag) {
                  case MapValueTag.Pending:
                    return Nothing();
                  case MapValueTag.Complete:
                    return Just(new EntryStats(mapValue.entryStats.loaded));
                  case MapValueTag.Refreshing:
                    return Just(new EntryStats(mapValue.complete.entryStats.loaded));
                }
              }
            });
          }

          get(inp: In, __tsplusTrace?: string | undefined): FIO<Error, Value> {
            return IO.defer(() => {
              const k                                 = keyBy(inp);
              let key: MapKey<Key> | null             = null;
              let future: Future<Error, Value> | null = null;
              let value = cacheState.map.get(k);
              if (value.isNothing()) {
                future = Future.unsafeMake(fiberId);
                key    = new MapKey(k);
                value  = cacheState.map.get(k).match(
                  () => cacheState.map.set(k, new Pending(key!, future!)),
                  (value) => Just(value),
                );
              }
              if (value.isNothing()) {
                trackAccess(key!);
                trackMiss();
                return this.lookupValueOf(inp, future!);
              } else {
                const mapValue = value.value!;
                switch (mapValue._tag) {
                  case MapValueTag.Pending: {
                    trackAccess(mapValue.key!);
                    trackHit();
                    return mapValue.future.await;
                  }
                  case MapValueTag.Complete: {
                    trackAccess(mapValue.key!);
                    trackHit();
                    return this.hasExpired(mapValue.timeToLive).flatMap((hasExpired) => {
                      if (hasExpired) {
                        cacheState.map.delete(k);
                        return this.get(inp);
                      } else {
                        return IO.fromExitNow(mapValue.exit);
                      }
                    });
                  }
                  case MapValueTag.Refreshing: {
                    trackAccess(mapValue.complete.key);
                    trackHit();
                    return this.hasExpired(mapValue.complete.timeToLive).flatMap((hasExpired) => {
                      if (hasExpired) {
                        return mapValue.future.await;
                      } else {
                        return IO.fromExitNow(mapValue.complete.exit);
                      }
                    });
                  }
                }
              }
            });
          }

          refresh(inp: In, __tsplusTrace?: string | undefined): FIO<Error, void> {
            return IO.defer(() => {
              const k      = keyBy(inp);
              const future = Future.unsafeMake<Error, Value>(fiberId);
              let value    = cacheState.map.get(k);
              if (value.isNothing()) {
                value = cacheState.map.set(k, new Pending(new MapKey(k), future));
              }
              let result: FIO<Error, Value>;
              if (value.isNothing()) {
                result = this.lookupValueOf(inp, future);
              } else {
                const mapValue = value.value!;
                switch (mapValue._tag) {
                  case MapValueTag.Pending: {
                    result = mapValue.future.await;
                    break;
                  }
                  case MapValueTag.Complete: {
                    result = this.hasExpired(mapValue.timeToLive).flatMap((hasExpired) => {
                      if (hasExpired) {
                        cacheState.map.delete(k);
                        return this.get(inp);
                      } else {
                        cacheState.map.set(k, new Refreshing(future, mapValue));
                        return this.lookupValueOf(inp, future);
                      }
                    });
                    break;
                  }
                  case MapValueTag.Refreshing: {
                    result = mapValue.future.await;
                    break;
                  }
                }
              }
              return result.asUnit;
            });
          }

          invalidate(key: In, __tsplusTrace?: string | undefined): UIO<void> {
            return IO.succeed(() => {
              cacheState.map.delete(keyBy(key));
            });
          }

          get invalidateAll(): UIO<void> {
            return IO.succeed(() => {
              cacheState.map.clear();
            });
          }

          get size(): UIO<number> {
            return IO.succeed(cacheState.map.size);
          }

          hasExpired(timeToLive: number): UIO<boolean> {
            return clock.currentTime.map((now) => now > timeToLive);
          }

          lookupValueOf(inp: In, future: Future<Error, Value>): FIO<Error, Value> {
            return IO.defer(() => {
              const key = keyBy(inp);
              return lookup(inp)
                .provideEnvironment(environment)
                .result.flatMap((exit) =>
                  clock.currentTime.flatMap((now) => {
                    const entryStats = new EntryStats(now);
                    cacheState.map.set(
                      key,
                      new Complete(new MapKey(key), exit, entryStats, now + timeToLive(exit).milliseconds),
                    );
                    return future.done(exit) > IO.fromExitNow(exit);
                  }),
                )
                .onInterrupt(future.interrupt > IO.succeed(cacheState.map.delete(key)));
            });
          }
        })();
      }),
    ),
  );
}
