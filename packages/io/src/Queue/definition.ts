import type { MutableQueue } from "../internal/MutableQueue.js";
import type { UIO } from "../IO.js";
import type { Strategy } from "./strategy.js";
import type { Maybe } from "@fncts/base/data/Maybe";
import type { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";

import { Conc } from "@fncts/base/collection/immutable/Conc";

import {
  unsafeCompletePromise,
  unsafeCompleteTakers,
  unsafeOfferAll,
  unsafePollAll,
  unsafePollN,
  unsafeRemove,
} from "./internal.js";

export const QueueTypeId = Symbol.for("fncts.io.Queue");
export type QueueTypeId = typeof QueueTypeId;

export interface CommonQueue {
  readonly [QueueTypeId]: QueueTypeId;
  /**
   * How many elements can hold in the queue
   */
  get capacity(): number;
  /**
   * Retrieves the size of the queue, which is equal to the number of elements
   * in the queue. This may be negative if fibers are suspended waiting for
   * elements to be added to the queue.
   */
  readonly size: UIO<number>;
  /**
   * Waits until the queue is shutdown.
   * The `IO` returned by this method will not resume until the queue has been shutdown.
   * If the queue is already shutdown, the `IO` will resume right away.
   */
  readonly awaitShutdown: UIO<void>;
  /**
   * `true` if `shutdown` has been called.
   */
  readonly isShutdown: UIO<boolean>;
  /**
   * Interrupts any fibers that are suspended on `offer` or `take`.
   * Future calls to `offer*` and `take*` will be interrupted immediately.
   */
  readonly shutdown: UIO<void>;
  /**
   * Checks whether the queue is currently full.
   */
  readonly isFull: UIO<boolean>;
  /**
   * Checks whether the queue is currently empty.
   */
  readonly isEmpty: UIO<boolean>;
}

export interface Enqueue<in A> extends CommonQueue {
  readonly _In: (_: A) => void;
  /**
   * Places one value in the queue.
   */
  offer(this: this, a: A, __tsplusTrace?: string): UIO<boolean>;
  /**
   * For Bounded Queue: uses the `BackPressure` Strategy, places the values in the queue and always returns true.
   * If the queue has reached capacity, then
   * the fiber performing the `offerAll` will be suspended until there is room in
   * the queue.
   *
   * For Unbounded Queue:
   * Places all values in the queue and returns true.
   *
   * For Sliding Queue: uses `Sliding` Strategy
   * If there is room in the queue, it places the values otherwise it removes the old elements and
   * enqueues the new ones. Always returns true.
   *
   * For Dropping Queue: uses `Dropping` Strategy,
   * It places the values in the queue but if there is no room it will not enqueue them and return false.
   *
   */
  offerAll(this: this, as: Iterable<A>, __tsplusTrace?: string): UIO<boolean>;
}

export interface Dequeue<out A> extends CommonQueue {
  readonly _Out: (_: never) => A;
  /**
   * Removes the oldest value in the queue. If the queue is empty, this will
   * return a computation that resumes when an item has been added to the queue.
   */
  readonly take: UIO<A>;
  /**
   * Removes all the values in the queue and returns the list of the values. If the queue
   * is empty returns empty list.
   */
  readonly takeAll: UIO<Conc<A>>;
  /**
   * Takes up to max number of values in the queue.
   */
  takeUpTo(this: this, max: number, __tsplusTrace?: string): UIO<Conc<A>>;
  /**
   * Takes the specified number of elements from the queue. If there are fewer
   * than the specified number of elements available, it suspends until they
   * become available.
   */
  takeN(this: this, n: number, __tsplusTrace?: string): UIO<Conc<A>>;
  /**
   * Takes a number of elements from the queue between the specified minimum and
   * maximum. If there are fewer than the minimum number of elements available,
   * suspends until at least the minimum number of elements have been collected.
   */
  takeBetween(this: this, min: number, max: number, __tsplusTrace?: string): UIO<Conc<A>>;
  /**
   * Take the head option of values in the queue.
   */
  readonly poll: UIO<Maybe<A>>;
}

/**
 * A `Queue` is a lightweight, asynchronous queue into which values can be
 * enqueued and of which elements can be dequeued.
 *
 * @tsplus type fncts.io.Queue
 * @tsplus companion fncts.io.QueueOps
 */
export class Queue<A> implements Enqueue<A>, Dequeue<A> {
  readonly [QueueTypeId]: typeof QueueTypeId = QueueTypeId;
  declare _In: (_: A) => void;
  declare _Out: (_: never) => A;
  constructor(
    readonly queue: MutableQueue<A>,
    readonly takers: MutableQueue<Future<never, A>>,
    readonly shutdownHook: Future<never, void>,
    readonly shutdownFlag: AtomicBoolean,
    readonly strategy: Strategy<A>,
  ) {}

  offer(this: this, a: A, __tsplusTrace?: string): UIO<boolean> {
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

  offerAll(this: this, as: Iterable<A>, __tsplusTrace?: string): UIO<boolean> {
    const arr = Conc.from(as);
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      } else {
        const pTakers                = this.queue.isEmpty ? unsafePollN(this.takers, arr.length) : Conc.empty<Future<never, A>>();
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

  get capacity(): number {
    return this.queue.capacity;
  }

  size: UIO<number> = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    } else {
      return IO.succeedNow(this.queue.size - this.takers.size + this.strategy.surplusSize);
    }
  });

  awaitShutdown = this.shutdownHook.await;

  isShutdown: UIO<boolean> = IO(this.shutdownFlag.get);

  shutdown: UIO<void> = IO.deferWith((_, id) => {
    this.shutdownFlag.set(true);

    return IO.foreachDiscardC(unsafePollAll(this.takers), (fiber) => fiber.interruptAs(id))
      .flatMap(() => this.strategy.shutdown)
      .whenIO(this.shutdownHook.succeed(undefined));
  }).uninterruptible;

  isFull: UIO<boolean> = this.size.map((size) => size === this.capacity);

  isEmpty: UIO<boolean> = this.size.map((size) => size === 0);

  take: UIO<A> = IO.deferWith((_, fiberId) => {
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
  });

  takeAll: UIO<Conc<A>> = IO.defer(() => {
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

  takeUpTo(this: this, max: number, __tsplusTrace?: string): UIO<Conc<A>> {
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      } else {
        return IO.succeed(() => {
          const as = unsafePollN(this.queue, max);
          this.strategy.unsafeOnQueueEmptySpace(this.queue, this.takers);
          return as;
        });
      }
    });
  }

  private takeRemainder(min: number, max: number, acc: Conc<A>, __tsplusTrace?: string): UIO<Conc<A>> {
    if (max < min) return IO.succeedNow(acc);
    else {
      return this.takeUpTo(max).flatMap((bs) => {
        const remaining = min - bs.length;
        if (remaining === 1) {
          return this.take.map((b) => acc.concat(bs).append(b));
        } else if (remaining > 1) {
          return this.take.flatMap((b) => this.takeRemainder(remaining - 1, max - bs.length, acc.concat(bs).append(b)));
        } else {
          return IO.succeedNow(acc.concat(bs));
        }
      });
    }
  }

  takeBetween(this: this, min: number, max: number, __tsplusTrace?: string): UIO<Conc<A>> {
    return this.takeRemainder(min, max, Conc());
  }

  takeN(this: this, n: number, __tsplusTrace?: string): UIO<Conc<A>> {
    return this.takeBetween(n, n);
  }

  poll: UIO<Maybe<A>> = this.takeUpTo(1).map((_) => _.head);
}
