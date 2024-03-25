import { tuple } from "@fncts/base/data/function";
import { concrete, QueueInternal } from "@fncts/io/Queue/definition";

class ZipWithIO<RA, RB, EA, EB, A, B, RA1, RB1, EA1, EB1, A1 extends A, B1, R3, E3, C> extends QueueInternal<
  RA | RA1,
  RB | RB1 | R3,
  EA | EA1,
  E3 | EB | EB1,
  A1,
  C
> {
  constructor(
    readonly fa: QueueInternal<RA, RB, EA, EB, A, B>,
    readonly fb: QueueInternal<RA1, RB1, EA1, EB1, A1, B1>,
    readonly f: (b: B, c: B1) => IO<R3, E3, C>,
  ) {
    super();
  }

  awaitShutdown: UIO<void> = this.fa.awaitShutdown.flatMap(() => this.fb.awaitShutdown);

  capacity: number = Math.min(this.fa.capacity, this.fb.capacity);

  isShutdown: UIO<boolean> = this.fa.isShutdown;

  get unsafeSize(): Maybe<number> {
    return this.fa.unsafeSize.zipWith(this.fb.unsafeSize, (a, b) => Math.max(a, b));
  }

  unsafeOffer(a: A): boolean {
    throw new Error("Cannot unsafely offer to an effectful Queue");
  }

  offer(a: A1): IO<RA | RA1, EA1 | EA, boolean> {
    return this.fa.offer(a).zipWithConcurrent(this.fb.offer(a), (x, y) => x && y);
  }

  offerAll(as: Iterable<A1>): IO<RA | RA1, EA1 | EA, boolean> {
    return this.fa.offerAll(as).zipWithConcurrent(this.fb.offerAll(as), (x, y) => x && y);
  }

  shutdown: UIO<void> = this.fa.shutdown.zipWithConcurrent(this.fb.shutdown, () => undefined);

  size: UIO<number> = this.fa.size.zipWithConcurrent(this.fb.size, (x, y) => Math.max(x, y));

  take: IO<RB | RB1 | R3, E3 | EB | EB1, C> = this.fa.take
    .zipConcurrent(this.fb.take)
    .flatMap(([b, c]) => this.f(b, c));

  takeAll: IO<RB | RB1 | R3, E3 | EB | EB1, Conc<C>> = this.fa.takeAll
    .zipConcurrent(this.fb.takeAll)
    .flatMap(([bs, cs]) => IO.foreach(bs.zip(cs), ([b, c]) => this.f(b, c)));

  takeUpTo(max: number): IO<RB | RB1 | R3, E3 | EB | EB1, Conc<C>> {
    return this.fa
      .takeUpTo(max)
      .zipConcurrent(this.fb.takeUpTo(max))
      .flatMap(([bs, cs]) => IO.foreach(bs.zip(cs), ([b, c]) => this.f(b, c)));
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
 * @tsplus pipeable fncts.io.Queue zipWithIO
 */
export function zipWithIO<A, B, RA1, RB1, EA1, EB1, A1 extends A, B1, R3, E3, D>(
  fb: PQueue<RA1, RB1, EA1, EB1, A1, B1>,
  f: (b: B, c: B1) => IO<R3, E3, D>,
  __tsplusTrace?: string,
) {
  return <RA, RB, EA, EB>(
    fa: PQueue<RA, RB, EA, EB, A, B>,
  ): PQueue<RA | RA1, RB | RB1 | R3, EA | EA1, E3 | EB | EB1, A1, D> => {
    concrete(fa);
    concrete(fb);
    return new ZipWithIO(fa, fb, f);
  };
}

/**
 * Like `zipWithIO`, but uses a pure function.
 *
 * @tsplus pipeable fncts.io.Queue zipWith
 */
export function zipWith<A, B, RA1, RB1, EA1, EB1, A1 extends A, B1, C>(
  that: PQueue<RA1, RB1, EA1, EB1, A1, B1>,
  f: (a: B, b: B1) => C,
  __tsplusTrace?: string,
) {
  return <RA, RB, EA, EB>(
    queue: PQueue<RA, RB, EA, EB, A, B>,
  ): PQueue<RA | RA1, RB | RB1, EA | EA1, EB | EB1, A1, C> => {
    return queue.zipWithIO(that, (b, c) => IO.succeedNow(f(b, c)));
  };
}

/**
 * Like `zipWith`, but tuples the elements instead of applying a function.
 *
 * @tsplus pipeable fncts.io.Queue zip
 */
export function zip<A, B, RA1, RB1, EA1, EB1, A1 extends A, B1>(
  that: PQueue<RA1, RB1, EA1, EB1, A1, B1>,
  __tsplusTrace?: string,
) {
  return <RA, RB, EA, EB>(
    queue: PQueue<RA, RB, EA, EB, A, B>,
  ): PQueue<RA | RA1, RB | RB1, EA | EA1, EB | EB1, A1, readonly [B, B1]> => {
    return queue.zipWith(that, tuple);
  };
}
