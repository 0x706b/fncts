import type { Strategy } from "./internal";
import type { HashSet } from "@fncts/base/collection/mutable/HashSet";
import type { HashedPair } from "@fncts/io/internal/HashedPair";
import type { MutableQueue } from "@fncts/io/internal/MutableQueue";
import type { Dequeue } from "@fncts/io/Queue";

import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import { Hub as HubInternal } from "@fncts/io/internal/Hub";
import { QueueTypeId } from "@fncts/io/Queue";

import { Hub } from "./definition.js";
import { BackPressure, Dropping, Sliding } from "./internal.js";
import { subscribersHashSet } from "./internal.js";

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
  return IO.succeed(HubInternal.makeBounded<A>(requestedCapacity)).flatMap((hub) => makeHub(hub, new BackPressure()));
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
  return IO.succeed(HubInternal.makeBounded<A>(requestedCapacity)).flatMap((hub) => makeHub(hub, new Dropping()));
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
  return IO.succeed(HubInternal.makeBounded<A>(requestedCapacity)).flatMap((hub) => makeHub(hub, new Sliding()));
}

/**
 * Creates an unbounded hub.
 *
 * @tsplus static fncts.io.HubOps makeUnbounded
 */
export function makeUnbounded<A>(__tsplusTrace?: string): UIO<Hub<A>> {
  return IO.succeed(HubInternal.makeUnbounded<A>()).flatMap((hub) => makeHub(hub, new Dropping()));
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
  return new Hub(hub, subscribers, scope, shutdownHook, shutdownFlag, strategy);
}

export function makeHub<A>(hub: HubInternal<A>, strategy: Strategy<A>): UIO<Hub<A>> {
  return Do((_) => {
    const scope  = _(Scope.make);
    const future = _(Future.make<never, void>());
    return unsafeMakeHub(hub, subscribersHashSet(), scope, future, new AtomicBoolean(false), strategy);
  });
}
