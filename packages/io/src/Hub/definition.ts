import type { IO } from "@fncts/io/IO";
import type { PDequeue, PEnqueue, PEnqueueInternal } from "@fncts/io/Queue";

import { EnqueueTypeId, QueueTypeId } from "@fncts/io/Queue";

export const HubTypeId = Symbol.for("fncts.io.Hub");
export type HubTypeId = typeof HubTypeId;

/**
 * A `Hub<RA, RB, EA, EB, A, B>` is an asynchronous message hub. Publishers
 * can publish messages of type `A` to the hub and subscribers can subscribe to
 * take messages of type `B` from the hub. Publishing messages can require an
 * environment of type `RA` and fail with an error of type `EA`. Taking
 * messages can require an environment of type `RB` and fail with an error of
 * type `EB`.
 *
 * @tsplus type fncts.io.Hub
 */
export interface PHub<RA, RB, EA, EB, A, B> extends PEnqueue<RA, RB, EA, EB, A, B> {
  readonly _typeId: HubTypeId;
  readonly _RA: () => RA;
  readonly _RB: () => RB;
  readonly _EA: () => EA;
  readonly _EB: () => EB;
  readonly _A: (_: A) => void;
  readonly _B: () => B;
}

/**
 * @tsplus type fncts.io.Hub
 */
export interface Hub<A> extends PHub<never, never, never, never, A, A> {}

/**
 * @tsplus type fncts.io.HubOps
 */
export interface HubOps {}

export const Hub: HubOps = {};

export declare namespace PHub {}
export declare namespace Hub {}

export abstract class PHubInternal<RA, RB, EA, EB, A, B>
  implements PHub<RA, RB, EA, EB, A, B>, PEnqueueInternal<RA, RB, EA, EB, A, B>
{
  readonly [QueueTypeId]: QueueTypeId     = QueueTypeId;
  readonly [EnqueueTypeId]: EnqueueTypeId = EnqueueTypeId;
  _typeId: HubTypeId = HubTypeId;
  readonly _RA!: () => RA;
  readonly _RB!: () => RB;
  readonly _EA!: () => EA;
  readonly _EB!: () => EB;
  readonly _A!: (_: A) => void;
  readonly _B!: () => B;

  /**
   * Waits for the hub to be shut down.
   */
  abstract awaitShutdown: UIO<void>;

  /**
   * The maximum capacity of the hub.
   */
  abstract capacity: number;

  /**
   * Checks whether the hub is shut down.
   */
  abstract isShutdown: UIO<boolean>;

  /**
   * Publishes a message to the hub, returning whether the message was
   * published to the hub.
   */
  abstract publish(a: A): IO<RA, EA, boolean>;

  /**
   * Publishes all of the specified messages to the hub, returning whether
   * they were published to the hub.
   */
  abstract publishAll(as: Iterable<A>): IO<RA, EA, boolean>;

  /**
   * Shuts down the hub.
   */
  abstract shutdown: UIO<void>;

  /**
   * The current number of messages in the hub.
   */
  abstract size: UIO<number>;

  /**
   * Subscribes to receive messages from the hub. The resulting subscription
   * can be evaluated multiple times within the scope of the managed to take a
   * message from the hub each time.
   */
  abstract subscribe: IO<Scope, never, PDequeue<RA, RB, EA, EB, A, B>>;

  offer(a: A, __tsplusTrace?: string): IO<RA, EA, boolean> {
    return this.publish(a);
  }

  offerAll(as: Iterable<A>, __tsplusTrace?: string): IO<RA, EA, boolean> {
    return this.publishAll(as);
  }
}

/**
 * @tsplus macro remove
 */
export function concrete<RA, RB, EA, EB, A, B>(
  _: PHub<RA, RB, EA, EB, A, B>,
): asserts _ is PHubInternal<RA, RB, EA, EB, A, B> {
  //
}
