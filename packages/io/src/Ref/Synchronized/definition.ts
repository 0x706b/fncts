import type { PRef } from "../definition.js";

import { RefInternal } from "../definition.js";

/**
 * @tsplus type fncts.control.Ref.Synchronized
 */
export interface PSynchronized<RA, RB, EA, EB, A, B> extends PRef<RA, RB, EA, EB, A, B> {}

/**
 * @tsplus type fncts.control.Ref.SynchronizedOps
 */
export interface PSynchronizedOps {}

/**
 * @tsplus static fncts.control.RefOps Synchronized
 */
export const Synchronized: PSynchronizedOps = {};

/**
 * @tsplus type fncts.control.Ref.Synchronized
 */
export class PSynchronizedInternal<RA, RB, EA, EB, A, B> extends RefInternal<RA, RB, EA, EB, A, B> {
  readonly _tag = "Synchronized";
  constructor(
    readonly semaphores: Set<TSemaphore>,
    readonly unsafeGet: IO<RB, EB, B>,
    readonly unsafeSet: (a: A) => IO<RA, EA, void>,
  ) {
    super();
  }

  get get(): IO<RB, EB, B> {
    if (this.semaphores.size === 1) {
      return this.unsafeGet;
    } else {
      return this.withPermit(this.unsafeGet);
    }
  }

  set(a: A, __tsplusTrace?: string): IO<RA, EA, void> {
    return this.withPermit(this.unsafeSet(a));
  }

  matchAllIO<RC, RD, EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ec: (_: EB) => EC,
    ca: (_: C) => (_: B) => IO<RC, EC, A>,
    bd: (_: B) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RA & RC & RB, RB & RD, EC, ED, C, D> {
    return new PSynchronizedInternal(
      this.semaphores,
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
  ): PSynchronizedInternal<RA & RC, RB & RD, EC, ED, C, D> {
    return new PSynchronizedInternal(
      this.semaphores,
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
    return IO.uninterruptibleMask(({ restore }) =>
      restore(STM.foreach(this.semaphores, (s) => s.acquire).commit).apSecond(
        restore(io).ensuring(STM.foreach(this.semaphores, (s) => s.release).commit),
      ),
    );
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
