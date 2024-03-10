import type { Lens } from "@fncts/base/optics/Lens";
import type { UIO } from "@fncts/io/IO";
import type { Observable } from "@fncts/observable/Observable";

import { Atomic } from "@fncts/observable/ObservableRef/atomic";
import { ObservableRef, ObservableRefDescriptor } from "@fncts/observable/ObservableRef/definition";

/**
 * @tsplus static fncts.observable.ObservableRefOps make
 * @tsplus static fncts.observable.ObservableRefOps __call
 */
export function make<A>(initial: A): ObservableRef<A, A> {
  return new Atomic(new ObservableRefDescriptor(initial));
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef update
 */
export function update<A>(f: (a: A) => A) {
  return (self: ObservableRef<A, A>): UIO<void> => self.modify((a) => [undefined, f(a)]);
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef getAndUpdate
 */
export function getAndUpdate<A>(f: (a: A) => A) {
  return (self: ObservableRef<A, A>): UIO<A> => {
    return self.modify((a) => {
      const value = f(a);
      return [a, value];
    });
  };
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef updateAndGet
 */
export function updateAndGet<A>(f: (a: A) => A) {
  return (self: ObservableRef<A, A>): UIO<A> => {
    return self.modify((a) => {
      const value = f(a);
      return [value, value];
    });
  };
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef modify
 */
export function modify<A, B>(f: (a: A) => readonly [B, A]) {
  return (self: ObservableRef<A, A>): UIO<B> => {
    return self.get.flatMap((value) => {
      const [b, a] = f(value);
      return self.set(a) > IO.succeedNow(b);
    });
  };
}

class Map<A, B, C> extends ObservableRef<A, C> {
  constructor(
    readonly source: ObservableRef<A, B>,
    readonly f: (b: B) => C,
  ) {
    super(source.descriptor);
  }

  unsafeGet(): C {
    return this.f(this.source.unsafeGet());
  }

  get: UIO<C> = this.source.get.map(this.f);

  unsafeSet(a: A): void {
    this.source.unsafeSet(a);
  }

  set(a: A): UIO<void> {
    return this.source.set(a);
  }

  unsafeClear(): void {
    this.source.unsafeClear();
  }

  clear: UIO<void> = this.source.clear;

  observable: Observable<never, never, C> = this.source.observable.map(this.f);
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef map
 */
export function map<A, B, C>(f: (a: B) => C) {
  return (self: ObservableRef<A, B>): ObservableRef<A, C> => {
    return new Map(self, f);
  };
}

class ContramapIn<A, B, C> extends ObservableRef<C, B> {
  constructor(
    readonly source: ObservableRef<A, B>,
    readonly f: (c: C) => A,
  ) {
    super(source.descriptor);
  }

  unsafeGet(): B {
    return this.source.unsafeGet();
  }

  get: UIO<B> = this.source.get;

  unsafeSet(c: C): void {
    this.source.unsafeSet(this.f(c));
  }

  set(c: C): UIO<void> {
    return this.source.set(this.f(c));
  }

  unsafeClear(): void {
    this.source.unsafeClear();
  }

  clear: UIO<void> = this.source.clear;

  observable: Observable<never, never, B> = this.source.observable;
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef contramapIn
 */
export function contramapIn<A, B, C>(f: (inp: C) => A) {
  return (self: ObservableRef<A, B>): ObservableRef<C, B> => {
    return new ContramapIn(self, f);
  };
}

class Focus<A, B> extends ObservableRef<B, B> {
  constructor(
    readonly source: ObservableRef<A, A>,
    readonly lens: Lens<A, B>,
  ) {
    super(source.descriptor);
  }

  unsafeGet(): B {
    return this.lens.get(this.source.unsafeGet());
  }

  get: UIO<B> = this.source.get.map(this.lens.get);

  unsafeSet(b: B): void {
    this.source.unsafeSet(this.lens.set(b)(this.source.unsafeGet()));
  }

  set(b: B): UIO<void> {
    return this.source.get.flatMap((a) => this.source.set(this.lens.set(b)(a)));
  }

  unsafeClear(): void {
    this.source.unsafeClear();
  }

  clear: UIO<void> = this.source.clear;

  observable: Observable<never, never, B> = this.source.observable.map(this.lens.get);
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef focus
 */
export function focus<A, B>(lens: Lens<A, B>) {
  return (self: ObservableRef<A, A>): ObservableRef<B, B> => {
    return new Focus(self, lens);
  };
}

export class ZipWith<A, B, C> implements ObservableRef.Readable<C> {
  declare _Out: (_: never) => C;
  constructor(
    readonly sourceA: ObservableRef.Readable<A>,
    readonly sourceB: ObservableRef.Readable<B>,
    readonly f: (a: A, b: B) => C,
  ) {}

  unsafeGet(): C {
    return this.f(this.sourceA.unsafeGet(), this.sourceB.unsafeGet());
  }

  get: UIO<C> = this.sourceA.get.zipWith(this.sourceB.get, this.f);

  unsafeClear() {
    this.sourceA.unsafeClear();
    this.sourceB.unsafeClear();
  }

  clear: UIO<void> = this.sourceA.clear > this.sourceB.clear;

  observable: Observable<never, never, C> = this.sourceA.observable.zipWithLatest(this.sourceB.observable, this.f);
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef.Readable zipWith
 */
export function zipWith<A, B, C>(that: ObservableRef.Readable<B>, f: (a: A, b: B) => C) {
  return (self: ObservableRef.Readable<A>): ObservableRef.Readable<C> => {
    return new ZipWith(self, that, f);
  };
}
