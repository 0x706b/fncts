import type { PRef } from "./definition.js";
import type { AtomicReference } from "@fncts/base/internal/AtomicReference";

import { IO } from "@fncts/io/IO";

import { RefInternal } from "./definition.js";
import { Derived } from "./Derived.js";
import { DerivedAll } from "./DerivedAll.js";

export const AtomicTypeId = Symbol.for("fncts.io.Ref.Atomic");
export type AtomicTypeId = typeof AtomicTypeId;

/**
 * @tsplus type fncts.io.Ref.Atomic
 */
export class Atomic<A> extends RefInternal<never, never, never, never, A, A> {
  readonly [AtomicTypeId]: AtomicTypeId = AtomicTypeId;
  constructor(readonly value: AtomicReference<A>) {
    super();
    this.match    = this.match.bind(this);
    this.matchAll = this.matchAll.bind(this);
    this.set      = this.set.bind(this);
  }

  match<EC, ED, C, D>(
    _ea: (_: never) => EC,
    _eb: (_: never) => ED,
    ca: (_: C) => Either<EC, A>,
    bd: (_: A) => Either<ED, D>,
  ): PRef<never, never, EC, ED, C, D> {
    return new Derived<EC, ED, C, D>((f) => f(this, bd, ca));
  }

  matchAll<EC, ED, C, D>(
    _ea: (_: never) => EC,
    _eb: (_: never) => ED,
    _ec: (_: never) => EC,
    ca: (_: C) => (_: A) => Either<EC, A>,
    bd: (_: A) => Either<ED, D>,
  ): PRef<never, never, EC, ED, C, D> {
    return new DerivedAll<EC, ED, C, D>((f) => f(this, bd, ca));
  }

  get unsafeGet(): A {
    return this.value.get;
  }

  unsafeSet(a: A): void {
    this.value.set(a);
  }

  get get(): UIO<A> {
    return IO.succeed(this.value.get);
  }

  set(a: A): UIO<void> {
    return IO.succeed(() => {
      this.value.set(a);
    });
  }

  modify<B>(f: (a: A) => readonly [B, A], __tsplusTrace?: string | undefined): UIO<B> {
    return IO.succeed(() => {
      const v = this.unsafeGet;
      const o = f(v);
      this.unsafeSet(o[1]);
      return o[0];
    });
  }
}
