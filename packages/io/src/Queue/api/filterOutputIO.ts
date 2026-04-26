import type { PDequeue, PDequeueInternal } from "@fncts/io/Queue/definition";

import { concrete, DequeueTypeId, QueueInternal, QueueTypeId, QueueVariance } from "@fncts/io/Queue/definition";

class FilterOutputIO<RA, RB, EA, EB, A, B, RB1, EB1> extends QueueInternal<RA, RB | RB1, EA, EB | EB1, A, B> {
  constructor(
    readonly queue: QueueInternal<RA, RB, EA, EB, A, B>,
    readonly f: (b: B) => IO<RB1, EB1, boolean>,
  ) {
    super();
  }

  get awaitShutdown(): UIO<void> {
    return this.queue.awaitShutdown;
  }

  get capacity(): number {
    return this.queue.capacity;
  }

  get isShutdown(): UIO<boolean> {
    return this.queue.isShutdown;
  }

  get unsafeSize(): Maybe<number> {
    return this.queue.unsafeSize;
  }

  unsafeOffer(a: A): boolean {
    throw new Error("Cannot unsafely offer to an effectful Queue");
  }

  offer(a: A): IO<RA, EA, boolean> {
    return this.queue.offer(a);
  }

  offerAll(as: Iterable<A>): IO<RA, EA, boolean> {
    return this.queue.offerAll(as);
  }

  get shutdown(): UIO<void> {
    return this.queue.shutdown;
  }

  get size(): UIO<number> {
    return this.queue.size;
  }

  get take(): IO<RB | RB1, EB1 | EB, B> {
    return this.queue.take.flatMap((b) => this.f(b).flatMap((p) => (p ? IO.succeedNow(b) : this.take)));
  }

  get takeAll(): IO<RB | RB1, EB | EB1, Conc<B>> {
    return this.queue.takeAll.flatMap((bs) => IO.filter(bs, this.f));
  }

  loop(max: number, acc: Conc<B>): IO<RB | RB1, EB | EB1, Conc<B>> {
    return this.queue.takeUpTo(max).flatMap((bs) => {
      if (bs.isEmpty) {
        return IO.succeedNow(acc);
      }

      return IO.filter(bs, this.f).flatMap((filtered) => {
        const length = filtered.length;

        if (length === max) {
          return IO.succeedNow(acc.concat(filtered));
        } else {
          return this.loop(max - length, acc.concat(filtered));
        }
      });
    });
  }

  takeUpTo(n: number): IO<RB | RB1, EB | EB1, Conc<B>> {
    return IO.defer(this.loop(n, Conc.empty()));
  }
}

/**
 * @tsplus pipeable fncts.io.Queue filterOutputIO
 */
export function filterOutputIO<B, RB1, EB1>(f: (b: B) => IO<RB1, EB1, boolean>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(queue: PQueue<RA, RB, EA, EB, A, B>): PQueue<RA, RB | RB1, EA, EB | EB1, A, B> => {
    concrete(queue);
    return new FilterOutputIO(queue, f);
  };
}

/**
 * @tsplus pipeable fncts.io.Queue filterOutput
 */
export function filterOutput<B>(p: Predicate<B>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(queue: PQueue<RA, RB, EA, EB, A, B>): PQueue<RA, RB, EA, EB, A, B> => {
    return queue.filterOutputIO((b) => IO.succeedNow(p(b)));
  };
}

class FilterOutputDequeueIO<RA, RB, EA, EB, A, B, RB1, EB1>
  implements PDequeueInternal<RA, RB | RB1, EA, EB | EB1, A, B>
{
  readonly [QueueTypeId]: QueueTypeId     = QueueTypeId;
  readonly [DequeueTypeId]: DequeueTypeId = DequeueTypeId;
  declare [QueueVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _RB: (_: never) => RB | RB1;
    readonly _EA: (_: never) => EA;
    readonly _EB: (_: never) => EB | EB1;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => B;
  };
  constructor(
    readonly queue: PDequeueInternal<RA, RB, EA, EB, A, B>,
    readonly f: (b: B) => IO<RB1, EB1, boolean>,
  ) {}

  get awaitShutdown(): UIO<void> {
    return this.queue.awaitShutdown;
  }

  get capacity(): number {
    return this.queue.capacity;
  }

  get isShutdown(): UIO<boolean> {
    return this.queue.isShutdown;
  }

  get shutdown(): UIO<void> {
    return this.queue.shutdown;
  }

  get size(): UIO<number> {
    return this.queue.size;
  }

  get unsafeSize(): Maybe<number> {
    return this.queue.unsafeSize;
  }

  unsafeOffer(a: A): boolean {
    throw new Error("Cannot unsafely offer to an effectful Queue");
  }

  get take(): IO<RB | RB1, EB1 | EB, B> {
    return this.queue.take.flatMap((b) => this.f(b).flatMap((p) => (p ? IO.succeedNow(b) : this.take)));
  }

  get takeAll(): IO<RB | RB1, EB | EB1, Conc<B>> {
    return this.queue.takeAll.flatMap((bs) => IO.filter(bs, this.f));
  }

  loop(max: number, acc: Conc<B>): IO<RB | RB1, EB | EB1, Conc<B>> {
    return this.queue.takeUpTo(max).flatMap((bs) => {
      if (bs.isEmpty) {
        return IO.succeedNow(acc);
      }

      return IO.filter(bs, this.f).flatMap((filtered) => {
        const length = filtered.length;

        if (length === max) {
          return IO.succeedNow(acc.concat(filtered));
        } else {
          return this.loop(max - length, acc.concat(filtered));
        }
      });
    });
  }

  takeUpTo(n: number): IO<RB | RB1, EB | EB1, Conc<B>> {
    return IO.defer(this.loop(n, Conc.empty()));
  }
}

/**
 * @tsplus pipeable fncts.io.Queue.Dequeue filterOutputIO
 */
export function filterOutputDequeueIO<B, RB1, EB1>(f: (b: B) => IO<RB1, EB1, boolean>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(queue: PDequeue<RA, RB, EA, EB, A, B>): PDequeue<RA, RB | RB1, EA, EB | EB1, A, B> => {
    concrete(queue);
    return new FilterOutputDequeueIO(queue, f);
  };
}
