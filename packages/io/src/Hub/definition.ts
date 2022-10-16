import type { HashedPair } from "../internal/HashedPair.js";
import type { MutableQueue } from "../internal/MutableQueue.js";
import type { UIO } from "../IO.js";
import type { Dequeue, Enqueue } from "../Queue/definition.js";
import type { Strategy } from "./internal.js";
import type { HashSet } from "@fncts/base/collection/mutable/HashSet";
import type { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import type { Hub as HubInternal } from "@fncts/io/internal/Hub";

import { QueueTypeId } from "../Queue/definition.js";
import { makeSubscription } from "./internal.js";

export const HubTypeId = Symbol.for("fncts.io.Hub");
export type HubTypeId = typeof HubTypeId;

/**
 * @tsplus type fncts.io.Hub
 * @tsplus companion fncts.io.HubOps
 */
export class Hub<A> implements Enqueue<A> {
  readonly [QueueTypeId]: QueueTypeId = QueueTypeId;
  readonly [HubTypeId]: HubTypeId     = HubTypeId;
  declare _In: (_: A) => void;
  constructor(
    readonly hub: HubInternal<A>,
    readonly subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
    readonly scope: Scope.Closeable,
    readonly shutdownHook: Future<never, void>,
    readonly shutdownFlag: AtomicBoolean,
    readonly strategy: Strategy<A>,
  ) {}

  awaitShutdown: UIO<void> = this.shutdownHook.await;

  get capacity(): number {
    return this.hub.capacity;
  }

  isShutdown: UIO<boolean> = IO(this.shutdownFlag.get);

  publish(this: this, a: A, __tsplusTrace?: string): UIO<boolean> {
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      }

      if (this.hub.publish(a)) {
        this.strategy.unsafeCompleteSubscribers(this.hub, this.subscribers);
        return IO.succeedNow(true);
      }

      return this.strategy.handleSurplus(this.hub, this.subscribers, Conc.single(a), this.shutdownFlag);
    });
  }

  publishAll(this: this, as: Iterable<A>, __tsplusTrace?: string): UIO<boolean> {
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      }

      const surplus = this.hub.publishAll(as);

      this.strategy.unsafeCompleteSubscribers(this.hub, this.subscribers);

      if (surplus.isEmpty) {
        return IO.succeedNow(true);
      }

      return this.strategy.handleSurplus(this.hub, this.subscribers, surplus, this.shutdownFlag);
    });
  }

  shutdown: UIO<void> = IO.deferWith((_, fiberId) => {
    this.shutdownFlag.set(true);
    return this.scope
      .close(Exit.interrupt(fiberId))
      .zipRight(this.strategy.shutdown)
      .whenIO(this.shutdownHook.succeed(undefined));
  }).uninterruptible;

  size: UIO<number> = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    }

    return IO.succeed(this.hub.size());
  });

  subscribe: IO<Scope, never, Dequeue<A>> = IO.acquireRelease(
    makeSubscription(this.hub, this.subscribers, this.strategy).tap((dequeue) =>
      this.scope.addFinalizer(dequeue.shutdown),
    ),
    (dequeue) => dequeue.shutdown,
  );

  isEmpty: UIO<boolean> = this.size.map((size) => size === 0);

  isFull: UIO<boolean> = this.size.map((size) => size === this.capacity);

  offer(this: this, a: A, __tsplusTrace?: string | undefined): UIO<boolean> {
    return this.publish(a);
  }

  offerAll(this: this, as: Iterable<A>, __tsplusTrace?: string | undefined): UIO<boolean> {
    return this.publishAll(as);
  }
}
