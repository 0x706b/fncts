import type { Exit } from "../../data/Exit";
import type { FiberId } from "../../data/FiberId";
import type { FiberStatus } from "../../data/FiberStatus";
import type { Maybe } from "../../data/Maybe";
import type { FiberRef } from "../FiberRef";
import type { UIO } from "../IO";
import type { Scope } from "../Scope";

export interface CommonFiber<E, A> {
  /**
   * Awaits the fiber, which suspends the awaiting fiber until the result of the
   * fiber has been determined.
   */
  readonly await: UIO<Exit<E, A>>;
  /**
   * Gets the value of the fiber ref for this fiber, or the initial value of
   * the fiber ref, if the fiber is not storing the ref.
   */
  readonly getRef: <A>(fiberRef: FiberRef.Runtime<A>) => UIO<A>;
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

  readonly scope: Scope;
  /**
   * The status of the fiber.
   */
  readonly status: UIO<FiberStatus>;
}

export interface SyntheticFiber<E, A> extends CommonFiber<E, A> {
  readonly _tag: "SyntheticFiber";
}

/**
 * @tsplus type fncts.control.Fiber
 */
export type Fiber<E, A> = RuntimeFiber<E, A> | SyntheticFiber<E, A>;

/**
 * @tsplus type fncts.control.FiberOps
 */
export interface FiberOps {}

export const Fiber: FiberOps = {};

export declare namespace Fiber {
  export type Runtime<E, A> = RuntimeFiber<E, A>;
  export type Synthetic<E, A> = SyntheticFiber<E, A>;
}
