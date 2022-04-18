import type { FiberStatus } from "@fncts/io/FiberStatus";

export interface CommonFiber<E, A> {
  /**
   * Awaits the fiber, which suspends the awaiting fiber until the result of the
   * fiber has been determined.
   */
  readonly await: UIO<Exit<E, A>>;
  /**
   * Inherits values from all {@link FiberRef} instances into current fiber.
   * This will resume immediately.
   */
  readonly inheritRefs: UIO<void>;
  /**
   * Interrupts the fiber as if interrupted from the specified fiber. If the
   * fiber has already exited, the returned effect will resume immediately.
   * Otherwise, the effect will resume when the fiber exits.
   */
  readonly interruptAs: (fiberId: FiberId) => UIO<Exit<E, A>>;
  /**
   * Tentatively observes the fiber, but returns immediately if it is not already done.
   */
  readonly poll: UIO<Maybe<Exit<E, A>>>;
}

export interface RuntimeFiber<E, A> extends CommonFiber<E, A> {
  _tag: "RuntimeFiber";
  /**
   * Evaluates the specified effect on the fiber. If this is not possible,
   * because the fiber has already ended life, then the specified alternate
   * effect will be executed instead.
   */
  readonly evalOn: (effect: UIO<any>, orElse: UIO<any>) => UIO<void>;
  /**
   * The identity of the fiber.
   */
  readonly id: FiberId;

  readonly scope: FiberScope;
  /**
   * The status of the fiber.
   */
  readonly status: UIO<FiberStatus>;
}

export interface SyntheticFiber<E, A> extends CommonFiber<E, A> {
  readonly _tag: "SyntheticFiber";
}

/**
 * @tsplus type fncts.io.Fiber
 */
export type Fiber<E, A> = RuntimeFiber<E, A> | SyntheticFiber<E, A>;

/**
 * @tsplus type fncts.io.FiberOps
 */
export interface FiberOps {}

export const Fiber: FiberOps = {};

export declare namespace Fiber {
  export type Runtime<E, A> = RuntimeFiber<E, A>;
  export type Synthetic<E, A> = SyntheticFiber<E, A>;
}