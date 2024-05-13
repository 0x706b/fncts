import type { Lookup } from "@fncts/cache/Lookup";

import { Cache } from "@fncts/cache/Cache/definition";
import { CacheImplementation } from "@fncts/cache/Cache/internal";

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
      IO.fiberId.map(
        (fiberId) => new CacheImplementation(capacity, lookup, timeToLive, keyBy, clock, environment, fiberId),
      ),
    ),
  );
}
