import type { PRef } from "../definition.js";

import { IO } from "@fncts/io/IO";

import { RefInternal } from "../definition.js";

export const SynchronizedTypeId = Symbol.for("fncts.io.Ref.Synchronized");
export type SynchronizedTypeId = typeof SynchronizedTypeId;

/**
 * @tsplus type fncts.io.Ref.Synchronized
 */
export interface PSynchronized<RA, RB, EA, EB, A, B> extends PRef<RA, RB, EA, EB, A, B> {
  readonly [SynchronizedTypeId]: SynchronizedTypeId;
}

/**
 * @tsplus type fncts.io.Ref.SynchronizedOps
 */
export interface PSynchronizedOps {}

/**
 * @tsplus static fncts.io.RefOps Synchronized
 */
export const Synchronized: PSynchronizedOps = {};

/**
 * @tsplus type fncts.io.Ref.Synchronized
 */
export class PSynchronizedInternal<RA, RB, EA, EB, A, B> extends RefInternal<RA, RB, EA, EB, A, B> {
  readonly [SynchronizedTypeId]: SynchronizedTypeId = SynchronizedTypeId;
  constructor(
    readonly semaphore: Semaphore,
    readonly unsafeGet: IO<RB, EB, B>,
    readonly unsafeSet: (a: A) => IO<RA, EA, void>,
  ) {
    super();
  }

  get get(): IO<RB, EB, B> {
    return this.withPermit(this.unsafeGet);
  }

  set(a: A, __tsplusTrace?: string): IO<RA, EA, void> {
    return this.withPermit(this.unsafeSet(a));
  }

  modify<C>(f: (b: B) => readonly [C, A], __tsplusTrace?: string | undefined): IO<RA | RB, EA | EB, C> {
    return this.modifyIO((a) => IO.succeedNow(f(a)));
  }

  modifyIO<R1, E1, C>(
    f: (b: B) => IO<R1, E1, readonly [C, A]>,
    __tsplusTrace?: string,
  ): IO<RA | RB | R1, EA | EB | E1, C> {
    return this.withPermit(this.unsafeGet.flatMap(f).flatMap(([b, a]) => this.unsafeSet(a).as(b)));
  }

  matchAllIO<RC, RD, EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ec: (_: EB) => EC,
    ca: (_: C) => (_: B) => IO<RC, EC, A>,
    bd: (_: B) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RA | RC | RB, RB | RD, EC, ED, C, D> {
    return new PSynchronizedInternal(
      this.semaphore,
      this.get.matchIO((e) => IO.failNow(eb(e)), bd),
      (c) =>
        this.get.matchIO(
          (e) => IO.failNow(ec(e)),
          (b) => ca(c)(b).flatMap((a) => this.unsafeSet(a).mapError(ea)),
        ),
    );
  }

  matchIO<RC, RD, EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ca: (_: C) => IO<RC, EC, A>,
    bd: (_: B) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RA | RC, RB | RD, EC, ED, C, D> {
    return new PSynchronizedInternal(
      this.semaphore,
      this.unsafeGet.matchIO((e) => IO.failNow(eb(e)), bd),
      (c) => ca(c).flatMap((a) => this.unsafeSet(a).mapError(ea)),
    );
  }

  match<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ca: (_: C) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RA, RB, EC, ED, C, D> {
    return this.matchIO(
      ea,
      eb,
      (c) => IO.fromEitherNow(ca(c)),
      (b) => IO.fromEitherNow(bd(b)),
    );
  }

  matchAll<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ec: (_: EB) => EC,
    ca: (_: C) => (_: B) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RA, RB, EC, ED, C, D> {
    return this.matchAllIO(
      ea,
      eb,
      ec,
      (c) => (b) => IO.fromEitherNow(ca(c)(b)),
      (b) => IO.fromEitherNow(bd(b)),
    ) as PSynchronizedInternal<RA, RB, EC, ED, C, D>;
  }

  withPermit<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
    return this.semaphore.withPermit(io);
  }
}

/**
 * @tsplus macro remove
 */
export function concreteSynchronized<RA, RB, EA, EB, A, B>(
  self: PSynchronized<RA, RB, EA, EB, A, B>,
): asserts self is PSynchronizedInternal<RA, RB, EA, EB, A, B> {
  //
}
