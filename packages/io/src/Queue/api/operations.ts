import type { PDequeue, PEnqueue, PQueueCommon } from "@fncts/io/Queue/definition";

import { concrete } from "@fncts/io/Queue/definition";

/**
 * Waits until the queue is shutdown.
 * The `IO` returned by this method will not resume until the queue has been shutdown.
 * If the queue is already shutdown, the `IO` will resume right away.
 *
 * @tsplus getter fncts.io.Queue awaitShutdown
 */
export function awaitShutdown<RA, RB, EA, EB, A, B>(
  queue: PQueueCommon<RA, RB, EA, EB, A, B>,
  __tsplusTrace?: string,
): UIO<void> {
  concrete(queue);
  return queue.awaitShutdown;
}

/**
 * How many elements can hold in the queue
 *
 * @tsplus getter fncts.io.Queue capacity
 */
export function capacity<RA, RB, EA, EB, A, B>(
  queue: PQueueCommon<RA, RB, EA, EB, A, B>,
  __tsplusTrace?: string,
): number {
  concrete(queue);
  return queue.capacity;
}

/**
 * `true` if `shutdown` has been called.
 *
 * @tsplus getter fncts.io.Queue isShutdown
 */
export function isShutdown<RA, RB, EA, EB, A, B>(
  queue: PQueueCommon<RA, RB, EA, EB, A, B>,
  __tsplusTrace?: string,
): UIO<boolean> {
  concrete(queue);
  return queue.isShutdown;
}

/**
 * Places one value in the queue.
 *
 * @tsplus pipeable fncts.io.Queue unsafeOffer
 */
export function unsafeOffer<A>(a: A, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(queue: PEnqueue<RA, RB, EA, EB, A, B>): boolean => {
    concrete(queue);
    return queue.unsafeOffer(a);
  };
}

/**
 * Places one value in the queue.
 *
 * @tsplus pipeable fncts.io.Queue offer
 */
export function offer<A>(a: A, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(queue: PEnqueue<RA, RB, EA, EB, A, B>): IO<RA, EA, boolean> => {
    concrete(queue);
    return queue.offer(a);
  };
}

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
 * @tsplus pipeable fncts.io.Queue offerAll
 */
export function offerAll<A>(as: Iterable<A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(queue: PEnqueue<RA, RB, EA, EB, A, B>) => {
    concrete(queue);
    return queue.offerAll(as);
  };
}

/**
 * Interrupts any fibers that are suspended on `offer` or `take`.
 * Future calls to `offer*` and `take*` will be interrupted immediately.
 *
 * @tsplus getter fncts.io.Queue shutdown
 */
export function shutdown<RA, RB, EA, EB, A, B>(queue: PQueueCommon<RA, RB, EA, EB, A, B>, __tsplusTrace?: string) {
  concrete(queue);
  return queue.shutdown;
}

/**
 * Retrieves the size of the queue, which is equal to the number of elements
 * in the queue. This may be negative if fibers are suspended waiting for
 * elements to be added to the queue.
 *
 * @tsplus getter fncts.io.Queue size
 */
export function size<RA, RB, EA, EB, A, B>(queue: PQueueCommon<RA, RB, EA, EB, A, B>, __tsplusTrace?: string) {
  concrete(queue);
  return queue.size;
}

/**
 * @tsplus getter fncts.io.Queue unsafeSize
 */
export function unsafeSize<RA, RB, EA, EB, A, B>(queue: PQueueCommon<RA, RB, EA, EB, A, B>, __tsplusTrace?: string) {
  concrete(queue);
  return queue.unsafeSize;
}

/**
 * Removes the oldest value in the queue. If the queue is empty, this will
 * return a computation that resumes when an item has been added to the queue.
 *
 * @tsplus getter fncts.io.Queue take
 */
export function take<RA, RB, EA, EB, A, B>(
  queue: PDequeue<RA, RB, EA, EB, A, B>,
  __tsplusTrace?: string,
): IO<RB, EB, B> {
  concrete(queue);
  return queue.take;
}

/**
 * Removes all the values in the queue and returns the list of the values. If the queue
 * is empty returns empty list.
 *
 * @tsplus getter fncts.io.Queue takeAll
 */
export function takeAll<RA, RB, EA, EB, A, B>(queue: PDequeue<RA, RB, EA, EB, A, B>, __tsplusTrace?: string) {
  concrete(queue);
  return queue.takeAll;
}

/**
 * Takes up to max number of values in the queue.
 *
 * @tsplus pipeable fncts.io.Queue takeUpTo
 */
export function takeUpTo(n: number, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A, B>(queue: PQueue<RA, RB, EA, EB, A, B>) => {
    concrete(queue);
    return queue.takeUpTo(n);
  };
}
