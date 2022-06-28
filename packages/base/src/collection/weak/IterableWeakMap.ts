/**
 * @tsplus type fncts.IterableWeakMap
 */
export class IterableWeakMap<K extends object, V> implements Iterable<readonly [K, V]> {
  private weakMap           = new WeakMap<K, { value: V; ref: WeakRef<K> }>();
  private refSet            = new Set<WeakRef<K>>();
  private finalizationGroup = new FinalizationRegistry<{ ref: WeakRef<K>; set: Set<WeakRef<K>> }>(
    IterableWeakMap.cleanup,
  );

  private static cleanup<K extends object>({ ref, set }: { ref: WeakRef<K>; set: Set<WeakRef<K>> }) {
    set.delete(ref);
  }

  constructor(iterable: Iterable<readonly [K, V]>) {
    for (const [key, value] of iterable) {
      this.set(key, value);
    }
  }

  set(this: this, key: K, value: V): this {
    const ref = new WeakRef(key);

    this.weakMap.set(key, { value, ref });
    this.refSet.add(ref);
    this.finalizationGroup.register(key, { set: this.refSet, ref }, ref);
    return this;
  }

  get(this: this, key: K): V | undefined {
    const entry = this.weakMap.get(key);
    return entry && entry.value;
  }

  delete(this: this, key: K): boolean {
    const entry = this.weakMap.get(key);
    if (!entry) {
      return false;
    }

    this.weakMap.delete(key);
    this.refSet.delete(entry.ref);
    this.finalizationGroup.unregister(entry.ref);
    return true;
  }

  [Symbol.iterator](this: this): IterableIterator<readonly [K, V]> {
    return this.entries();
  }

  *entries(this: this): IterableIterator<readonly [K, V]> {
    for (const ref of this.refSet) {
      const key = ref.deref();
      if (!key) continue;
      const { value } = this.weakMap.get(key)!;
      yield [key, value];
    }
  }

  has(this: this, key: K): boolean {
    return this.weakMap.has(key);
  }
}
