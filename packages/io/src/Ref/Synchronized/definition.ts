import type { PRef, RefVariance } from "../definition.js";

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

export interface ModifiableSynchronized<RA, RB, EA, EB, A, B> {
  readonly [RefVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _RB: (_: never) => RB;
    readonly _EA: (_: never) => EA;
    readonly _EB: (_: never) => EB;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => B;
  };

  modifyIO<R1, E1, C>(
    f: (b: B) => IO<R1, E1, readonly [C, A]>,
    __tsplusTrace?: string,
  ): IO<RA | RB | R1, EA | EB | E1, C>;
}

export interface MappableSynchronized<RA, RB, EA, EB, A, B> {
  readonly [RefVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _RB: (_: never) => RB;
    readonly _EA: (_: never) => EA;
    readonly _EB: (_: never) => EB;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => B;
  };

  matchIO<RC, RD, EC, ED, C, D>(
    mapSetError: (_: EA) => EC,
    mapGetError: (_: EB) => ED,
    mapSet: (_: C) => IO<RC, EC, A>,
    mapGet: (_: B) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronized<RA | RC, RB | RD, EC, ED, C, D>;

  matchAllIO<RC, RD, EC, ED, C, D>(
    mapSetError: (_: EA) => EC,
    mapGetError: (_: EB) => ED,
    mapSetGetError: (_: EB) => EC,
    mapSet: (_: C) => (_: B) => IO<RC, EC, A>,
    mapGet: (_: B) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronized<RA | RC | RB, RB | RD, EC, ED, C, D>;
}

/**
 * @tsplus type fncts.io.Ref.Synchronized
 */
export class PSynchronizedInternal<RA, RB, EA, EB, A, B> extends RefInternal<RA, RB, EA, EB, A, B> {
  readonly [SynchronizedTypeId]: SynchronizedTypeId = SynchronizedTypeId;
  constructor(
    protected semaphore: Semaphore,
    protected unsafeGet: IO<RB, EB, B>,
    protected unsafeSet: (a: A) => IO<RA, EA, void>,
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
    return this.withPermit(this.unsafeGet.flatMap(f).flatMap(([c, a]) => this.unsafeSet(a).as(c)));
  }

  matchAllIO<RC, RD, EC, ED, C, D>(
    mapSetError: (_: EA) => EC,
    mapGetError: (_: EB) => ED,
    mapSetGetError: (_: EB) => EC,
    mapSet: (_: C) => (_: B) => IO<RC, EC, A>,
    mapGet: (_: B) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RA | RC | RB, RB | RD, EC, ED, C, D> {
    return new PSynchronizedInternal(
      this.semaphore,
      this.get.matchIO((e) => IO.failNow(mapGetError(e)), mapGet),
      (c) =>
        this.get.matchIO(
          (e) => IO.failNow(mapSetGetError(e)),
          (b) => mapSet(c)(b).flatMap((a) => this.unsafeSet(a).mapError(mapSetError)),
        ),
    );
  }

  matchIO<RC, RD, EC, ED, C, D>(
    mapSetError: (_: EA) => EC,
    mapGetError: (_: EB) => ED,
    mapSet: (_: C) => IO<RC, EC, A>,
    mapGet: (_: B) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RA | RC, RB | RD, EC, ED, C, D> {
    return new PSynchronizedInternal(
      this.semaphore,
      this.unsafeGet.matchIO((e) => IO.failNow(mapGetError(e)), mapGet),
      (c) => mapSet(c).flatMap((a) => this.unsafeSet(a).mapError(mapSetError)),
    );
  }

  match<EC, ED, C, D>(
    mapSetError: (_: EA) => EC,
    mapGetError: (_: EB) => ED,
    mapSet: (_: C) => Either<EC, A>,
    mapGet: (_: B) => Either<ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RA, RB, EC, ED, C, D> {
    return this.matchIO(
      mapSetError,
      mapGetError,
      (c) => IO.fromEitherNow(mapSet(c)),
      (b) => IO.fromEitherNow(mapGet(b)),
    );
  }

  matchAll<EC, ED, C, D>(
    mapSetError: (_: EA) => EC,
    mapGetError: (_: EB) => ED,
    mapSetGetError: (_: EB) => EC,
    mapSet: (_: C) => (_: B) => Either<EC, A>,
    mapGet: (_: B) => Either<ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RA, RB, EC, ED, C, D> {
    return this.matchAllIO(
      mapSetError,
      mapGetError,
      mapSetGetError,
      (c) => (b) => IO.fromEitherNow(mapSet(c)(b)),
      (b) => IO.fromEitherNow(mapGet(b)),
    ) as PSynchronizedInternal<RA, RB, EC, ED, C, D>;
  }

  protected withPermit<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
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
