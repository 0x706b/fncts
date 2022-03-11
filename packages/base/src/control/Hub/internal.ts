import type { Hub as HubInternal } from "../../internal/Hub";
import type { UIO } from "../IO";
import type { UManaged } from "../Managed";
import type { Queue } from "../Queue";
import type { Hub } from "./definition";

import { Conc } from "../../collection/immutable/Conc";
import { HashSet } from "../../collection/mutable/HashSet";
import { ExecutionStrategy } from "../../data/ExecutionStrategy";
import { Exit } from "../../data/Exit";
import { AtomicBoolean } from "../../internal/AtomicBoolean";
import { HashedPair } from "../../internal/HashedPair";
import { MutableQueue } from "../../internal/MutableQueue";
import { Future } from "../Future";
import { IO } from "../IO";
import { Managed } from "../Managed";
import { Finalizer } from "../Managed/Finalizer";
import { ReleaseMap } from "../Managed/ReleaseMap";
import { QueueInternal } from "../Queue";
import { PHubInternal } from "./definition";

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

        if (pollResult === null) {
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
  publishers: MutableQueue<readonly [A, Future<never, boolean>, boolean]> =
    MutableQueue.unbounded();

  handleSurplus(
    hub: HubInternal<A>,
    subscribers: HashSet<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>,
    as: Iterable<A>,
    isShutdown: AtomicBoolean,
  ): UIO<boolean> {
    return pipe(
      IO.fiberId.chain((fiberId) =>
        IO.defer(() => {
          const future = Future.unsafeMake<never, boolean>(fiberId);

          return pipe(
            IO.defer(() => {
              this.unsafeOffer(as, future);
              this.unsafeOnHubEmptySpace(hub, subscribers);
              this.unsafeCompleteSubscribers(hub, subscribers);

              return isShutdown.get ? IO.interrupt : future.await;
            }).onInterrupt(() => IO.succeed(this.unsafeRemove(future))),
          );
        }),
      ),
    );
  }

  get shutdown(): UIO<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return IO.gen(function* (_) {
      const fiberId    = yield* _(IO.fiberId);
      const publishers = yield* _(IO.succeed(self.publishers.unsafeDequeueAll));
      yield* _(
        IO.foreachC(publishers, ([_, future, last]) =>
          last ? future.interruptAs(fiberId) : IO.unit,
        ),
      );
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

class UnsafeSubscription<A> extends QueueInternal<never, unknown, unknown, never, never, A> {
  constructor(
    readonly hub: HubInternal<A>,
    readonly subscribers: HashSet<
      HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>
    >,
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

  shutdown: UIO<void> = IO.fiberId.chain((fiberId) =>
    IO.defer(() => {
      this.shutdownFlag.set(true);
      return IO.foreachC(this.pollers.unsafeDequeueAll, (fiber) => fiber.interruptAs(fiberId))
        .apSecond(IO.succeed(this.subscription.unsubscribe()))
        .whenIO(this.shutdownHook.succeed(undefined));
    }),
  );

  size: UIO<number> = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    }

    return IO.succeed(this.subscription.size());
  });

  offer = (_: never): IO<never, unknown, boolean> => IO.succeedNow(false);

  offerAll = (_: Iterable<never>): IO<never, unknown, boolean> => IO.succeedNow(false);

  take: IO<unknown, never, A> = pipe(
    IO.fiberId.chain((fiberId) =>
      IO.defer(() => {
        if (this.shutdownFlag.get) {
          return IO.interrupt;
        }

        const empty   = null as unknown as A;
        const message = this.pollers.isEmpty ? this.subscription.poll(empty) : empty;

        if (message === null) {
          const future = Future.unsafeMake<never, A>(fiberId);

          return IO.defer(() => {
            this.pollers.enqueue(future);
            this.subscribers.add(new HashedPair(this.subscription, this.pollers));
            this.strategy.unsafeCompletePollers(
              this.hub,
              this.subscribers,
              this.subscription,
              this.pollers,
            );
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
    ),
  );

  takeAll: IO<unknown, never, Conc<A>> = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    }

    const as = this.pollers.isEmpty ? this.subscription.unsafePollAll : Conc.empty<A>();

    this.strategy.unsafeOnHubEmptySpace(this.hub, this.subscribers);

    return IO.succeedNow(as);
  });

  takeUpTo = (n: number): IO<unknown, never, Conc<A>> => {
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
  return new UnsafeSubscription(
    hub,
    subscribers,
    subscription,
    pollers,
    shutdownHook,
    shutdownFlag,
    strategy,
  );
}

export function subscribersHashSet<A>(): HashSet<
  HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>
> {
  return HashSet.empty<HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>>();
}

class UnsafeHub<A> extends PHubInternal<unknown, unknown, never, never, A, A> {
  constructor(
    readonly hub: HubInternal<A>,
    readonly subscribers: HashSet<
      HashedPair<HubInternal.Subscription<A>, MutableQueue<Future<never, A>>>
    >,
    readonly releaseMap: ReleaseMap,
    readonly shutdownHook: Future<never, void>,
    readonly shutdownFlag: AtomicBoolean,
    readonly strategy: Strategy<A>,
  ) {
    super();
  }

  awaitShutdown = this.shutdownHook.await;

  capacity = this.hub.capacity;

  isShutdown = IO.succeed(this.shutdownFlag.get);

  shutdown = IO.fiberId.chain((fiberId) =>
    IO.defer(() => {
      this.shutdownFlag.set(true);
      return this.releaseMap
        .releaseAll(Exit.interrupt(fiberId), ExecutionStrategy.concurrent)
        .apSecond(this.strategy.shutdown)
        .whenIO(this.shutdownHook.succeed(undefined));
    }),
  ).uninterruptible;

  size = IO.defer(() => {
    if (this.shutdownFlag.get) {
      return IO.interrupt;
    }

    return IO.succeed(this.hub.size());
  });

  subscribe: UManaged<Queue.Dequeue<A>> = Managed.fromIO(
    makeSubscription(this.hub, this.subscribers, this.strategy),
  ).tap((dequeue) =>
    Managed.bracketExit(
      this.releaseMap.add(Finalizer.get(() => dequeue.shutdown)),
      (finalizer, exit) => Finalizer.reverseGet(finalizer)(exit),
    ),
  );

  publish = (a: A): IO<unknown, never, boolean> =>
    IO.defer(() => {
      if (this.shutdownFlag.get) {
        return IO.interrupt;
      }

      if (this.hub.publish(a)) {
        this.strategy.unsafeCompleteSubscribers(this.hub, this.subscribers);
        return IO.succeedNow(true);
      }

      return this.strategy.handleSurplus(
        this.hub,
        this.subscribers,
        Conc.single(a),
        this.shutdownFlag,
      );
    });

  publishAll = (as: Iterable<A>): IO<unknown, never, boolean> =>
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
  releaseMap: ReleaseMap,
  shutdownHook: Future<never, void>,
  shutdownFlag: AtomicBoolean,
  strategy: Strategy<A>,
): Hub<A> {
  return new UnsafeHub(hub, subscribers, releaseMap, shutdownHook, shutdownFlag, strategy);
}

export function makeHubInternal<A>(hub: HubInternal<A>, strategy: Strategy<A>): UIO<Hub<A>> {
  return IO.gen(function* (_) {
    const releaseMap = yield* _(ReleaseMap.make);
    const future     = yield* _(Future.make<never, void>());
    return unsafeMakeHub(
      hub,
      subscribersHashSet(),
      releaseMap,
      future,
      new AtomicBoolean(false),
      strategy,
    );
  });
}
