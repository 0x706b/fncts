import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import { concrete, PHubInternal } from "@fncts/io/Hub/definition";
import {
  BackPressure,
  Dropping,
  makeHubInternal,
  Sliding,
  subscribersHashSet,
  unsafeMakeHub,
} from "@fncts/io/Hub/internal";
import { Hub as HubInternal } from "@fncts/io/internal/Hub";
import { QueueInternal } from "@fncts/io/Queue";

/**
 * Waits for the hub to be shut down.
 *
 * @tsplus getter fncts.control.Hub awaitShutdown
 */
export function awaitShutdown<RA, RB, EA, EB, A, B>(self: PHub<RA, RB, EA, EB, A, B>): UIO<void> {
  concrete(self);
  return self.awaitShutdown;
}

/**
 * The maximum capacity of the hub.
 *
 * @tsplus getter fncts.control.Hub capacity
 */
export function capacity<RA, RB, EA, EB, A, B>(self: PHub<RA, RB, EA, EB, A, B>): number {
  concrete(self);
  return self.capacity;
}

/**
 * Transforms messages published to the hub using the specified effectual
 * function.
 *
 * @tsplus fluent fncts.control.Hub contramapIO
 */
export function contramapIO_<RA, RB, RC, EA, EB, EC, A, B, C>(
  self: PHub<RA, RB, EA, EB, A, B>,
  f: (c: C) => IO<RC, EC, A>,
): PHub<RC & RA, RB, EA | EC, EB, C, B> {
  return self.dimapIO(f, IO.succeedNow);
}

class DimapIO<RA, RB, RC, RD, EA, EB, EC, ED, A, B, C, D> extends PHubInternal<
  RC & RA,
  RD & RB,
  EA | EC,
  EB | ED,
  C,
  D
> {
  constructor(
    readonly source: PHubInternal<RA, RB, EA, EB, A, B>,
    readonly f: (c: C) => IO<RC, EC, A>,
    readonly g: (b: B) => IO<RD, ED, D>,
  ) {
    super();
  }
  awaitShutdown = this.source.awaitShutdown;
  capacity      = this.source.capacity;
  isShutdown    = this.source.isShutdown;
  shutdown      = this.source.shutdown;
  size          = this.source.size;
  subscribe     = this.source.subscribe.map((queue) => queue.mapIO(this.g));
  publish       = (c: C) => this.f(c).flatMap((a) => this.source.publish(a));
  publishAll    = (cs: Iterable<C>) => IO.foreach(cs, this.f).flatMap((as) => this.source.publishAll(as));
}

/**
 * Transforms messages published to and taken from the hub using the
 * specified functions.
 *
 * @tsplus fluent fncts.control.Hub dimap
 */
export function dimap_<RA, RB, EA, EB, A, B, C, D>(
  self: PHub<RA, RB, EA, EB, A, B>,
  f: (c: C) => A,
  g: (b: B) => D,
): PHub<RA, RB, EA, EB, C, D> {
  return self.dimapIO(
    (c) => IO.succeedNow(f(c)),
    (b) => IO.succeedNow(g(b)),
  );
}

/**
 * Transforms messages published to and taken from the hub using the
 * specified effectual functions.
 *
 * @tsplus fluent fncts.control.Hub dimapIO
 */
export function dimapIO_<RA, RB, RC, RD, EA, EB, EC, ED, A, B, C, D>(
  source: PHub<RA, RB, EA, EB, A, B>,
  f: (c: C) => IO<RC, EC, A>,
  g: (b: B) => IO<RD, ED, D>,
): PHub<RC & RA, RD & RB, EA | EC, EB | ED, C, D> {
  concrete(source);
  return new DimapIO(source, f, g);
}

class FilterInputIO<RA, RA1, RB, EA, EA1, EB, A, B> extends PHubInternal<RA & RA1, RB, EA | EA1, EB, A, B> {
  constructor(readonly source: PHubInternal<RA, RB, EA, EB, A, B>, readonly f: (a: A) => IO<RA1, EA1, boolean>) {
    super();
  }
  awaitShutdown = this.source.awaitShutdown;
  capacity      = this.source.capacity;
  isShutdown    = this.source.isShutdown;
  shutdown      = this.source.shutdown;
  size          = this.source.size;
  subscribe     = this.source.subscribe;
  publish       = (a: A) => this.f(a).flatMap((b) => (b ? this.source.publish(a) : IO.succeedNow(false)));
  publishAll    = (as: Iterable<A>) =>
    IO.filter(as, this.f).flatMap((as) => (as.isNonEmpty ? this.source.publishAll(as) : IO.succeedNow(false)));
}

/**
 * Filters messages published to the hub using the specified effectual
 * function.
 *
 * @tsplus fluent fncts.control.Hub filterInputIO
 */
export function filterInputIO_<RA, RA1, RB, EA, EA1, EB, A, B>(
  source: PHub<RA, RB, EA, EB, A, B>,
  f: (a: A) => IO<RA1, EA1, boolean>,
): PHub<RA & RA1, RB, EA | EA1, EB, A, B> {
  concrete(source);
  return new FilterInputIO(source, f);
}

/**
 * Filters messages published to the hub using the specified function.
 *
 * @tsplus fluent fncts.control.Hub filterInput
 */
export function filterInput_<RA, RB, EA, EB, A, B>(self: PHub<RA, RB, EA, EB, A, B>, f: (a: A) => boolean) {
  return self.filterInputIO((a) => IO.succeedNow(f(a)));
}

class FilterOutputIO<RA, RB, RB1, EA, EB, EB1, A, B> extends PHubInternal<RA, RB & RB1, EA, EB | EB1, A, B> {
  constructor(readonly source: PHubInternal<RA, RB, EA, EB, A, B>, readonly f: (a: B) => IO<RB1, EB1, boolean>) {
    super();
  }
  awaitShutdown = this.source.awaitShutdown;
  capacity      = this.source.capacity;
  isShutdown    = this.source.isShutdown;
  shutdown      = this.source.shutdown;
  size          = this.source.size;
  subscribe     = this.source.subscribe.map((queue) => queue.filterOutputIO(this.f));
  publish       = (a: A) => this.source.publish(a);
  publishAll    = (as: Iterable<A>) => this.source.publishAll(as);
}

/**
 * Filters messages taken from the hub using the specified effectual
 * function.
 *
 * @tsplus fluent fncts.control.Hub filterOutputIO
 */
export function filterOutputIO_<RA, RB, RB1, EA, EB, EB1, A, B>(
  source: PHub<RA, RB, EA, EB, A, B>,
  f: (a: B) => IO<RB1, EB1, boolean>,
): PHub<RA, RB & RB1, EA, EB | EB1, A, B> {
  concrete(source);
  return new FilterOutputIO(source, f);
}

/**
 * Filters messages taken from the hub using the specified function.
 *
 * @tsplus fluent fncts.control.Hub filterOutput
 */
export function filterOutput_<RA, RB, EA, EB, A, B>(
  self: PHub<RA, RB, EA, EB, A, B>,
  f: (b: B) => boolean,
): PHub<RA, RB, EA, EB, A, B> {
  return self.filterOutputIO((b) => IO.succeedNow(f(b)));
}

/**
 * Checks whether the hub is shut down.
 *
 * @tsplus getter fncts.control.Hub isShutdown
 */
export function isShutdown<RA, RB, EA, EB, A, B>(self: PHub<RA, RB, EA, EB, A, B>): UIO<boolean> {
  concrete(self);
  return self.isShutdown;
}

/**
 * Creates a bounded hub with the back pressure strategy. The hub will retain
 * messages until they have been taken by all subscribers, applying back
 * pressure to publishers if the hub is at capacity.
 *
 * For best performance use capacities that are powers of two.
 *
 * @tsplus static fncts.control.HubOps makeBounded
 */
export function makeBounded<A>(requestedCapacity: number): UIO<Hub<A>> {
  return IO.succeed(HubInternal.makeBounded<A>(requestedCapacity)).flatMap((hub) =>
    makeHubInternal(hub, new BackPressure()),
  );
}

/**
 * Creates a bounded hub with the dropping strategy. The hub will drop new
 * messages if the hub is at capacity.
 *
 * For best performance use capacities that are powers of two.
 *
 * @tsplus static fncts.control.HubOps makeDropping
 */
export function makeDropping<A>(requestedCapacity: number): UIO<Hub<A>> {
  return IO.succeed(HubInternal.makeBounded<A>(requestedCapacity)).flatMap((hub) => makeHubInternal(hub, new Dropping()));
}

/**
 * Creates a bounded hub with the sliding strategy. The hub will add new
 * messages and drop old messages if the hub is at capacity.
 *
 * For best performance use capacities that are powers of two.
 *
 * @tsplus static fncts.control.HubOps makeSliding
 */
export function makeSliding<A>(requestedCapacity: number): UIO<Hub<A>> {
  return IO.succeed(HubInternal.makeBounded<A>(requestedCapacity)).flatMap((hub) => makeHubInternal(hub, new Sliding()));
}

/**
 * Creates an unbounded hub.
 *
 * @tsplus static fncts.control.HubOps makeUnbounded
 */
export function makeUnbounded<A>(): UIO<Hub<A>> {
  return IO.succeed(HubInternal.makeUnbounded<A>()).flatMap((hub) => makeHubInternal(hub, new Dropping()));
}

/**
 * Transforms messages taken from the hub using the specified function.
 *
 * @tsplus fluent fncts.control.Hub map
 */
export function map_<RA, RB, EA, EB, A, B, C>(
  self: PHub<RA, RB, EA, EB, A, B>,
  f: (b: B) => C,
): PHub<RA, RB, EA, EB, A, C> {
  return self.mapIO((b) => IO.succeedNow(f(b)));
}

/**
 * Transforms messages taken from the hub using the specified effectual
 * function.
 *
 * @tsplus fluent fncts.control.Hub mapIO
 */
export function mapIO_<RA, RB, RC, EA, EB, EC, A, B, C>(
  self: PHub<RA, RB, EA, EB, A, B>,
  f: (b: B) => IO<RC, EC, C>,
): PHub<RA, RC & RB, EA, EB | EC, A, C> {
  return self.dimapIO(IO.succeedNow, f);
}

class ToQueue<RA, RB, EA, EB, A, B> extends QueueInternal<RA, never, EA, unknown, A, never> {
  constructor(readonly source: PHubInternal<RA, RB, EA, EB, A, B>) {
    super();
  }
  awaitShutdown = this.source.awaitShutdown;
  capacity      = this.source.capacity;
  isShutdown    = this.source.isShutdown;
  shutdown      = this.source.shutdown;
  size          = this.source.size;
  take          = IO.never;
  takeAll       = IO.succeedNow(Conc.empty<never>());
  offer         = (a: A): IO<RA, EA, boolean> => this.source.publish(a);
  offerAll      = (as: Iterable<A>): IO<RA, EA, boolean> => this.source.publishAll(as);
  takeUpTo      = (): IO<unknown, never, Conc<never>> => IO.succeedNow(Conc.empty());
}

/**
 * Publishes a message to the hub, returning whether the message was
 * published to the hub.
 *
 * @tsplus fluent fncts.control.Hub publish
 */
export function publish_<RA, RB, EA, EB, A, B>(self: PHub<RA, RB, EA, EB, A, B>, a: A): IO<RA, EA, boolean> {
  concrete(self);
  return self.publish(a);
}

/**
 * Publishes all of the specified messages to the hub, returning whether
 * they were published to the hub.
 *
 * @tsplus fluent fncts.control.Hub publishAll
 */
export function publishAll_<RA, RB, EA, EB, A, B>(
  self: PHub<RA, RB, EA, EB, A, B>,
  as: Iterable<A>,
): IO<RA, EA, boolean> {
  concrete(self);
  return self.publishAll(as);
}

/**
 * Shuts down the hub.
 *
 * @tsplus getter fncts.control.Hub shutdown
 */
export function shutdown<RA, RB, EA, EB, A, B>(self: PHub<RA, RB, EA, EB, A, B>): UIO<void> {
  concrete(self);
  return self.shutdown;
}

/**
 * Subscribes to receive messages from the hub. The resulting subscription
 * can be evaluated multiple times within the scope of the managed to take a
 * message from the hub each time.
 *
 * @tsplus getter fncts.control.Hub subscribe
 */
export function subscribe<RA, RB, EA, EB, A, B>(
  self: PHub<RA, RB, EA, EB, A, B>,
): IO<Has<Scope>, never, Hub.Dequeue<RB, EB, B>> {
  concrete(self);
  return self.subscribe;
}

/**
 * The current number of messages in the hub.
 *
 * @tsplus getter fncts.control.Hub size
 */
export function size<RA, RB, EA, EB, A, B>(self: PHub<RA, RB, EA, EB, A, B>): UIO<number> {
  concrete(self);
  return self.size;
}

/**
 * Views the hub as a queue that can only be written to.
 *
 * @tsplus getter fncts.control.Hub toQueue
 */
export function toQueue<RA, RB, EA, EB, A, B>(source: PHub<RA, RB, EA, EB, A, B>): Hub.Enqueue<RA, EA, A> {
  concrete(source);
  return new ToQueue(source);
}

/**
 * Creates a bounded hub with the back pressure strategy. The hub will retain
 * messages until they have been taken by all subscribers, applying back
 * pressure to publishers if the hub is at capacity.
 *
 * For best performance use capacities that are powers of two.
 *
 * @tsplus static fncts.control.HubOps unsafeMakeBounded
 */
export function unsafeMakeBounded<A>(requestedCapacity: number): Hub<A> {
  const scope = Scope.unsafeMake();

  return unsafeMakeHub(
    HubInternal.makeBounded<A>(requestedCapacity),
    subscribersHashSet<A>(),
    scope,
    Future.unsafeMake<never, void>(FiberId.none),
    new AtomicBoolean(false),
    new BackPressure(),
  );
}

/**
 * Creates a bounded hub with the dropping strategy. The hub will drop new
 * messages if the hub is at capacity.
 *
 * For best performance use capacities that are powers of two.
 *
 * @tsplus static fncts.control.HubOps unsafeMakeDropping
 */
export function unsafeMakeDropping<A>(requestedCapacity: number): Hub<A> {
  const scope = Scope.unsafeMake();

  return unsafeMakeHub(
    HubInternal.makeBounded<A>(requestedCapacity),
    subscribersHashSet<A>(),
    scope,
    Future.unsafeMake<never, void>(FiberId.none),
    new AtomicBoolean(false),
    new Dropping(),
  );
}

/**
 * Creates a bounded hub with the sliding strategy. The hub will add new
 * messages and drop old messages if the hub is at capacity.
 *
 * For best performance use capacities that are powers of two.
 *
 * @tsplus static fncts.control.HubOps unsafeMakeSliding
 */
export function unsafeMakeSliding<A>(requestedCapacity: number): Hub<A> {
  const scope = Scope.unsafeMake();

  return unsafeMakeHub(
    HubInternal.makeBounded<A>(requestedCapacity),
    subscribersHashSet<A>(),
    scope,
    Future.unsafeMake<never, void>(FiberId.none),
    new AtomicBoolean(false),
    new Sliding(),
  );
}

/**
 * Creates an unbounded hub.
 *
 * @tsplus static fncts.control.HubOps unsafeMakeUnbounded
 */
export function unsafeMakeUnbounded<A>(): Hub<A> {
  const scope = Scope.unsafeMake();

  return unsafeMakeHub(
    HubInternal.makeUnbounded<A>(),
    subscribersHashSet<A>(),
    scope,
    Future.unsafeMake<never, void>(FiberId.none),
    new AtomicBoolean(false),
    new Dropping(),
  );
}
