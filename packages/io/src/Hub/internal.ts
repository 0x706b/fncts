import type { Maybe } from "@fncts/base/data/Maybe";
import type { Hub as HubInternal } from "@fncts/io/internal/Hub";

import { HashSet } from "@fncts/base/collection/mutable/HashSet";
import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import { PHubInternal } from "@fncts/io/Hub/definition";
import { HashedPair } from "@fncts/io/internal/HashedPair";
import { MutableQueue } from "@fncts/io/internal/MutableQueue";
import { QueueInternal } from "@fncts/io/Queue";

/**
 * A `Strategy<A>` describes the protocol for how publishers and subscribers
 * will communicate with each other through the hub.
 */
export abstract class Strategy<A> {
  /**
   * Describes how publishers should signal to subscribers that they are
   * waiting for space to become available in the hub.
   */
  abstract handleSurplus(
    hub: HubInternal<A>,
    subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
    as: Iterable<A>,
    isShutdown: AtomicBoolean,
  ): UIO<boolean>;

  /**
   * Describes any finalization logic associated with this strategy.
   */
  abstract shutdown: UIO<void>;

  /**
   * Describes how subscribers should signal to publishers waiting for space
   * to become available in the hub that space may be available.
   */
  abstract unsafeOnHubEmptySpace(
    hub: HubInternal<A>,
    subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
  ): void;

  /**
   * Describes how subscribers waiting for additional values from the hub
   * should take those values and signal to publishers that they are no
   * longer waiting for additional values.
   */
  unsafeCompletePollers(
    hub: HubInternal<A>,
    subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
    subscription: HubInternal.Subscription<A>,
    pollers: MutableQueue<Future<never, A>>,
  ): void {
    let keepPolling  = true;
    const nullPoller = null as unknown as Future<never, A>;
    const empty      = null as unknown as A;

    while (keepPolling && !subscription.isEmpty()) {
      const poller = pollers.dequeue(nullPoller)!;

      if (poller === nullPoller) {
        const subPollerPair = new HashedPair(subscription, pollers);

        subscribers.remove(subPollerPair);

        if (!pollers.isEmpty) {
          subscribers.add(subPollerPair);
        }
        keepPolling = false;
      } else {
        const pollResult = subscription.poll(empty);

        if (pollResult == null) {
          pollers.enqueueAll(pollers.unsafeDequeueAll.prepend(poller));
        } else {
          poller.unsafeSucceed(pollResult);
          this.unsafeOnHubEmptySpace(hub, subscribers);
        }
      }
    }
  }

  /**
   * Describes how publishers should signal to subscribers waiting for
   * additional values from the hub that new values are available.
   */
  unsafeCompleteSubscribers(
    hub: HubInternal<A>,
    subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
  ): void {
    subscribers.forEach(({ first: subscription, second: pollers }) => {
      this.unsafeCompletePollers(hub, subscribers, subscription, pollers);
    });
  }
}

/**
 * A strategy that applies back pressure to publishers when the hub is at
 * capacity. This guarantees that all subscribers will receive all messages
 * published to the hub while they are subscribed. However, it creates the
 * risk that a slow subscriber will slow down the rate at which messages
 * are published and received by other subscribers.
 */
export class BackPressure<A> extends Strategy<A> {
  publishers: MutableQueue<readonly [A, Future<never, boolean>, boolean]> = MutableQueue.unbounded();

  handleSurplus(
    hub: HubInternal<A>,
    subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
    as: Iterable<A>,
    isShutdown: AtomicBoolean,
  ): UIO<boolean> {
    return IO.fiberId.flatMap((fiberId) =>
      IO.defer(() => {
        const future = Future.unsafeMake<never, boolean>(fiberId);

        return IO.defer(() => {
          this.unsafeOffer(as, future);
          this.unsafeOnHubEmptySpace(hub, subscribers);
          this.unsafeCompleteSubscribers(hub, subscribers);

          return isShutdown.get ? IO.interrupt : future.await;
        }).onInterrupt(() => IO.succeed(this.unsafeRemove(future)));
      }),
    );
  }

  get shutdown(): UIO<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Do((_) => {
      const fiberId    = _(IO.fiberId);
      const publishers = _(IO.succeed(self.publishers.unsafeDequeueAll));
      _(publishers.traverseIOConcurrentDiscard(([_, future, last]) => (last ? future.interruptAs(fiberId) : IO.unit)));
    });
  }

  unsafeOnHubEmptySpace(
    hub: HubInternal<A>,
    subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
  ): void {
    const empty     = null as unknown as readonly [A, Future<never, boolean>, boolean];
    let keepPolling = true;

    while (keepPolling && !hub.isFull()) {
      const publisher = this.publishers.dequeue(empty)!;

      if (publisher === null) {
        keepPolling = false;
      } else {
        const published = hub.publish(publisher[0]);

        if (published && publisher[2]) {
          publisher[1].unsafeSucceed(true);
        } else if (!published) {
          this.publishers.enqueueAll(this.publishers.unsafeDequeueAll.prepend(publisher));
        }
        this.unsafeCompleteSubscribers(hub, subscribers);
      }
    }
  }

  private unsafeOffer(as: Iterable<A>, future: Future<never, boolean>): void {
    const it = as[Symbol.iterator]();
    let curr = it.next();

    if (!curr.done) {
      let next;
      while ((next = it.next()) && !next.done) {
        this.publishers.enqueue([curr.value, future, false] as const);
        curr = next;
      }
      this.publishers.enqueue([curr.value, future, true] as const);
    }
  }

  private unsafeRemove(future: Future<never, boolean>): void {
    this.publishers.enqueueAll(this.publishers.unsafeDequeueAll.filter(([_, a]) => a !== future));
  }
}

/**
 * A strategy that drops new messages when the hub is at capacity. This
 * guarantees that a slow subscriber will not slow down the rate at which
 * messages are published. However, it creates the risk that a slow
 * subscriber will slow down the rate at which messages are received by
 * other subscribers and that subscribers may not receive all messages
 * published to the hub while they are subscribed.
 */
export class Dropping<A> extends Strategy<A> {
  handleSurplus(
    _hub: HubInternal<A>,
    _subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
    _as: Iterable<A>,
    _isShutdown: AtomicBoolean,
  ): UIO<boolean> {
    return IO.succeedNow(false);
  }

  shutdown: UIO<void> = IO.unit;

  unsafeOnHubEmptySpace(
    _hub: HubInternal<A>,
    _subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
  ): void {
    //
  }
}

/**
 * A strategy that adds new messages and drops old messages when the hub is
 * at capacity. This guarantees that a slow subscriber will not slow down
 * the rate at which messages are published and received by other
 * subscribers. However, it creates the risk that a slow subscriber will
 * not receive some messages published to the hub while it is subscribed.
 */
export class Sliding<A> extends Strategy<A> {
  private unsafeSlidingPublish(hub: HubInternal<A>, as: Iterable<A>): void {
    const it = as[Symbol.iterator]();
    let next = it.next();

    if (!next.done && hub.capacity > 0) {
      let a    = next.value;
      let loop = true;
      while (loop) {
        hub.slide();
        const pub = hub.publish(a);
        if (pub && (next = it.next()) && !next.done) {
          a = next.value;
        } else if (pub) {
          loop = false;
        }
      }
    }
  }

  handleSurplus(
    hub: HubInternal<A>,
    subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
    as: Iterable<A>,
    _isShutdown: AtomicBoolean,
  ): UIO<boolean> {
    return IO.succeed(() => {
      this.unsafeSlidingPublish(hub, as);
      this.unsafeCompleteSubscribers(hub, subscribers);
      return true;
    });
  }

  shutdown: UIO<void> = IO.unit;

  unsafeOnHubEmptySpace(
    _hub: HubInternal<A>,
    _subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
  ): void {
    //
  }
}

class UnsafeSubscription<A> extends QueueInternal<never, never, never, never, A, A> {
  constructor(
    readonly hub: HubInternal<A>,
    readonly subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
    readonly subscription: HubInternal.Subscription<A>,
    readonly pollers: MutableQueue<Future<never, A>>,
    readonly shutdownHook: Future<never, void>,
    readonly shutdownFlag: AtomicBoolean,
    readonly strategy: Strategy<A>,
  ) {
    super();
  }

  awaitShutdown: UIO<void> = this.shutdownHook.await;

  capacity: number = this.hub.capacity;

  isShutdown: UIO<boolean> = IO.succeed(() => this.shutdownFlag.get);

  shutdown: UIO<void> = IO.fiberId.flatMap((fiberId) =>
    IO.defer(() => {
      this.shutdownFlag.set(true);
      return IO.foreachConcurrent(this.pollers.unsafeDequeueAll, (fiber) => fiber.interruptAs(fiberId))
        .zipRight(IO.succeed(this.subscription.unsubscribe()))
        .whenIO(this.shutdownHook.succeed(undefined));
    }),
  );

  get unsafeSize(): Maybe<number> {
    if (this.shutdownFlag.get) {
      return Nothing();
    }
    return Just(this.subscription.size());
  }

  size: UIO<number> = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    }

    return IO.succeed(this.subscription.size());
  });

  unsafeOffer(_: never): boolean {
    return false;
  }

  offer = (_: never): IO<never, never, boolean> => IO.succeedNow(false);

  offerAll = (_: Iterable<never>): IO<never, never, boolean> => IO.succeedNow(false);

  take: IO<never, never, A> = IO.fiberId.flatMap((fiberId) =>
    IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      }

      const empty   = null as unknown as A;
      const message = this.pollers.isEmpty ? this.subscription.poll(empty) : empty;

      if (message == null) {
        const future = Future.unsafeMake<never, A>(fiberId);

        return IO.defer(() => {
          this.pollers.enqueue(future);
          this.subscribers.add(new HashedPair(this.subscription, this.pollers));
          this.strategy.unsafeCompletePollers(this.hub, this.subscribers, this.subscription, this.pollers);
          if (this.shutdownFlag.get) {
            return IO.interrupt;
          } else {
            return future.await;
          }
        }).onInterrupt(() =>
          IO.succeed(() => {
            this.pollers.unsafeRemove(future);
          }),
        );
      } else {
        this.strategy.unsafeOnHubEmptySpace(this.hub, this.subscribers);
        return IO.succeedNow(message);
      }
    }),
  );

  takeAll: IO<never, never, Conc<A>> = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    }

    const as = this.pollers.isEmpty ? this.subscription.unsafePollAll : Conc.empty<A>();

    this.strategy.unsafeOnHubEmptySpace(this.hub, this.subscribers);

    return IO.succeedNow(as);
  });

  takeUpTo = (n: number): IO<never, never, Conc<A>> => {
    return IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      }

      const as = this.pollers.isEmpty ? this.subscription.unsafePollN(n) : Conc.empty<A>();

      this.strategy.unsafeOnHubEmptySpace(this.hub, this.subscribers);
      return IO.succeedNow(as);
    });
  };
}

/**
 * Creates a subscription with the specified strategy.
 */
export function makeSubscription<A>(
  hub: HubInternal<A>,
  subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
  strategy: Strategy<A>,
): UIO<Queue.Dequeue<A>> {
  return Future.make<never, void>().map((future) => {
    return unsafeMakeSubscription(
      hub,
      subscribers,
      hub.subscribe(),
      MutableQueue.unbounded<Future<never, A>>(),
      future,
      new AtomicBoolean(false),
      strategy,
    );
  });
}

/**
 * Unsafely creates a subscription with the specified strategy.
 */
export function unsafeMakeSubscription<A>(
  hub: HubInternal<A>,
  subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
  subscription: HubInternal.Subscription<A>,
  pollers: MutableQueue<Future<never, A>>,
  shutdownHook: Future<never, void>,
  shutdownFlag: AtomicBoolean,
  strategy: Strategy<A>,
): Queue.Dequeue<A> {
  return new UnsafeSubscription(hub, subscribers, subscription, pollers, shutdownHook, shutdownFlag, strategy);
}

export function subscribersHashSet<A>(): HashSet<
  HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>
> {
  return HashSet.empty<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>();
}

class UnsafeHub<A> extends PHubInternal<never, never, never, never, A, A> {
  constructor(
    readonly hub: HubInternal<A>,
    readonly subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
    readonly scope: Scope.Closeable,
    readonly shutdownHook: Future<never, void>,
    readonly shutdownFlag: AtomicBoolean,
    readonly strategy: Strategy<A>,
  ) {
    super();
  }

  awaitShutdown = this.shutdownHook.await;

  capacity = this.hub.capacity;

  isShutdown = IO.succeed(this.shutdownFlag.get);

  shutdown = IO.fiberId.flatMap((fiberId) =>
    IO.defer(() => {
      this.shutdownFlag.set(true);
      return this.scope
        .close(Exit.interrupt(fiberId))
        .zipRight(this.strategy.shutdown)
        .whenIO(this.shutdownHook.succeed(undefined));
    }),
  ).uninterruptible;

  get unsafeSize(): Maybe<number> {
    if (this.shutdownFlag.get) {
      return Nothing();
    }
    return Just(this.hub.size());
  }

  size = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    }

    return IO.succeed(this.hub.size());
  });

  subscribe: IO<Scope, never, Queue.Dequeue<A>> = IO.acquireRelease(
    makeSubscription(this.hub, this.subscribers, this.strategy).tap((dequeue) =>
      this.scope.addFinalizer(dequeue.shutdown),
    ),
    (dequeue) => dequeue.shutdown,
  );

  publish = (a: A): IO<never, never, boolean> =>
    IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      }

      if (this.hub.publish(a)) {
        this.strategy.unsafeCompleteSubscribers(this.hub, this.subscribers);
        return IO.succeedNow(true);
      }

      return this.strategy.handleSurplus(this.hub, this.subscribers, Conc.single(a), this.shutdownFlag);
    });

  publishAll = (as: Iterable<A>): IO<never, never, boolean> =>
    IO.defer(() => {
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

/**
 * Unsafely creates a hub with the specified strategy.
 */
export function unsafeMakeHub<A>(
  hub: HubInternal<A>,
  subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
  scope: Scope.Closeable,
  shutdownHook: Future<never, void>,
  shutdownFlag: AtomicBoolean,
  strategy: Strategy<A>,
): Hub<A> {
  return new UnsafeHub(hub, subscribers, scope, shutdownHook, shutdownFlag, strategy).unsafeCoerce();
}

export function makeHubInternal<A>(hub: HubInternal<A>, strategy: Strategy<A>): UIO<Hub<A>> {
  return Do((_) => {
    const scope  = _(Scope.make);
    const future = _(Future.make<never, void>());
    return unsafeMakeHub(hub, subscribersHashSet(), scope, future, new AtomicBoolean(false), strategy);
  });
}
