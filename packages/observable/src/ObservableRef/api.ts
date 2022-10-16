import type { Lens } from "@fncts/base/optics/Lens";
import type { URIO } from "@fncts/io/IO";
import type { Observable } from "@fncts/observable/Observable";
import type { Store } from "@fncts/observable/ObservableRef/atomic";

import { Atomic } from "@fncts/observable/ObservableRef/atomic";
import { ObservableRef, ObservableRefDescriptor } from "@fncts/observable/ObservableRef/definition";

/**
 * @tsplus static fncts.observable.ObservableRefOps make
 * @tsplus static fncts.observable.ObservableRefOps __call
 */
export function make<A>(initial: A, /** @fncts id */ id?: string): ObservableRef<Store, A, A> {
  if (id === undefined) {
    throw new Error("ObservableRef.make: the `id` argument must be provided if not using typescript transformers");
  }
  return new Atomic(new ObservableRefDescriptor(Symbol.for(id!), initial));
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef update
 */
export function update<R, A>(f: (a: A) => A) {
  return (self: ObservableRef<R, A, A>): URIO<R, void> => self.modify((a) => [undefined, f(a)]);
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef getAndUpdate
 */
export function getAndUpdate<R, A>(f: (a: A) => A) {
  return (self: ObservableRef<R, A, A>): URIO<R, A> => {
    return self.modify((a) => {
      const value = f(a);
      return [a, value];
    });
  };
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef updateAndGet
 */
export function updateAndGet<R, A>(f: (a: A) => A) {
  return (self: ObservableRef<R, A, A>): URIO<R, A> => {
    return self.modify((a) => {
      const value = f(a);
      return [value, value];
    });
  };
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef modify
 */
export function modify<R, A, B>(f: (a: A) => readonly [B, A]) {
  return (self: ObservableRef<R, A, A>): URIO<R, B> => {
    return self.get.flatMap((value) => {
      const [b, a] = f(value);
      return self.set(a) > IO.succeedNow(b);
    });
  };
}

class Map<R, A, B, C> extends ObservableRef<R, A, C> {
  constructor(readonly source: ObservableRef<R, A, B>, readonly f: (b: B) => C) {
    super(source.descriptor);
  }

  get: URIO<R, C> = this.source.get.map(this.f);

  set(a: A): URIO<R, void> {
    return this.source.set(a);
  }

  has: URIO<R, boolean> = this.source.has;

  delete: URIO<R, boolean> = this.source.delete;

  observable: Observable<R, never, C> = this.source.observable.map(this.f);
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef map
 */
export function map<R, A, B, C>(f: (a: B) => C) {
  return (self: ObservableRef<R, A, B>): ObservableRef<R, A, C> => {
    return new Map(self, f);
  };
}

class ContramapIn<R, A, B, C> extends ObservableRef<R, C, B> {
  constructor(readonly source: ObservableRef<R, A, B>, readonly f: (c: C) => A) {
    super(source.descriptor);
  }

  get: URIO<R, B> = this.source.get;

  set(c: C): URIO<R, void> {
    return this.source.set(this.f(c));
  }

  has: URIO<R, boolean> = this.source.has;

  delete: URIO<R, boolean> = this.source.delete;

  observable: Observable<R, never, B> = this.source.observable;
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef contramapIn
 */
export function contramapIn<R, A, B, C>(f: (inp: C) => A) {
  return (self: ObservableRef<R, A, B>): ObservableRef<R, C, B> => {
    return new ContramapIn(self, f);
  };
}

class Focus<R, A, B> extends ObservableRef<R, B, B> {
  constructor(readonly source: ObservableRef<R, A, A>, readonly lens: Lens<A, B>) {
    super(source.descriptor);
  }

  get: URIO<R, B> = this.source.get.map(this.lens.get);

  set(b: B): URIO<R, void> {
    return this.source.get.flatMap((a) => this.source.set(this.lens.set(b)(a)));
  }

  has: URIO<R, boolean> = this.source.has;

  delete: URIO<R, boolean> = this.source.delete;

  observable: Observable<R, never, B> = this.source.observable.map(this.lens.get);
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef focus
 */
export function focus<R, A, B>(lens: Lens<A, B>) {
  return (self: ObservableRef<R, A, A>): ObservableRef<R, B, B> => {
    return new Focus(self, lens);
  };
}

export class ZipWith<R, A, R1, B, C> implements ObservableRef.Readable<R | R1, C> {
  declare _R: (_: never) => R | R1;
  declare _Out: (_: never) => C;
  constructor(
    readonly sourceA: ObservableRef.Readable<R, A>,
    readonly sourceB: ObservableRef.Readable<R1, B>,
    readonly f: (a: A, b: B) => C,
  ) {}

  get: URIO<R | R1, C> = this.sourceA.get.zipWith(this.sourceB.get, this.f);

  has: URIO<R | R1, boolean> = this.sourceA.has.zipWith(this.sourceB.has, (a, b) => a && b);

  delete: URIO<R | R1, void> = this.sourceA.delete > this.sourceB.delete;

  observable: Observable<R | R1, never, C> = this.sourceA.observable.zipWithLatest(this.sourceB.observable, this.f);
}

/**
 * @tsplus pipeable fncts.observable.ObservableRef.Readable zipWith
 */
export function zipWith<R, A, R1, B, C>(that: ObservableRef.Readable<R1, B>, f: (a: A, b: B) => C) {
  return (self: ObservableRef.Readable<R, A>): ObservableRef.Readable<R | R1, C> => {
    return new ZipWith(self, that, f);
  };
}
