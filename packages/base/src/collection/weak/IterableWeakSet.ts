/**
 * @tsplus type fncts.IterableWeakSet
 */
export class IterableWeakSet<A extends object> implements Iterable<A>, Set<A> {
  private weakMap = new WeakMap<
    A,
    {
      ref: WeakRef<A>;
    }
  >();
  private refSet            = new Set<WeakRef<A>>();
  private finalizationGroup = new FinalizationRegistry<{
    ref: WeakRef<A>;
    set: Set<WeakRef<A>>;
  }>(IterableWeakSet.cleanup);
  private static cleanup<A extends object>({ ref, set }: { ref: WeakRef<A>; set: Set<WeakRef<A>> }) {
    set.delete(ref);
  }

  constructor(iterable?: Iterable<A>) {
    if (iterable) {
      for (const value of iterable) {
        this.add(value);
      }
    }
  }

  add(this: this, value: A): this {
    const ref = new WeakRef(value);

    this.weakMap.set(value, { ref });
    this.refSet.add(ref);
    this.finalizationGroup.register(value, { set: this.refSet, ref }, ref);
    return this;
  }

  delete(this: this, value: A): boolean {
    const entry = this.weakMap.get(value);
    if (!entry) {
      return false;
    }

    this.weakMap.delete(value);
    this.refSet.delete(entry.ref);
    this.finalizationGroup.unregister(entry.ref);
    return true;
  }

  has(this: this, value: A): boolean {
    return this.weakMap.has(value);
  }

  keys(): IterableIterator<A> {
    return this[Symbol.iterator]();
  }

  values(): IterableIterator<A> {
    return this[Symbol.iterator]();
  }

  forEach(f: (value: A, value2: A, set: Set<A>) => void, thisArg?: Set<A>): void {
    thisArg = thisArg ?? this;
    for (const value of this) {
      f(value, value, thisArg);
    }
  }

  clear(): void {
    for (const ref of this.refSet) {
      const key = ref.deref();
      if (!key) continue;
      const entry = this.weakMap.get(key)!;
      this.weakMap.delete(key);
      this.refSet.delete(entry.ref);
      this.finalizationGroup.unregister(entry.ref);
    }
    this.refSet.clear();
  }

  get size(): number {
    let n = 0;
    for (const ref of this.refSet) {
      const value = ref.deref();
      if (!value) continue;
      n++;
    }
    return n;
  }

  *[Symbol.iterator](this: this): IterableIterator<A> {
    for (const ref of this.refSet) {
      const key = ref.deref();
      if (!key) continue;
      yield key;
    }
  }

  get [Symbol.toStringTag]() {
    return this.refSet[Symbol.toStringTag];
  }

  *entries(this: this): IterableIterator<[A, A]> {
    for (const ref of this.refSet) {
      const key = ref.deref();
      if (!key) continue;
      yield [key, key];
    }
  }
}
