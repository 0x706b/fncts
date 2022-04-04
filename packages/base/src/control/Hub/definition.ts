export const HubTypeId = Symbol.for("fncts.control.Hub");
export type HubTypeId = typeof HubTypeId;

/**
 * A `Hub<RA, RB, EA, EB, A, B>` is an asynchronous message hub. Publishers
 * can publish messages of type `A` to the hub and subscribers can subscribe to
 * take messages of type `B` from the hub. Publishing messages can require an
 * environment of type `RA` and fail with an error of type `EA`. Taking
 * messages can require an environment of type `RB` and fail with an error of
 * type `EB`.
 *
 * @tsplus type fncts.control.Hub
 */
export interface PHub<RA, RB, EA, EB, A, B> {
  readonly _typeId: HubTypeId;
  readonly _RA: (_: RA) => void;
  readonly _RB: (_: RB) => void;
  readonly _EA: () => EA;
  readonly _EB: () => EB;
  readonly _A: (_: A) => void;
  readonly _B: () => B;
}

/**
 * @tsplus type fncts.control.Hub
 */
export interface Hub<A> extends PHub<unknown, unknown, never, never, A, A> {}

/**
 * @tsplus type fncts.control.HubOps
 */
export interface HubOps {}

export const Hub: HubOps = {};

export declare namespace Hub {
  export type Dequeue<R, E, A> = PQueue<never, R, unknown, E, never, A>;
  export type Enqueue<R, E, A> = PQueue<R, never, E, unknown, A, never>;
}

export abstract class PHubInternal<RA, RB, EA, EB, A, B> implements PHub<RA, RB, EA, EB, A, B> {
  _typeId: HubTypeId = HubTypeId;
  readonly _RA!: (_: RA) => void;
  readonly _RB!: (_: RB) => void;
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
  abstract subscribe: IO<Has<Scope>, never, Hub.Dequeue<RB, EB, B>>;
}

/**
 * @tsplus macro remove
 */
export function concrete<RA, RB, EA, EB, A, B>(
  _: PHub<RA, RB, EA, EB, A, B>,
): asserts _ is PHubInternal<RA, RB, EA, EB, A, B> {
  //
}
