export const EnqueueTypeId = Symbol.for("fncts.io.Queue.Enqueue");
export type EnqueueTypeId = typeof EnqueueTypeId;

export const DequeueTypeId = Symbol.for("fncts.io.Queue.Dequeue");
export type DequeueTypeId = typeof DequeueTypeId;

export const QueueVariance = Symbol.for("fncts.io.Queue.Variance");
export type QueueVariance = typeof QueueVariance;

export const QueueTypeId = Symbol.for("fncts.io.Queue");
export type QueueTypeId = typeof QueueTypeId;

/**
 * A `PQueue<RA, RB, EA, EB, A, B>` is a lightweight, asynchronous queue into which values of
 * type `A` can be enqueued and of which elements of type `B` can be dequeued. The queue's
 * enqueueing operations may utilize an environment of type `RA` and may fail with errors of
 * type `EA`. The dequeueing operations may utilize an environment of type `RB` and may fail
 * with errors of type `EB`.
 *
 * @tsplus type fncts.io.Queue
 */
export interface PQueue<RA, RB, EA, EB, A, B> extends PEnqueue<RA, RB, EA, EB, A, B>, PDequeue<RA, RB, EA, EB, A, B> {}

/**
 * @tsplus type fncts.io.Queue
 */
export interface PQueueCommon<RA, RB, EA, EB, A, B> {
  readonly [QueueTypeId]: QueueTypeId;
  readonly [QueueVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _RB: (_: never) => RB;
    readonly _EA: (_: never) => EA;
    readonly _EB: (_: never) => EB;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => B;
  };
}

/**
 * @tsplus type fncts.io.Queue
 * @tsplus type fncts.io.Queue.Enqueue
 */
export interface PEnqueue<RA, RB, EA, EB, A, B> extends PQueueCommon<RA, RB, EA, EB, A, B> {
  readonly [EnqueueTypeId]: EnqueueTypeId;
}

/**
 * @tsplus type fncts.io.Queue
 * @tsplus type fncts.io.Queue.Dequeue
 */
export interface PDequeue<RA, RB, EA, EB, A, B> extends PQueueCommon<RA, RB, EA, EB, A, B> {
  readonly [DequeueTypeId]: DequeueTypeId;
}

/**
 * @tsplus type fncts.io.QueueOps
 */
export interface QueueOps {}

export const Queue: QueueOps = {};

/**
 * @optimize remove
 */
export function concrete<RA, RB, EA, EB, A, B>(
  _: PQueue<RA, RB, EA, EB, A, B>,
): asserts _ is QueueInternal<RA, RB, EA, EB, A, B>;
export function concrete<RA, RB, EA, EB, A, B>(
  _: PDequeue<RA, RB, EA, EB, A, B>,
): asserts _ is PDequeueInternal<RA, RB, EA, EB, A, B>;
export function concrete<RA, RB, EA, EB, A, B>(
  _: PEnqueue<RA, RB, EA, EB, A, B>,
): asserts _ is PEnqueueInternal<RA, RB, EA, EB, A, B>;
export function concrete<RA, RB, EA, EB, A, B>(
  _: PQueueCommon<RA, RB, EA, EB, A, B>,
): asserts _ is PQueueCommonInternal<RA, RB, EA, EB, A, B>;
export function concrete(_: any): asserts _ is QueueInternal<any, any, any, any, any, any> {
  //
}

/**
 * A `Queue<RA, RB, EA, EB, A, B>` is a lightweight, asynchronous queue into which values of
 * type `A` can be enqueued and of which elements of type `B` can be dequeued. The queue's
 * enqueueing operations may utilize an environment of type `RA` and may fail with errors of
 * type `EA`. The dequeueing operations may utilize an environment of type `RB` and may fail
 * with errors of type `EB`.
 */
export abstract class QueueInternal<RA, RB, EA, EB, A, B>
  implements PQueue<RA, RB, EA, EB, A, B>, PEnqueue<RA, RB, EA, EB, A, B>, PDequeue<RA, RB, EA, EB, A, B>
{
  readonly [QueueTypeId]: QueueTypeId     = QueueTypeId;
  readonly [DequeueTypeId]: DequeueTypeId = DequeueTypeId;
  readonly [EnqueueTypeId]: EnqueueTypeId = EnqueueTypeId;
  declare [QueueVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _RB: (_: never) => RB;
    readonly _EA: (_: never) => EA;
    readonly _EB: (_: never) => EB;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => B;
  };
  /**
   * Waits until the queue is shutdown.
   * The `IO` returned by this method will not resume until the queue has been shutdown.
   * If the queue is already shutdown, the `IO` will resume right away.
   */
  abstract readonly awaitShutdown: UIO<void>;
  /**
   * How many elements can hold in the queue
   */
  abstract readonly capacity: number;
  /**
   * `true` if `shutdown` has been called.
   */
  abstract readonly isShutdown: UIO<boolean>;
  abstract unsafeOffer(a: A): boolean;
  /**
   * Places one value in the queue.
   */
  abstract offer(a: A, __tsplusTrace?: string): IO<RA, EA, boolean>;
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
  abstract offerAll(as: Iterable<A>, __tsplusTrace?: string): IO<RA, EA, boolean>;
  /**
   * Interrupts any fibers that are suspended on `offer` or `take`.
   * Future calls to `offer*` and `take*` will be interrupted immediately.
   */
  abstract readonly shutdown: UIO<void>;
  abstract readonly unsafeSize: Maybe<number>;
  /**
   * Retrieves the size of the queue, which is equal to the number of elements
   * in the queue. This may be negative if fibers are suspended waiting for
   * elements to be added to the queue.
   */
  abstract readonly size: UIO<number>;
  /**
   * Removes the oldest value in the queue. If the queue is empty, this will
   * return a computation that resumes when an item has been added to the queue.
   */
  abstract readonly take: IO<RB, EB, B>;
  /**
   * Removes all the values in the queue and returns the list of the values. If the queue
   * is empty returns empty list.
   */
  abstract readonly takeAll: IO<RB, EB, Conc<B>>;
  /**
   * Takes up to max number of values in the queue.
   */
  abstract takeUpTo(n: number, __tsplusTrace?: string): IO<RB, EB, Conc<B>>;
}

/**
 * A `Queue<A>` is a lightweight, asynchronous queue into which
 * values of type `A` can be enqueued and dequeued.
 *
 * @tsplus type fncts.io.Queue
 */
export interface Queue<A> extends PQueue<never, never, never, never, A, A> {}

export declare namespace Queue {
  /**
   * A queue that can only be dequeued.
   */
  export interface Dequeue<A> extends PDequeue<never, never, never, never, A, A> {}

  /**
   * A queue that can only be enqueued.
   */
  export interface Enqueue<A> extends PEnqueue<never, never, never, never, A, A> {}
}

export interface PQueueCommonInternal<RA, RB, EA, EB, A, B> {
  readonly [QueueTypeId]: QueueTypeId;
  readonly [QueueVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _RB: (_: never) => RB;
    readonly _EA: (_: never) => EA;
    readonly _EB: (_: never) => EB;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => B;
  };
  /**
   * Waits until the queue is shutdown.
   * The `IO` returned by this method will not resume until the queue has been shutdown.
   * If the queue is already shutdown, the `IO` will resume right away.
   */
  readonly awaitShutdown: UIO<void>;
  /**
   * How many elements can hold in the queue
   */
  readonly capacity: number;
  /**
   * `true` if `shutdown` has been called.
   */
  readonly isShutdown: UIO<boolean>;
  /**
   * Interrupts any fibers that are suspended on `offer` or `take`.
   * Future calls to `offer*` and `take*` will be interrupted immediately.
   */
  readonly shutdown: UIO<void>;
  readonly unsafeSize: Maybe<number>;
  /**
   * Retrieves the size of the queue, which is equal to the number of elements
   * in the queue. This may be negative if fibers are suspended waiting for
   * elements to be added to the queue.
   */
  readonly size: UIO<number>;
}

export interface PEnqueueInternal<RA, RB, EA, EB, A, B> extends PQueueCommonInternal<RA, RB, EA, EB, A, B> {
  readonly [EnqueueTypeId]: EnqueueTypeId;
  unsafeOffer(a: A): boolean;
  /**
   * Places one value in the queue.
   */
  offer(a: A, __tsplusTrace?: string): IO<RA, EA, boolean>;
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
  offerAll(as: Iterable<A>, __tsplusTrace?: string): IO<RA, EA, boolean>;
}

export interface PDequeueInternal<RA, RB, EA, EB, A, B> extends PQueueCommonInternal<RA, RB, EA, EB, A, B> {
  readonly [DequeueTypeId]: DequeueTypeId;
  /**
   * Removes the oldest value in the queue. If the queue is empty, this will
   * return a computation that resumes when an item has been added to the queue.
   */
  readonly take: IO<RB, EB, B>;
  /**
   * Removes all the values in the queue and returns the list of the values. If the queue
   * is empty returns empty list.
   */
  readonly takeAll: IO<RB, EB, Conc<B>>;
  /**
   * Takes up to max number of values in the queue.
   */
  takeUpTo(n: number, __tsplusTrace?: string): IO<RB, EB, Conc<B>>;
}
