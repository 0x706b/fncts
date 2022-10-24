import type { PDequeue, PEnqueue } from "@fncts/io/Queue";

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
import { EnqueueTypeId, QueueTypeId } from "@fncts/io/Queue";

/**
 * Waits for the hub to be shut down.
 *
 * @tsplus getter fncts.io.Hub awaitShutdown
 */
export function awaitShutdown<RA, RB, EA, EB, A, B>(
  self: PHub<RA, RB, EA, EB, A, B>,
  __tsplusTrace?: string,
): UIO<void> {
  concrete(self);
  return self.awaitShutdown;
}

/**
 * The maximum capacity of the hub.
 *
 * @tsplus getter fncts.io.Hub capacity
 */
export function capacity<RA, RB, EA, EB, A, B>(self: PHub<RA, RB, EA, EB, A, B>, __tsplusTrace?: string): number {
  concrete(self);
  return self.capacity;
}

/**
 * Transforms messages published to the hub using the specified effectual
 * function.
 *
 * @tsplus pipeable fncts.io.Hub contramapIO
 */
export function contramapIO<A, RC, EC, C>(f: (c: C) => IO<RC, EC, A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(self: PHub<RA, RB, EA, EB, A, B>): PHub<RC | RA, RB, EA | EC, EB, C, B> => {
    return self.dimapIO(f, IO.succeedNow);
  };
}

class DimapIO<RA, RB, RC, RD, EA, EB, EC, ED, A, B, C, D> extends PHubInternal<
  RC | RA,
  RD | RB,
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
  subscribe: IO<Scope, never, PDequeue<RA | RC, RB | RD, EA | EC, EB | ED, C, D>> = unsafeCoerce(
    this.source.subscribe.map((queue) => queue.mapIO(this.g)),
  );
  publish    = (c: C) => this.f(c).flatMap((a) => this.source.publish(a));
  publishAll = (cs: Iterable<C>) => IO.foreach(cs, this.f).flatMap((as) => this.source.publishAll(as));
}

/**
 * Transforms messages published to and taken from the hub using the
 * specified functions.
 *
 * @tsplus pipeable fncts.io.Hub dimap
 */
export function dimap<A, B, C, D>(f: (c: C) => A, g: (b: B) => D, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PHub<RA, RB, EA, EB, A, B>): PHub<RA, RB, EA, EB, C, D> => {
    return self.dimapIO(
      (c) => IO.succeedNow(f(c)),
      (b) => IO.succeedNow(g(b)),
    );
  };
}

/**
 * Transforms messages published to and taken from the hub using the
 * specified effectual functions.
 *
 * @tsplus pipeable fncts.io.Hub dimapIO
 */
export function dimapIO<A, B, RC, EC, C, RD, ED, D>(
  f: (c: C) => IO<RC, EC, A>,
  g: (b: B) => IO<RD, ED, D>,
  __tsplusTrace?: string,
) {
  return <RA, RB, EA, EB>(source: PHub<RA, RB, EA, EB, A, B>): PHub<RC | RA, RD | RB, EA | EC, EB | ED, C, D> => {
    concrete(source);
    return new DimapIO(source, f, g);
  };
}

class FilterInputIO<RA, RA1, RB, EA, EA1, EB, A, B> extends PHubInternal<RA | RA1, RB, EA | EA1, EB, A, B> {
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
 * @tsplus pipeable fncts.io.Hub filterInputIO
 */
export function filterInputIO<A, R1, E1>(f: (a: A) => IO<R1, E1, boolean>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(source: PHub<RA, RB, EA, EB, A, B>): PHub<RA | R1, RB, EA | E1, EB, A, B> => {
    concrete(source);
    return new FilterInputIO(source, f);
  };
}

/**
 * Filters messages published to the hub using the specified function.
 *
 * @tsplus pipeable fncts.io.Hub filterInput
 */
export function filterInput<A>(f: (a: A) => boolean, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(self: PHub<RA, RB, EA, EB, A, B>) => {
    return self.filterInputIO((a) => IO.succeedNow(f(a)));
  };
}

class FilterOutputIO<RA, RB, RB1, EA, EB, EB1, A, B> extends PHubInternal<RA, RB | RB1, EA, EB | EB1, A, B> {
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
 * @tsplus pipeable fncts.io.Hub filterOutputIO
 */
export function filterOutputIO<B, R1, E1>(f: (a: B) => IO<R1, E1, boolean>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(source: PHub<RA, RB, EA, EB, A, B>): PHub<RA, RB | R1, EA, EB | E1, A, B> => {
    concrete(source);
    return new FilterOutputIO(source, f);
  };
}

/**
 * Filters messages taken from the hub using the specified function.
 *
 * @tsplus pipeable fncts.io.Hub filterOutput
 */
export function filterOutput<B>(f: (b: B) => boolean, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(self: PHub<RA, RB, EA, EB, A, B>): PHub<RA, RB, EA, EB, A, B> => {
    return self.filterOutputIO((b) => IO.succeedNow(f(b)));
  };
}

/**
 * Checks whether the hub is shut down.
 *
 * @tsplus getter fncts.io.Hub isShutdown
 */
export function isShutdown<RA, RB, EA, EB, A, B>(
  self: PHub<RA, RB, EA, EB, A, B>,
  __tsplusTrace?: string,
): UIO<boolean> {
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
 * @tsplus static fncts.io.HubOps makeBounded
 */
export function makeBounded<A>(requestedCapacity: number, __tsplusTrace?: string): UIO<Hub<A>> {
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
 * @tsplus static fncts.io.HubOps makeDropping
 */
export function makeDropping<A>(requestedCapacity: number, __tsplusTrace?: string): UIO<Hub<A>> {
  return IO.succeed(HubInternal.makeBounded<A>(requestedCapacity)).flatMap((hub) =>
    makeHubInternal(hub, new Dropping()),
  );
}

/**
 * Creates a bounded hub with the sliding strategy. The hub will add new
 * messages and drop old messages if the hub is at capacity.
 *
 * For best performance use capacities that are powers of two.
 *
 * @tsplus static fncts.io.HubOps makeSliding
 */
export function makeSliding<A>(requestedCapacity: number, __tsplusTrace?: string): UIO<Hub<A>> {
  return IO.succeed(HubInternal.makeBounded<A>(requestedCapacity)).flatMap((hub) =>
    makeHubInternal(hub, new Sliding()),
  );
}

/**
 * Creates an unbounded hub.
 *
 * @tsplus static fncts.io.HubOps makeUnbounded
 */
export function makeUnbounded<A>(__tsplusTrace?: string): UIO<Hub<A>> {
  return IO.succeed(HubInternal.makeUnbounded<A>()).flatMap((hub) => makeHubInternal(hub, new Dropping()));
}

/**
 * Transforms messages taken from the hub using the specified function.
 *
 * @tsplus pipeable fncts.io.Hub map
 */
export function map<B, C>(f: (b: B) => C, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(self: PHub<RA, RB, EA, EB, A, B>): PHub<RA, RB, EA, EB, A, C> => {
    return self.mapIO((b) => IO.succeedNow(f(b)));
  };
}

/**
 * Transforms messages taken from the hub using the specified effectual
 * function.
 *
 * @tsplus pipeable fncts.io.Hub mapIO
 */
export function mapIO<B, RC, EC, C>(f: (b: B) => IO<RC, EC, C>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(self: PHub<RA, RB, EA, EB, A, B>): PHub<RA, RC | RB, EA, EB | EC, A, C> => {
    return self.dimapIO(IO.succeedNow, f);
  };
}

class ToQueue<RA, RB, EA, EB, A, B> implements PEnqueue<RA, RB, EA, EB, A, B> {
  readonly [QueueTypeId]: QueueTypeId     = QueueTypeId;
  readonly [EnqueueTypeId]: EnqueueTypeId = EnqueueTypeId;
  declare _RA: () => RA;
  declare _RB: () => RB;
  declare _EA: () => EA;
  declare _EB: () => EB;
  declare _A: (_: A) => void;
  declare _B: () => B;
  constructor(readonly source: PHubInternal<RA, RB, EA, EB, A, B>) {}
  awaitShutdown = this.source.awaitShutdown;
  capacity      = this.source.capacity;
  isShutdown    = this.source.isShutdown;
  shutdown      = this.source.shutdown;
  size          = this.source.size;
  offer         = (a: A): IO<RA, EA, boolean> => this.source.publish(a);
  offerAll      = (as: Iterable<A>): IO<RA, EA, boolean> => this.source.publishAll(as);
  takeUpTo      = (): IO<never, never, Conc<never>> => IO.succeedNow(Conc.empty());
}

/**
 * Publishes a message to the hub, returning whether the message was
 * published to the hub.
 *
 * @tsplus pipeable fncts.io.Hub publish
 */
export function publish<A>(a: A, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(self: PHub<RA, RB, EA, EB, A, B>): IO<RA, EA, boolean> => {
    concrete(self);
    return self.publish(a);
  };
}

/**
 * Publishes all of the specified messages to the hub, returning whether
 * they were published to the hub.
 *
 * @tsplus pipeable fncts.io.Hub publishAll
 */
export function publishAll<A>(as: Iterable<A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(self: PHub<RA, RB, EA, EB, A, B>): IO<RA, EA, boolean> => {
    concrete(self);
    return self.publishAll(as);
  };
}

/**
 * Shuts down the hub.
 *
 * @tsplus getter fncts.io.Hub shutdown
 */
export function shutdown<RA, RB, EA, EB, A, B>(self: PHub<RA, RB, EA, EB, A, B>, __tsplusTrace?: string): UIO<void> {
  concrete(self);
  return self.shutdown;
}

/**
 * Subscribes to receive messages from the hub. The resulting subscription
 * can be evaluated multiple times within the scope of the managed to take a
 * message from the hub each time.
 *
 * @tsplus getter fncts.io.Hub subscribe
 */
export function subscribe<RA, RB, EA, EB, A, B>(
  self: PHub<RA, RB, EA, EB, A, B>,
  __tsplusTrace?: string,
): IO<Scope, never, PDequeue<RA, RB, EA, EB, A, B>> {
  concrete(self);
  return self.subscribe;
}

/**
 * The current number of messages in the hub.
 *
 * @tsplus getter fncts.io.Hub size
 */
export function size<RA, RB, EA, EB, A, B>(self: PHub<RA, RB, EA, EB, A, B>, __tsplusTrace?: string): UIO<number> {
  concrete(self);
  return self.size;
}

/**
 * Views the hub as a queue that can only be written to.
 *
 * @tsplus getter fncts.io.Hub toQueue
 */
export function toQueue<RA, RB, EA, EB, A, B>(
  source: PHub<RA, RB, EA, EB, A, B>,
  __tsplusTrace?: string,
): PEnqueue<RA, RB, EA, EB, A, B> {
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
 * @tsplus static fncts.io.HubOps unsafeMakeBounded
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
 * @tsplus static fncts.io.HubOps unsafeMakeDropping
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
 * @tsplus static fncts.io.HubOps unsafeMakeSliding
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
 * @tsplus static fncts.io.HubOps unsafeMakeUnbounded
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
