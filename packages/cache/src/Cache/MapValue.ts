import type { EntryStats } from "@fncts/cache/EntryStats";
import type { MapKey } from "@fncts/cache/MapKey";

export const enum MapValueTag {
  Pending,
  Complete,
  Refreshing,
}

export class Pending<Key, Error, Value> {
  readonly _tag = MapValueTag.Pending;
  constructor(readonly key: MapKey<Key>, readonly future: Future<Error, Value>) {}
}

export class Complete<Key, Error, Value> {
  readonly _tag = MapValueTag.Complete;
  constructor(
    readonly key: MapKey<Key>,
    readonly exit: Exit<Error, Value>,
    readonly entryStats: EntryStats,
    readonly timeToLive: number,
  ) {}
}

export class Refreshing<Key, Error, Value> {
  readonly _tag = MapValueTag.Refreshing;
  constructor(readonly future: Future<Error, Value>, readonly complete: Complete<Key, Error, Value>) {}
}

export type MapValue<Key, Error, Value> =
  | Pending<Key, Error, Value>
  | Complete<Key, Error, Value>
  | Refreshing<Key, Error, Value>;
