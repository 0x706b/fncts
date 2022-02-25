import type { Conc } from "../../../collection/immutable/Conc";
import type { UIO } from "../../IO";
import type { PQueue } from "../definition";

import { Just, Nothing } from "../../../data/Maybe";
import { IO } from "../../IO";
import { concrete, QueueInternal } from "../definition";

export class FilterInputIO<RA, RB, EA, EB, B, A, A1 extends A, R2, E2> extends QueueInternal<RA & R2, RB, EA | E2, EB, A1, B> {
  constructor(readonly queue: QueueInternal<RA, RB, EA, EB, A, B>, readonly f: (_: A1) => IO<R2, E2, boolean>) {
    super();
  }

  awaitShutdown: UIO<void> = this.queue.awaitShutdown;

  capacity: number = this.queue.capacity;

  isShutdown: UIO<boolean> = this.queue.isShutdown;

  offer(a: A1): IO<RA & R2, EA | E2, boolean> {
    return this.f(a).chain((b) => (b ? this.queue.offer(a) : IO.succeedNow(false)));
  }

  offerAll(as: Iterable<A1>): IO<RA & R2, EA | E2, boolean> {
    return IO.foreach(as, (a) => this.f(a).map((b) => (b ? Just(a) : Nothing()))).chain((ms) => {
      const filtered = ms.compact;
      if (filtered.isEmpty) {
        return IO.succeedNow(false);
      } else {
        return this.queue.offerAll(filtered);
      }
    });
  }

  shutdown: UIO<void> = this.queue.shutdown;

  size: UIO<number> = this.queue.size;

  take: IO<RB, EB, B> = this.queue.take;

  takeAll: IO<RB, EB, Conc<B>> = this.queue.takeAll;

  takeUpTo(max: number): IO<RB, EB, Conc<B>> {
    return this.queue.takeUpTo(max);
  }
}

/**
 * Like `filterInput`, but uses an effectful function to filter the elements.
 *
 * @tsplus fluent fncts.control.Queue filterInputIO
 */
export function filterInputIO_<RA, RB, EA, EB, B, A, A1 extends A, R2, E2>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  f: (_: A1) => IO<R2, E2, boolean>,
): PQueue<RA & R2, RB, EA | E2, EB, A1, B> {
  concrete(queue);
  return new FilterInputIO(queue, f);
}

/**
 * Applies a filter to elements enqueued into this queue. Elements that do not
 * pass the filter will be immediately dropped.
 *
 * @tsplus fluent fncts.control.Queue filterInput
 */
export function filterInput_<RA, RB, EA, EB, B, A, A1 extends A>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  f: (_: A1) => boolean,
): PQueue<RA, RB, EA, EB, A1, B> {
  return queue.filterInputIO((a) => IO.succeedNow(f(a)));
}

// codegen:start { preset: pipeable }
/**
 * Like `filterInput`, but uses an effectful function to filter the elements.
 * @tsplus dataFirst filterInputIO_
 */
export function filterInputIO<A, A1 extends A, R2, E2>(f: (_: A1) => IO<R2, E2, boolean>) {
  return <RA, RB, EA, EB, B>(queue: PQueue<RA, RB, EA, EB, A, B>): PQueue<RA & R2, RB, EA | E2, EB, A1, B> => filterInputIO_(queue, f);
}
/**
 * Applies a filter to elements enqueued into this queue. Elements that do not
 * pass the filter will be immediately dropped.
 * @tsplus dataFirst filterInput_
 */
export function filterInput<A, A1 extends A>(f: (_: A1) => boolean) {
  return <RA, RB, EA, EB, B>(queue: PQueue<RA, RB, EA, EB, A, B>): PQueue<RA, RB, EA, EB, A1, B> => filterInput_(queue, f);
}
// codegen:end
