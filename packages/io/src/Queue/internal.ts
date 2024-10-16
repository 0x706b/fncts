import type { MutableQueue } from "@fncts/io/internal/MutableQueue";
import type { Strategy } from "@fncts/io/Queue/strategy";

import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import { unbounded } from "@fncts/io/internal/MutableQueue";
import { QueueInternal } from "@fncts/io/Queue/definition";

class UnsafeQueue<A> extends QueueInternal<never, never, never, never, A, A> {
  constructor(
    readonly queue: MutableQueue<A>,
    readonly takers: MutableQueue<Future<never, A>>,
    readonly shutdownHook: Future<never, void>,
    readonly shutdownFlag: AtomicBoolean,
    readonly strategy: Strategy<A>,
  ) {
    super();
  }

  awaitShutdown: UIO<void> = this.shutdownHook.await;

  capacity: number = this.queue.capacity;

  isShutdown: UIO<boolean> = IO.succeed(this.shutdownFlag.get);

  get unsafeSize(): Maybe<number> {
    if (this.shutdownFlag.get) {
      return Nothing();
    }
    return Just(this.queue.size - this.takers.size + this.strategy.surplusSize);
  }

  unsafeOffer(a: A): boolean {
    if (this.shutdownFlag.get) {
      return false;
    }
    let noRemaining: boolean;
    if (this.queue.size === 0) {
      const taker = this.takers.dequeue(undefined);

      if (taker != null) {
        unsafeCompletePromise(taker, a);
        noRemaining = true;
      } else {
        noRemaining = false;
      }
    } else {
      noRemaining = false;
    }
    if (noRemaining) {
      return true;
    }
    const succeeded = this.queue.enqueue(a);
    unsafeCompleteTakers(this.strategy, this.queue, this.takers);
    return succeeded;
  }

  offer(a: A, __tsplusTrace?: string): IO<never, never, boolean> {
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      } else {
        const taker = this.takers.dequeue(undefined);

        if (taker != null) {
          unsafeCompletePromise(taker, a);
          return IO.succeedNow(true);
        } else {
          const succeeded = this.queue.enqueue(a);

          if (succeeded) {
            return IO.succeedNow(true);
          } else {
            return this.strategy.handleSurplus(Conc.single(a), this.queue, this.takers, this.shutdownFlag);
          }
        }
      }
    });
  }

  offerAll(as: Iterable<A>, __tsplusTrace?: string): IO<never, never, boolean> {
    const arr = Conc.from(as);
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      } else {
        const pTakers                = this.queue.isEmpty ? unsafeDequeueN(this.takers, arr.length) : Conc.empty<Future<never, A>>();
        const [forTakers, remaining] = arr.splitAt(pTakers.length);
        pTakers.zip(forTakers).forEach(([taker, item]) => {
          unsafeCompletePromise(taker, item);
        });

        if (remaining.length === 0) {
          return IO.succeedNow(true);
        }

        const surplus = unsafeOfferAll(this.queue, remaining);

        unsafeCompleteTakers(this.strategy, this.queue, this.takers);

        if (surplus.length === 0) {
          return IO.succeedNow(true);
        } else {
          return this.strategy.handleSurplus(surplus, this.queue, this.takers, this.shutdownFlag);
        }
      }
    });
  }

  shutdown: UIO<void> = IO.fiberId.flatMap((id) => {
    this.shutdownFlag.set(true);

    return IO.foreachConcurrent(unsafePollAll(this.takers), (fiber) => fiber.interruptAs(id))
      .flatMap(() => this.strategy.shutdown)
      .whenIO(this.shutdownHook.succeed(undefined));
  });

  size: UIO<number> = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    } else {
      return IO.succeedNow(this.queue.size - this.takers.size + this.strategy.surplusSize);
    }
  });

  take: IO<never, never, A> = IO.fiberId.flatMap((fiberId) =>
    IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      }

      const item = this.queue.dequeue(undefined);

      if (item != null) {
        this.strategy.unsafeOnQueueEmptySpace(this.queue, this.takers);
        return IO.succeedNow(item);
      } else {
        const p = Future.unsafeMake<never, A>(fiberId);

        return IO.defer(() => {
          this.takers.enqueue(p);
          unsafeCompleteTakers(this.strategy, this.queue, this.takers);
          if (this.shutdownFlag.get) {
            return IO.interrupt;
          } else {
            return p.await;
          }
        }).onInterrupt(() => IO.succeed(unsafeRemove(this.takers, p)));
      }
    }),
  );

  takeAll: IO<never, never, Conc<A>> = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    } else {
      return IO.succeed(() => {
        const as = unsafePollAll(this.queue);
        this.strategy.unsafeOnQueueEmptySpace(this.queue, this.takers);
        return as;
      });
    }
  });

  takeUpTo(max: number, __tsplusTrace?: string): IO<never, never, Conc<A>> {
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      } else {
        return IO.succeed(() => {
          const as = unsafeDequeueN(this.queue, max);
          this.strategy.unsafeOnQueueEmptySpace(this.queue, this.takers);
          return as;
        });
      }
    });
  }
}

function unsafeCreateQueue<A>(
  queue: MutableQueue<A>,
  takers: MutableQueue<Future<never, A>>,
  shutdownHook: Future<never, void>,
  shutdownFlag: AtomicBoolean,
  strategy: Strategy<A>,
): Queue<A> {
  return new UnsafeQueue(queue, takers, shutdownHook, shutdownFlag, strategy);
}

export function unsafeMakeQueue<A>(strategy: Strategy<A>): (queue: MutableQueue<A>) => IO<never, never, Queue<A>> {
  return (queue) =>
    Future.make<never, void>().map((p) => unsafeCreateQueue(queue, unbounded(), p, new AtomicBoolean(false), strategy));
}

export function unsafeOfferAll<A>(q: MutableQueue<A>, as: Conc<A>): Conc<A> {
  let bs = as;
  while (bs.length > 0) {
    if (!q.enqueue(bs.unsafeGet(0))) {
      return bs;
    } else {
      bs = bs.drop(1);
    }
  }
  return bs;
}

export function unsafePollAll<A>(q: MutableQueue<A>): Conc<A> {
  let as = Conc.empty<A>();
  while (!q.isEmpty) {
    as = as.append(q.dequeue(undefined)!);
  }
  return as;
}

export function unsafeCompletePromise<A>(p: Future<never, A>, a: A) {
  return p.unsafeDone(IO.succeedNow(a));
}

export function unsafeRemove<A>(q: MutableQueue<A>, a: A) {
  return unsafeOfferAll(
    q,
    unsafePollAll(q).filter((b) => a !== b),
  );
}

function unsafeDequeueN<A>(q: MutableQueue<A>, max: number): Conc<A> {
  let j  = 0;
  let as = Conc.empty<A>();
  while (j < max) {
    const p = q.dequeue(undefined);
    if (p != null) {
      as = as.append(p);
    } else {
      return as;
    }
    j += 1;
  }
  return as;
}

export function unsafeCompleteTakers<A>(
  strategy: Strategy<A>,
  queue: MutableQueue<A>,
  takers: MutableQueue<Future<never, A>>,
): void {
  let keepPolling = true;
  while (keepPolling && !queue.isEmpty) {
    const taker = takers.dequeue(undefined);
    if (taker != null) {
      const element = queue.dequeue(undefined);
      if (element != null) {
        unsafeCompletePromise(taker, element);
        strategy.unsafeOnQueueEmptySpace(queue, takers);
      } else {
        unsafeOfferAll(takers, unsafePollAll(takers).prepend(taker));
      }
      keepPolling = true;
    } else {
      keepPolling = false;
    }
  }
}
