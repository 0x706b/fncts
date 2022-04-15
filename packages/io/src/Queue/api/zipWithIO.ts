import { tuple } from "@fncts/base/data/function";
import { concrete, QueueInternal } from "@fncts/io/Queue/definition";

export class ZipWithIO<RA, RB, EA, EB, RA1, RB1, EA1, EB1, A1 extends A, C, B, R3, E3, D, A> extends QueueInternal<
  RA & RA1,
  RB & RB1 & R3,
  EA | EA1,
  E3 | EB | EB1,
  A1,
  D
> {
  constructor(
    readonly fa: QueueInternal<RA, RB, EA, EB, A, B>,
    readonly fb: QueueInternal<RA1, RB1, EA1, EB1, A1, C>,
    readonly f: (b: B, c: C) => IO<R3, E3, D>,
  ) {
    super();
  }

  awaitShutdown: UIO<void> = this.fa.awaitShutdown.chain(() => this.fb.awaitShutdown);

  capacity: number = Math.min(this.fa.capacity, this.fb.capacity);

  isShutdown: UIO<boolean> = this.fa.isShutdown;

  offer(a: A1): IO<RA & RA1, EA1 | EA, boolean> {
    return this.fa.offer(a).zipWithC(this.fb.offer(a), (x, y) => x && y);
  }

  offerAll(as: Iterable<A1>): IO<RA & RA1, EA1 | EA, boolean> {
    return this.fa.offerAll(as).zipWithC(this.fb.offerAll(as), (x, y) => x && y);
  }

  shutdown: UIO<void> = this.fa.shutdown.zipWithC(this.fb.shutdown, () => undefined);

  size: UIO<number> = this.fa.size.zipWithC(this.fb.size, (x, y) => Math.max(x, y));

  take: IO<RB & RB1 & R3, E3 | EB | EB1, D> = this.fa.take.zipC(this.fb.take).chain(([b, c]) => this.f(b, c));

  takeAll: IO<RB & RB1 & R3, E3 | EB | EB1, Conc<D>> = this.fa.takeAll
    .zipC(this.fb.takeAll)
    .chain(([bs, cs]) => IO.foreach(bs.zip(cs), ([b, c]) => this.f(b, c)));

  takeUpTo(max: number): IO<RB & RB1 & R3, E3 | EB | EB1, Conc<D>> {
    return this.fa
      .takeUpTo(max)
      .zipC(this.fb.takeUpTo(max))
      .chain(([bs, cs]) => IO.foreach(bs.zip(cs), ([b, c]) => this.f(b, c)));
  }
}

/**
 * Creates a new queue from this queue and another. Offering to the composite queue
 * will broadcast the elements to both queues; taking from the composite queue
 * will dequeue elements from both queues and apply the function point-wise.
 *
 * Note that using queues with different strategies may result in surprising behavior.
 * For example, a dropping queue and a bounded queue composed together may apply `f`
 * to different elements.
 *
 * @tsplus fluent fncts.control.Queue zipWithIO
 */
export function zipWithIO_<RA, RB, EA, EB, RA1, RB1, EA1, EB1, A1 extends A, C, B, R3, E3, D, A>(
  fa: PQueue<RA, RB, EA, EB, A, B>,
  fb: PQueue<RA1, RB1, EA1, EB1, A1, C>,
  f: (b: B, c: C) => IO<R3, E3, D>,
): PQueue<RA & RA1, RB & RB1 & R3, EA | EA1, E3 | EB | EB1, A1, D> {
  concrete(fa);
  concrete(fb);
  return new ZipWithIO(fa, fb, f);
}

/**
 * Like `zipWithM`, but uses a pure function.
 *
 * @tsplus fluent fncts.control.Queue zipWith
 */
export function zipWith_<RA, RB, EA, EB, RA1, RB1, EA1, EB1, A1 extends A, C, B, D, A>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  that: PQueue<RA1, RB1, EA1, EB1, A1, C>,
  f: (b: B, c: C) => D,
): PQueue<RA & RA1, RB & RB1, EA | EA1, EB | EB1, A1, D> {
  return zipWithIO_(queue, that, (b, c) => IO.succeedNow(f(b, c)));
}

/**
 * Like `zipWith`, but tuples the elements instead of applying a function.
 *
 * @tsplus fluent fncts.control.Queue zip
 */
export function zip_<RA, RB, EA, EB, RA1, RB1, EA1, EB1, A1 extends A, C, B, A>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  that: PQueue<RA1, RB1, EA1, EB1, A1, C>,
): PQueue<RA & RA1, RB & RB1, EA | EA1, EB | EB1, A1, readonly [B, C]> {
  return zipWith_(queue, that, tuple);
}
