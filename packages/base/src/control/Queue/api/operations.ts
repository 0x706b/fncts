import type { IO, UIO } from "../../IO.js";
import type { PQueue } from "../definition.js";

import { concrete } from "../definition.js";

/**
 * Waits until the queue is shutdown.
 * The `IO` returned by this method will not resume until the queue has been shutdown.
 * If the queue is already shutdown, the `IO` will resume right away.
 *
 * @tsplus getter fncts.control.Queue awaitShutdown
 */
export function awaitShutdown<RA, RB, EA, EB, A, B>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
): UIO<void> {
  concrete(queue);
  return queue.awaitShutdown;
}

/**
 * How many elements can hold in the queue
 *
 * @tsplus getter fncts.control.Queue capacity
 */
export function capacity<RA, RB, EA, EB, A, B>(queue: PQueue<RA, RB, EA, EB, A, B>): number {
  concrete(queue);
  return queue.capacity;
}

/**
 * `true` if `shutdown` has been called.
 *
 * @tsplus getter fncts.control.Queue isShutdown
 */
export function isShutdown<RA, RB, EA, EB, A, B>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
): UIO<boolean> {
  concrete(queue);
  return queue.isShutdown;
}

/**
 * Places one value in the queue.
 *
 * @tsplus fluent fncts.control.Queue offer
 */
export function offer_<RA, RB, EA, EB, A, B>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  a: A,
): IO<RA, EA, boolean> {
  concrete(queue);
  return queue.offer(a);
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
 * @tsplus fluent fncts.control.Queue offerAll
 */
export function offerAll_<RA, RB, EA, EB, A, B>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  as: Iterable<A>,
) {
  concrete(queue);
  return queue.offerAll(as);
}

/**
 * Interrupts any fibers that are suspended on `offer` or `take`.
 * Future calls to `offer*` and `take*` will be interrupted immediately.
 *
 * @tsplus getter fncts.control.Queue shutdown
 */
export function shutdown<RA, RB, EA, EB, A, B>(queue: PQueue<RA, RB, EA, EB, A, B>) {
  concrete(queue);
  return queue.shutdown;
}

/**
 * Retrieves the size of the queue, which is equal to the number of elements
 * in the queue. This may be negative if fibers are suspended waiting for
 * elements to be added to the queue.
 *
 * @tsplus getter fncts.control.Queue size
 */
export function size<RA, RB, EA, EB, A, B>(queue: PQueue<RA, RB, EA, EB, A, B>) {
  concrete(queue);
  return queue.size;
}

/**
 * Removes the oldest value in the queue. If the queue is empty, this will
 * return a computation that resumes when an item has been added to the queue.
 *
 * @tsplus getter fncts.control.Queue take
 */
export function take<RA, RB, EA, EB, A, B>(queue: PQueue<RA, RB, EA, EB, A, B>) {
  concrete(queue);
  return queue.take;
}

/**
 * Removes all the values in the queue and returns the list of the values. If the queue
 * is empty returns empty list.
 *
 * @tsplus getter fncts.control.Queue takeAll
 */
export function takeAll<RA, RB, EA, EB, A, B>(queue: PQueue<RA, RB, EA, EB, A, B>) {
  concrete(queue);
  return queue.takeAll;
}

/**
 * Takes up to max number of values in the queue.
 *
 * @tsplus fluent fncts.control.Queue takeAllUpTo
 */
export function takeAllUpTo_<RA, RB, EA, EB, A, B>(queue: PQueue<RA, RB, EA, EB, A, B>, n: number) {
  concrete(queue);
  return queue.takeUpTo(n);
}

// codegen:start { preset: pipeable }
/**
 * Places one value in the queue.
 * @tsplus dataFirst offer_
 */
export function offer<A>(a: A) {
  return <RA, RB, EA, EB, B>(queue: PQueue<RA, RB, EA, EB, A, B>): IO<RA, EA, boolean> =>
    offer_(queue, a);
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
 * @tsplus dataFirst offerAll_
 */
export function offerAll<A>(as: Iterable<A>) {
  return <RA, RB, EA, EB, B>(queue: PQueue<RA, RB, EA, EB, A, B>) => offerAll_(queue, as);
}
/**
 * Takes up to max number of values in the queue.
 * @tsplus dataFirst takeAllUpTo_
 */
export function takeAllUpTo(n: number) {
  return <RA, RB, EA, EB, A, B>(queue: PQueue<RA, RB, EA, EB, A, B>) => takeAllUpTo_(queue, n);
}
// codegen:end
