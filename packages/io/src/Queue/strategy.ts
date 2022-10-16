import type { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import type { MutableQueue } from "@fncts/io/internal/MutableQueue";

import { unbounded } from "@fncts/io/internal/MutableQueue";
import { unsafeCompletePromise, unsafeCompleteTakers, unsafeOfferAll, unsafePollAll } from "@fncts/io/Queue/internal";

export interface Strategy<A> {
  readonly handleSurplus: (
    as: Conc<A>,
    queue: MutableQueue<A>,
    takers: MutableQueue<Future<never, A>>,
    isShutdown: AtomicBoolean,
    __tsplusTrace?: string,
  ) => UIO<boolean>;

  readonly unsafeOnQueueEmptySpace: (
    queue: MutableQueue<A>,
    takers: MutableQueue<Future<never, A>>,
    __tsplusTrace?: string,
  ) => void;

  readonly surplusSize: number;

  readonly shutdown: UIO<void>;
}

export class BackPressureStrategy<A> implements Strategy<A> {
  private putters = unbounded<[A, Future<never, boolean>, boolean]>();
  handleSurplus(
    as: Conc<A>,
    queue: MutableQueue<A>,
    takers: MutableQueue<Future<never, A>>,
    isShutdown: AtomicBoolean,
    __tsplusTrace?: string,
  ): UIO<boolean> {
    return IO.descriptorWith((d) =>
      IO.defer(() => {
        const p = Future.unsafeMake<never, boolean>(d.id);
        return IO.defer(() => {
          this.unsafeOffer(as, p);
          this.unsafeOnQueueEmptySpace(queue, takers);
          unsafeCompleteTakers(this, queue, takers);
          if (isShutdown.get) {
            return IO.interrupt;
          } else {
            return p.await;
          }
        }).onInterrupt(() => IO.succeed(() => this.unsafeRemove(p)));
      }),
    );
  }

  unsafeRemove(p: Future<never, boolean>, __tsplusTrace?: string) {
    unsafeOfferAll(
      this.putters,
      unsafePollAll(this.putters).filter(([_, __]) => __ !== p),
    );
  }

  unsafeOffer(as: Conc<A>, p: Future<never, boolean>, __tsplusTrace?: string) {
    let bs = as;
    while (bs.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const head = bs.unsafeGet(0);
      bs         = bs.drop(1);
      if (bs.length === 0) {
        this.putters.enqueue([head, p, true]);
      } else {
        this.putters.enqueue([head, p, false]);
      }
    }
  }

  unsafeOnQueueEmptySpace(queue: MutableQueue<A>, takers: MutableQueue<Future<never, A>>, __tsplusTrace?: string) {
    let keepPolling = true;
    while (keepPolling && !queue.isFull) {
      const putter = this.putters.dequeue(undefined);
      if (putter != null) {
        const offered = queue.enqueue(putter[0]);
        if (offered && putter[2]) {
          unsafeCompletePromise(putter[1], true);
        } else if (!offered) {
          unsafeOfferAll(this.putters, unsafePollAll(this.putters).prepend(putter));
        }
        unsafeCompleteTakers(this, queue, takers);
      } else {
        keepPolling = false;
      }
    }
  }

  get shutdown(): UIO<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Do((_) => {
      const fiberId = _(IO.fiberId);
      const putters = _(IO.succeed(unsafePollAll(self.putters)));
      _(IO.foreachConcurrent(putters, ([, p, lastItem]) => (lastItem ? p.interruptAs(fiberId).asUnit : IO.unit)));
    });
  }

  get surplusSize(): number {
    return this.putters.size;
  }
}

export class DroppingStrategy<A> implements Strategy<A> {
  handleSurplus(
    _as: Conc<A>,
    _queue: MutableQueue<A>,
    _takers: MutableQueue<Future<never, A>>,
    _isShutdown: AtomicBoolean,
    __tsplusTrace?: string,
  ): UIO<boolean> {
    return IO.succeedNow(false);
  }

  unsafeOnQueueEmptySpace(_queue: MutableQueue<A>, _takers: MutableQueue<Future<never, A>>, __tsplusTrace?: string) {
    //
  }

  get shutdown(): UIO<void> {
    return IO.unit;
  }

  get surplusSize(): number {
    return 0;
  }
}

export class SlidingStrategy<A> implements Strategy<A> {
  handleSurplus(
    as: Conc<A>,
    queue: MutableQueue<A>,
    takers: MutableQueue<Future<never, A>>,
    _isShutdown: AtomicBoolean,
    __tsplusTrace?: string,
  ): UIO<boolean> {
    return IO.succeed(() => {
      this.unsafeSlidingOffer(queue, as);
      unsafeCompleteTakers(this, queue, takers);
      return true;
    });
  }

  unsafeOnQueueEmptySpace(_queue: MutableQueue<A>, _takers: MutableQueue<Future<never, A>>, __tsplusTrace?: string) {
    //
  }

  get shutdown(): UIO<void> {
    return IO.unit;
  }

  get surplusSize(): number {
    return 0;
  }

  private unsafeSlidingOffer(queue: MutableQueue<A>, as: Conc<A>) {
    let bs = as;
    while (bs.length > 0) {
      if (queue.capacity === 0) {
        return;
      }
      // poll 1 and retry
      queue.dequeue(undefined);
      if (queue.enqueue(bs.unsafeGet(0))) {
        bs = bs.drop(1);
      }
    }
  }
}
