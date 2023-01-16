/**
 * A `MapKey` represents a key in the cache. It contains mutable references
 * to the previous key and next key in the `KeySet` to support an efficient
 * implementation of a sorted set of keys.
 */
export class MapKey<Key> {
  constructor(
    readonly value: Key,
    public previous: MapKey<Key> | null = null,
    public next: MapKey<Key> | null = null,
  ) {}
}
