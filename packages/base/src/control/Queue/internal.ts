import type { Queue } from "@fncts/base/control/Queue/definition";
import type { Strategy } from "@fncts/base/control/Queue/strategy";
import type { MutableQueue } from "@fncts/base/internal/MutableQueue";

import { QueueInternal } from "@fncts/base/control/Queue/definition";
import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import { unbounded } from "@fncts/base/internal/MutableQueue";

class UnsafeQueue<A> extends QueueInternal<unknown, unknown, never, never, A, A> {
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

  offer(a: A): IO<unknown, never, boolean> {
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      } else {
        const taker = this.takers.dequeue(undefined);

        if (taker != null) {
          _unsafeCompletePromise(taker, a);
          return IO.succeedNow(true);
        } else {
          const succeeded = this.queue.enqueue(a);

          if (succeeded) {
            return IO.succeedNow(true);
          } else {
            return this.strategy.handleSurplus(
              Conc.single(a),
              this.queue,
              this.takers,
              this.shutdownFlag,
            );
          }
        }
      }
    });
  }

  offerAll(as: Iterable<A>): IO<unknown, never, boolean> {
    const arr = Conc.from(as);
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      } else {
        const pTakers = this.queue.isEmpty
          ? _unsafePollN(this.takers, arr.length)
          : Conc.empty<Future<never, A>>();
        const [forTakers, remaining] = arr.splitAt(pTakers.length);
        pTakers.zip(forTakers).forEach(([taker, item]) => {
          _unsafeCompletePromise(taker, item);
        });

        if (remaining.length === 0) {
          return IO.succeedNow(true);
        }

        const surplus = _unsafeOfferAll(this.queue, remaining);

        _unsafeCompleteTakers(this.strategy, this.queue, this.takers);

        if (surplus.length === 0) {
          return IO.succeedNow(true);
        } else {
          return this.strategy.handleSurplus(surplus, this.queue, this.takers, this.shutdownFlag);
        }
      }
    });
  }

  shutdown: UIO<void> = IO.deferWith((_, id) => {
    this.shutdownFlag.set(true);

    return IO.foreachC(_unsafePollAll(this.takers), (fiber) => fiber.interruptAs(id))
      .chain(() => this.strategy.shutdown)
      .whenIO(this.shutdownHook.succeed(undefined));
  });

  size: UIO<number> = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    } else {
      return IO.succeedNow(this.queue.size - this.takers.size + this.strategy.surplusSize);
    }
  });

  take: IO<unknown, never, A> = IO.deferWith((_, fiberId) =>
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
          _unsafeCompleteTakers(this.strategy, this.queue, this.takers);
          if (this.shutdownFlag.get) {
            return IO.interrupt;
          } else {
            return p.await;
          }
        }).onInterrupt(() => IO.succeed(_unsafeRemove(this.takers, p)));
      }
    }),
  );

  takeAll: IO<unknown, never, Conc<A>> = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    } else {
      return IO.succeed(() => {
        const as = _unsafePollAll(this.queue);
        this.strategy.unsafeOnQueueEmptySpace(this.queue, this.takers);
        return as;
      });
    }
  });

  takeUpTo(max: number): IO<unknown, never, Conc<A>> {
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      } else {
        return IO.succeed(() => {
          const as = _unsafePollN(this.queue, max);
          this.strategy.unsafeOnQueueEmptySpace(this.queue, this.takers);
          return as;
        });
      }
    });
  }
}

function _unsafeQueue<A>(
  queue: MutableQueue<A>,
  takers: MutableQueue<Future<never, A>>,
  shutdownHook: Future<never, void>,
  shutdownFlag: AtomicBoolean,
  strategy: Strategy<A>,
): Queue<A> {
  return new UnsafeQueue(queue, takers, shutdownHook, shutdownFlag, strategy);
}

export function _makeQueue<A>(
  strategy: Strategy<A>,
): (queue: MutableQueue<A>) => IO<unknown, never, Queue<A>> {
  return (queue) =>
    Future.make<never, void>().map((p) =>
      _unsafeQueue(queue, unbounded(), p, new AtomicBoolean(false), strategy),
    );
}

export function _unsafeOfferAll<A>(q: MutableQueue<A>, as: Conc<A>): Conc<A> {
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

export function _unsafePollAll<A>(q: MutableQueue<A>): Conc<A> {
  let as = Conc.empty<A>();

  while (!q.isEmpty) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    as = as.append(q.dequeue(undefined)!);
  }

  return as;
}

export function _unsafeCompletePromise<A>(p: Future<never, A>, a: A) {
  return p.unsafeDone(IO.succeedNow(a));
}

export function _unsafeRemove<A>(q: MutableQueue<A>, a: A) {
  return _unsafeOfferAll(q, _unsafePollAll(q)).filter((b) => a !== b);
}

function _unsafePollN<A>(q: MutableQueue<A>, max: number): Conc<A> {
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

export function _unsafeCompleteTakers<A>(
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
        _unsafeCompletePromise(taker, element);
        strategy.unsafeOnQueueEmptySpace(queue, takers);
      } else {
        _unsafeOfferAll(takers, _unsafePollAll(takers).prepend(taker));
      }

      keepPolling = true;
    } else {
      keepPolling = false;
    }
  }
}
