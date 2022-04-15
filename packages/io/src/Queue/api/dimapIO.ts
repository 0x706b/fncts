import { concrete, QueueInternal } from "@fncts/io/Queue/definition";

class DimapIO<RA, RB, EA, EB, A, B, C, RC, EC, RD, ED, D> extends QueueInternal<
  RC & RA,
  RD & RB,
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

  offer(c: C): IO<RC & RA, EA | EC, boolean> {
    return this.f(c).chain((a) => this.queue.offer(a));
  }

  offerAll(cs: Iterable<C>): IO<RC & RA, EC | EA, boolean> {
    return IO.foreach(cs, this.f).chain((as) => this.queue.offerAll(as));
  }

  shutdown: UIO<void> = this.queue.shutdown;

  size: UIO<number> = this.queue.size;

  take: IO<RD & RB, ED | EB, D> = this.queue.take.chain(this.g);

  takeAll: IO<RD & RB, ED | EB, Conc<D>> = this.queue.takeAll.chain((bs) => IO.foreach(bs, this.g));

  takeUpTo(n: number): IO<RD & RB, ED | EB, Conc<D>> {
    return this.queue.takeUpTo(n).chain((bs) => IO.foreach(bs, this.g));
  }
}

/**
 * Transforms elements enqueued into and dequeued from this queue with the
 * specified effectual functions.
 *
 * @tsplus fluent fncts.control.Queue dimap
 */
export function dimap_<RA, RB, EA, EB, A, B, C, D>(self: PQueue<RA, RB, EA, EB, A, B>, f: (c: C) => A, g: (b: B) => D) {
  return self.dimapIO(
    (c: C) => IO.succeedNow(f(c)),
    (b) => IO.succeedNow(g(b)),
  );
}

/**
 * Transforms elements enqueued into and dequeued from this queue with the
 * specified effectual functions.
 *
 * @tsplus fluent fncts.control.Queue dimapIO
 */
export function dimapIO_<RA, RB, EA, EB, A, B, C, RC, EC, RD, ED, D>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  f: (c: C) => IO<RC, EC, A>,
  g: (b: B) => IO<RD, ED, D>,
): PQueue<RC & RA, RD & RB, EC | EA, ED | EB, C, D> {
  concrete(queue);
  return new DimapIO(queue, f, g);
}

/**
 * Transforms elements enqueued into this queue with an effectful function.
 *
 * @tsplus fluent fncts.control.Queue contramapIO
 */
export function contramapIO_<RA, RB, EA, EB, A, B, RC, EC, C>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  f: (c: C) => IO<RC, EC, A>,
): PQueue<RA & RC, RB, EA | EC, EB, C, B> {
  return queue.dimapIO(f, IO.succeedNow);
}

/**
 * Transforms elements enqueued into this queue with an effectful function.
 *
 * @tsplus fluent fncts.control.Queue contramap
 */
export function contramap_<RA, RB, EA, EB, A, B, C>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  f: (c: C) => A,
): PQueue<RA, RB, EA, EB, C, B> {
  return queue.contramapIO((c) => IO.succeedNow(f(c)));
}

/**
 * Transforms elements dequeued from this queue with an effectful function.
 *
 * @tsplus fluent fncts.control.Queue mapIO
 */
export function mapIO_<RA, RB, EA, EB, A, B, R2, E2, C>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  f: (b: B) => IO<R2, E2, C>,
): PQueue<RA, R2 & RB, EA, EB | E2, A, C> {
  return queue.dimapIO(IO.succeedNow, f);
}

/**
 * Transforms elements dequeued from this queue with a function.
 *
 * @tsplus fluent fncts.control.Queue map
 */
export function map_<RA, RB, EA, EB, A, B, C>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  f: (b: B) => C,
): PQueue<RA, RB, EA, EB, A, C> {
  return queue.mapIO((b) => IO.succeedNow(f(b)));
}
