import type { Environment as Env } from "@fncts/base/data/Environment";
import type { Lookup } from "@fncts/cache/Lookup";

import { CacheState } from "@fncts/cache/Cache";
import { Complete, MapValueTag, Pending, Refreshing } from "@fncts/cache/Cache/MapValue";
import { CacheStats } from "@fncts/cache/CacheStats";
import { EntryStats } from "@fncts/cache/EntryStats";
import { MapKey } from "@fncts/cache/MapKey";

export class CacheImplementation<In, Key, Environment, Error, Value> extends Cache<In, Error, Value> {
  cacheState = CacheState.initial<Key, Error, Value>();

  constructor(
    readonly capacity: number,
    readonly lookup: Lookup<In, Environment, Error, Value>,
    readonly timeToLive: (_: Exit<Error, Value>) => Duration,
    readonly keyBy: (_: In) => Key,
    readonly clock: Clock,
    readonly environment: Env<Environment>,
    readonly fiberId: FiberId,
  ) {
    super();
  }

  trackAccess(key: MapKey<Key>) {
    this.cacheState.accesses.enqueue(key);
    if (this.cacheState.updating.compareAndSet(false, true)) {
      const key = this.cacheState.accesses.dequeue(undefined);
      if (key !== undefined) {
        this.cacheState.keys.add(key);
      }
    }
    let size = this.cacheState.map.size;
    let loop = size > this.capacity;
    while (loop) {
      const key = this.cacheState.keys.remove();
      if (key !== null) {
        if (this.cacheState.map.delete(key.value).isJust()) {
          size -= 1;
          loop  = size > this.capacity;
        }
      } else {
        loop = false;
      }
    }
    this.cacheState.updating.set(false);
  }

  trackHit() {
    this.cacheState.hits += 1;
  }

  trackMiss() {
    this.cacheState.misses += 1;
  }

  get cacheStats(): UIO<CacheStats> {
    return IO.succeed(new CacheStats(this.cacheState.hits, this.cacheState.misses, this.cacheState.map.size));
  }

  contains(key: In, __tsplusTrace?: string | undefined): UIO<boolean> {
    return IO.succeed(this.cacheState.map.has(this.keyBy(key)));
  }

  entryStats(key: In, __tsplusTrace?: string | undefined): UIO<Maybe<EntryStats>> {
    return IO.succeed(() => {
      const value = this.cacheState.map.get(this.keyBy(key));
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
      const k                                 = this.keyBy(inp);
      let key: MapKey<Key> | null             = null;
      let future: Future<Error, Value> | null = null;
      let value = this.cacheState.map.get(k);
      if (value.isNothing()) {
        future = Future.unsafeMake(this.fiberId);
        key    = new MapKey(k);
        value  = this.cacheState.map.get(k).match(
          () => this.cacheState.map.set(k, new Pending(key!, future!)),
          (value) => Just(value),
        );
      }
      if (value.isNothing()) {
        this.trackAccess(key!);
        this.trackMiss();
        return this.lookupValueOf(inp, future!);
      } else {
        const mapValue = value.value!;
        switch (mapValue._tag) {
          case MapValueTag.Pending: {
            this.trackAccess(mapValue.key!);
            this.trackHit();
            return mapValue.future.await;
          }
          case MapValueTag.Complete: {
            this.trackAccess(mapValue.key!);
            this.trackHit();
            return this.hasExpired(mapValue.timeToLive).flatMap((hasExpired) => {
              if (hasExpired) {
                this.cacheState.map.delete(k);
                return this.get(inp);
              } else {
                return IO.fromExitNow(mapValue.exit);
              }
            });
          }
          case MapValueTag.Refreshing: {
            this.trackAccess(mapValue.complete.key);
            this.trackHit();
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
      const k      = this.keyBy(inp);
      const future = Future.unsafeMake<Error, Value>(this.fiberId);
      let value    = this.cacheState.map.get(k);
      if (value.isNothing()) {
        value = this.cacheState.map.set(k, new Pending(new MapKey(k), future));
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
                this.cacheState.map.delete(k);
                return this.get(inp);
              } else {
                this.cacheState.map.set(k, new Refreshing(future, mapValue));
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
      this.cacheState.map.delete(this.keyBy(key));
    });
  }

  get invalidateAll(): UIO<void> {
    return IO.succeed(() => {
      this.cacheState.map.clear();
    });
  }

  get size(): UIO<number> {
    return IO.succeed(this.cacheState.map.size);
  }

  hasExpired(timeToLive: number): UIO<boolean> {
    return this.clock.currentTime.map((now) => now > timeToLive);
  }

  lookupValueOf(inp: In, future: Future<Error, Value>): FIO<Error, Value> {
    return IO.defer(() => {
      const key = this.keyBy(inp);
      return this.lookup(inp)
        .provideEnvironment(this.environment)
        .result.flatMap((exit) =>
          this.clock.currentTime.flatMap((now) => {
            const entryStats = new EntryStats(now);
            this.cacheState.map.set(
              key,
              new Complete(new MapKey(key), exit, entryStats, now + this.timeToLive(exit).milliseconds),
            );
            return future.done(exit) > IO.fromExitNow(exit);
          }),
        )
        .onInterrupt(future.interrupt > IO.succeed(this.cacheState.map.delete(key)));
    });
  }
}
