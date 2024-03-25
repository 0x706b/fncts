import type { Maybe } from "@fncts/base/data/Maybe";
import type { UIO } from "@fncts/io/IO";
import type { PDequeue, PDequeueInternal, PEnqueue, PEnqueueInternal } from "@fncts/io/Queue/definition";

import {
  concrete,
  DequeueTypeId,
  EnqueueTypeId,
  QueueInternal,
  QueueTypeId,
  QueueVariance,
} from "@fncts/io/Queue/definition";

class DimapIO<RA, RB, EA, EB, A, B, RC, EC, C, RD, ED, D> extends QueueInternal<
  RC | RA,
  RD | RB,
  EC | EA,
  ED | EB,
  C,
  D
> {
  constructor(
    readonly queue: QueueInternal<RA, RB, EA, EB, A, B>,
    readonly f: (c: C) => IO<RC, EC, A>,
    readonly g: (b: B) => IO<RD, ED, D>,
  ) {
    super();
  }

  awaitShutdown: UIO<void> = this.queue.awaitShutdown;

  capacity: number = this.queue.capacity;

  isShutdown: UIO<boolean> = this.queue.isShutdown;

  get unsafeSize(): Maybe<number> {
    return this.queue.unsafeSize;
  }

  unsafeOffer(a: C): boolean {
    throw new Error("Cannot unsafely offer to an effectful Queue");
  }

  offer(c: C): IO<RC | RA, EA | EC, boolean> {
    return this.f(c).flatMap((a) => this.queue.offer(a));
  }

  offerAll(cs: Iterable<C>): IO<RC | RA, EC | EA, boolean> {
    return IO.foreach(cs, this.f).flatMap((as) => this.queue.offerAll(as));
  }

  shutdown: UIO<void> = this.queue.shutdown;

  size: UIO<number> = this.queue.size;

  take: IO<RD | RB, ED | EB, D> = this.queue.take.flatMap(this.g);

  takeAll: IO<RD | RB, ED | EB, Conc<D>> = this.queue.takeAll.flatMap((bs) => IO.foreach(bs, this.g));

  takeUpTo(n: number): IO<RD | RB, ED | EB, Conc<D>> {
    return this.queue.takeUpTo(n).flatMap((bs) => IO.foreach(bs, this.g));
  }
}

/**
 * Transforms elements enqueued into and dequeued from this queue with the
 * specified effectual functions.
 *
 * @tsplus pipeable fncts.io.Queue dimap
 */
export function dimap<A, B, C, D>(f: (c: C) => A, g: (b: B) => D, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PQueue<RA, RB, EA, EB, A, B>) => {
    return self.dimapIO(
      (c: C) => IO.succeedNow(f(c)),
      (b) => IO.succeedNow(g(b)),
    );
  };
}

/**
 * Transforms elements enqueued into and dequeued from this queue with the
 * specified effectual functions.
 *
 * @tsplus pipeable fncts.io.Queue dimapIO
 */
export function dimapIO_<A, B, RC, EC, C, RD, ED, D>(
  f: (c: C) => IO<RC, EC, A>,
  g: (b: B) => IO<RD, ED, D>,
  __tsplusTrace?: string,
) {
  return <RA, RB, EA, EB>(queue: PQueue<RA, RB, EA, EB, A, B>): PQueue<RC | RA, RD | RB, EC | EA, ED | EB, C, D> => {
    concrete(queue);
    return new DimapIO(queue, f, g);
  };
}

/**
 * Transforms elements enqueued into this queue with an effectful function.
 *
 * @tsplus pipeable fncts.io.Queue contramapIO
 */
export function contramapInputIO<A, RC, EC, C>(f: (c: C) => IO<RC, EC, A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(self: PQueue<RA, RB, EA, EB, A, B>): PQueue<RA | RC, RB, EA | EC, EB, C, B> => {
    return self.dimapIO(f, IO.succeedNow);
  };
}

/**
 * Transforms elements enqueued into this queue with an effectful function.
 *
 * @tsplus pipeable fncts.io.Queue contramap
 */
export function contramapInput<A, C>(f: (c: C) => A, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(queue: PQueue<RA, RB, EA, EB, A, B>): PQueue<RA, RB, EA, EB, C, B> => {
    return queue.contramapIO((c) => IO.succeedNow(f(c)));
  };
}

/**
 * Transforms elements dequeued from this queue with an effectful function.
 *
 * @tsplus pipeable fncts.io.Queue mapIO
 */
export function mapIO<B, R2, E2, C>(f: (b: B) => IO<R2, E2, C>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(queue: PQueue<RA, RB, EA, EB, A, B>): PQueue<RA, R2 | RB, EA, EB | E2, A, C> => {
    return queue.dimapIO(IO.succeedNow, f);
  };
}

/**
 * Transforms elements dequeued from this queue with a function.
 *
 * @tsplus pipeable fncts.io.Queue map
 */
export function map<B, C>(f: (b: B) => C, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(queue: PQueue<RA, RB, EA, EB, A, B>): PQueue<RA, RB, EA, EB, A, C> => {
    return queue.mapIO((b) => IO.succeedNow(f(b)));
  };
}

class ContramapIO<RA, RB, EA, EB, A, B, RC, EC, C> implements PEnqueueInternal<RA | RC, RB, EA | EC, EB, C, B> {
  readonly [EnqueueTypeId]: EnqueueTypeId = EnqueueTypeId;
  readonly [QueueTypeId]: QueueTypeId     = QueueTypeId;
  declare [QueueVariance]: {
    readonly _RA: (_: never) => RA | RC;
    readonly _RB: (_: never) => RB;
    readonly _EA: (_: never) => EA | EC;
    readonly _EB: (_: never) => EB;
    readonly _A: (_: C) => void;
    readonly _B: (_: never) => B;
  };
  constructor(
    readonly queue: PEnqueueInternal<RA, RB, EA, EB, A, B>,
    readonly f: (c: C) => IO<RC, EC, A>,
  ) {}

  awaitShutdown: UIO<void> = this.queue.awaitShutdown;

  capacity: number = this.queue.capacity;

  isShutdown: UIO<boolean> = this.queue.isShutdown;

  get unsafeSize(): Maybe<number> {
    return this.queue.unsafeSize;
  }

  unsafeOffer(a: C): boolean {
    throw new Error("Cannot unsafely offer to an effectful Queue");
  }

  offer(c: C): IO<RC | RA, EA | EC, boolean> {
    return this.f(c).flatMap((a) => this.queue.offer(a));
  }

  offerAll(cs: Iterable<C>): IO<RC | RA, EC | EA, boolean> {
    return IO.foreach(cs, this.f).flatMap((as) => this.queue.offerAll(as));
  }

  shutdown: UIO<void> = this.queue.shutdown;

  size: UIO<number> = this.queue.size;
}

/**
 * Transforms elements enqueued into this queue with an effectful function.
 *
 * @tsplus pipeable fncts.io.Queue.Enqueue contramapIO
 */
export function contramapEnqueueIO<A, RC, EC, C>(f: (c: C) => IO<RC, EC, A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(self: PEnqueue<RA, RB, EA, EB, A, B>) => {
    concrete(self);
    return new ContramapIO(self, f);
  };
}

class MapIO<RA, RB, EA, EB, A, B, RC, EC, C> implements PDequeueInternal<RA, RB | RC, EA, EB | EC, A, C> {
  readonly [DequeueTypeId]: DequeueTypeId = DequeueTypeId;
  readonly [QueueTypeId]: QueueTypeId     = QueueTypeId;
  declare [QueueVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _RB: (_: never) => RB | RC;
    readonly _EA: (_: never) => EA;
    readonly _EB: (_: never) => EB | EC;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => C;
  };
  constructor(
    readonly queue: PDequeueInternal<RA, RB, EA, EB, A, B>,
    readonly f: (b: B) => IO<RC, EC, C>,
  ) {}

  awaitShutdown: UIO<void> = this.queue.awaitShutdown;

  capacity: number = this.queue.capacity;

  isShutdown: UIO<boolean> = this.queue.isShutdown;

  shutdown: UIO<void> = this.queue.shutdown;

  size: UIO<number> = this.queue.size;

  get unsafeSize(): Maybe<number> {
    return this.queue.unsafeSize;
  }

  unsafeOffer(a: C): boolean {
    throw new Error("Cannot unsafely offer to an effectful Queue");
  }

  take: IO<RB | RC, EB | EC, C> = this.queue.take.flatMap(this.f);

  takeAll: IO<RB | RC, EB | EC, Conc<C>> = this.queue.takeAll.flatMap((bs) => IO.foreach(bs, this.f));

  takeUpTo(n: number): IO<RB | RC, EB | EC, Conc<C>> {
    return this.queue.takeUpTo(n).flatMap((bs) => IO.foreach(bs, this.f));
  }
}

/**
 * Transforms elements enqueued into this queue with an effectful function.
 *
 * @tsplus pipeable fncts.io.Queue.Dequeue mapIO
 */
export function mapDequeueIO<B, RC, EC, C>(f: (b: B) => IO<RC, EC, C>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(self: PDequeue<RA, RB, EA, EB, A, B>) => {
    concrete(self);
    return new MapIO(self, f);
  };
}
