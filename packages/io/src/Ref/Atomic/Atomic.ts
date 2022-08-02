import type { PRef } from "../definition.js";

import { RefInternal } from "../definition.js";
import { Derived } from "../Derived.js";
import { DerivedAll } from "../DerivedAll.js";

/**
 * @tsplus type fncts.io.Ref.Atomic
 */
export class Atomic<A> extends RefInternal<never, never, never, never, A, A> {
  readonly _tag = "Atomic";

  constructor(private value: A) {
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
    return this.value;
  }

  unsafeSet(a: A): void {
    this.value = a;
  }

  get get(): UIO<A> {
    return IO.succeed(this.value);
  }

  set(a: A): UIO<void> {
    return IO.succeed(() => {
      this.value = a;
    });
  }
}
