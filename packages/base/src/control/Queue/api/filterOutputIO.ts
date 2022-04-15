import { concrete, QueueInternal } from "@fncts/base/control/Queue/definition";

export class FilterOutputIO<RA, RB, EA, EB, A, B, RB1, EB1> extends QueueInternal<RA, RB & RB1, EA, EB | EB1, A, B> {
  constructor(readonly queue: QueueInternal<RA, RB, EA, EB, A, B>, readonly f: (b: B) => IO<RB1, EB1, boolean>) {
    super();
  }

  awaitShutdown: UIO<void> = this.queue.awaitShutdown;

  capacity: number = this.queue.capacity;

  isShutdown: UIO<boolean> = this.queue.isShutdown;

  offer(a: A): IO<RA, EA, boolean> {
    return this.queue.offer(a);
  }

  offerAll(as: Iterable<A>): IO<RA, EA, boolean> {
    return this.queue.offerAll(as);
  }

  shutdown: UIO<void> = this.queue.shutdown;

  size: UIO<number> = this.queue.size;

  take: IO<RB & RB1, EB1 | EB, B> = this.queue.take.chain((b) =>
    this.f(b).chain((p) => (p ? IO.succeedNow(b) : this.take)),
  );

  takeAll: IO<RB & RB1, EB | EB1, Conc<B>> = this.queue.takeAll.chain((bs) => IO.filter(bs, this.f));

  loop(max: number, acc: Conc<B>): IO<RB & RB1, EB | EB1, Conc<B>> {
    return this.queue.takeUpTo(max).chain((bs) => {
      if (bs.isEmpty) {
        return IO.succeedNow(acc);
      }

      return IO.filter(bs, this.f).chain((filtered) => {
        const length = filtered.length;

        if (length === max) {
          return IO.succeedNow(acc.concat(filtered));
        } else {
          return this.loop(max - length, acc.concat(filtered));
        }
      });
    });
  }

  takeUpTo(n: number): IO<RB & RB1, EB | EB1, Conc<B>> {
    return IO.defer(this.loop(n, Conc.empty()));
  }
}

/**
 * @tsplus fluent fncts.control.Queue filterOutputIO
 */
export function filterOutputIO_<RA, RB, EA, EB, A, B, RB1, EB1>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  f: (b: B) => IO<RB1, EB1, boolean>,
): PQueue<RA, RB & RB1, EA, EB | EB1, A, B> {
  concrete(queue);
  return new FilterOutputIO(queue, f);
}

/**
 * @tsplus fluent fncts.control.Queue filterOutput
 */
export function filterOutput_<RA, RB, EA, EB, A, B>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  p: Predicate<B>,
): PQueue<RA, RB, EA, EB, A, B> {
  return queue.filterOutputIO((b) => IO.succeedNow(p(b)));
}
