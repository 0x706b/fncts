import type { Either } from "../../../data/Either";
import type { TSemaphore } from "../../TSemaphore";
import type { PRef } from "../definition";

import { IO } from "../../IO";
import { STM } from "../../STM";
import { RefInternal } from "../definition";

/**
 * @tsplus type fncts.control.Ref.Synchronized
 * @tsplus companion fncts.control.Ref.SynchronizedOps
 */
export class PSynchronized<RA, RB, EA, EB, A, B> extends RefInternal<
  RA,
  RB,
  EA,
  EB,
  A,
  B
> {
  readonly _tag = "Synchronized";
  constructor(
    readonly semaphores: Set<TSemaphore>,
    readonly unsafeGet: IO<RB, EB, B>,
    readonly unsafeSet: (a: A) => IO<RA, EA, void>
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
    __tsplusTrace?: string
  ): PRef<RA & RC & RB, RB & RD, EC, ED, C, D> {
    return new PSynchronized(
      this.semaphores,
      this.get.matchIO((e) => IO.failNow(eb(e)), bd),
      (c) =>
        this.get.matchIO(
          (e) => IO.failNow(ec(e)),
          (b) => ca(c)(b).chain((a) => this.unsafeSet(a).mapError(ea))
        )
    );
  }

  matchIO<RC, RD, EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ca: (_: C) => IO<RC, EC, A>,
    bd: (_: B) => IO<RD, ED, D>,
    __tsplusTrace?: string
  ): PRef<RA & RC, RB & RD, EC, ED, C, D> {
    return new PSynchronized(
      this.semaphores,
      this.unsafeGet.matchIO((e) => IO.failNow(eb(e)), bd),
      (c) => ca(c).chain((a) => this.unsafeSet(a).mapError(ea))
    );
  }

  match<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ca: (_: C) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
    __tsplusTrace?: string
  ): PRef<RA, RB, EC, ED, C, D> {
    return this.matchIO(
      ea,
      eb,
      (c) => IO.fromEitherNow(ca(c)),
      (b) => IO.fromEitherNow(bd(b))
    );
  }

  matchAll<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ec: (_: EB) => EC,
    ca: (_: C) => (_: B) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
    __tsplusTrace?: string
  ): PRef<RA, RB, EC, ED, C, D> {
    return this.matchAllIO(
      ea,
      eb,
      ec,
      (c) => (b) => IO.fromEitherNow(ca(c)(b)),
      (b) => IO.fromEitherNow(bd(b))
    ) as PRef<RA, RB, EC, ED, C, D>;
  }

  withPermit<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
    return IO.uninterruptibleMask(({ restore }) =>
      restore(
        STM.foreach(this.semaphores, (s) => s.acquire).atomically
      ).apSecond(
        restore(io).ensuring(
          STM.foreach(this.semaphores, (s) => s.release).atomically
        )
      )
    );
  }
}
