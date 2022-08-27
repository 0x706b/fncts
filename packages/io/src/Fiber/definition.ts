import type { FiberId } from "@fncts/base/data/FiberId";
import type { FiberStatus } from "@fncts/io/FiberStatus";
import type { UIO } from "@fncts/io/IO/definition";

export const FiberTypeId = Symbol.for("fncts.io.Fiber");
export type FiberTypeId = typeof FiberTypeId;

/**
 * @tsplus type fncts.io.Fiber
 */
export interface Fiber<E, A> {
  readonly _typeId: FiberTypeId;
  readonly _E: () => E;
  readonly _A: () => A;
}

/**
 * @tsplus type fncts.io.FiberOps
 */
export interface FiberOps {}

export const Fiber: FiberOps = {};

export declare namespace Fiber {
  export type Runtime<E, A> = RuntimeFiber<E, A>;
  export type Synthetic<E, A> = SyntheticFiber<E, A>;
}

export interface FiberCommon<E, A> extends Fiber<E, A> {
  readonly id: FiberId;

  /**
   * Awaits the fiber, which suspends the awaiting fiber until the result of the
   * fiber has been determined.
   */
  readonly await: UIO<Exit<E, A>>;

  /**
   * Inherits values from all {@link FiberRef} instances into current fiber.
   * This will resume immediately.
   */
  readonly inheritAll: UIO<void>;

  /**
   * Interrupts the fiber as if interrupted from the specified fiber. If the
   * fiber has already exited, the returned effect will resume immediately.
   * Otherwise, the effect will resume when the fiber exits.
   */
  readonly interruptAsFork: (fiberId: FiberId) => UIO<void>;

  /**
   * Tentatively observes the fiber, but returns immediately if it is not already done.
   */
  readonly poll: UIO<Maybe<Exit<E, A>>>;

  /**
   * Retrieves the immediate children of the fiber.
   */
  readonly children: UIO<Conc<Fiber.Runtime<any, any>>>;
}

export interface RuntimeFiber<E, A> extends FiberCommon<E, A> {
  readonly _tag: "RuntimeFiber";

  /**
   * The identity of the Fiber
   */
  readonly id: FiberId.Runtime;

  /**
   * The location the fiber was forked from
   */
  readonly location: TraceElement;

  /**
=======
>>>>>>> 1bb68eb (feat: FiberRuntime)
   * The status of the fiber.
   */
  readonly status: UIO<FiberStatus>;

  /**
   * The trace of the Fiber
   */
  readonly trace: UIO<Trace>;
}

export class SyntheticFiber<E, A> implements FiberCommon<E, A> {
  readonly _tag = "SyntheticFiber";

  readonly _typeId: FiberTypeId = FiberTypeId;
  readonly _E!: () => E;
  readonly _A!: () => A;
  readonly await;

  constructor(
    readonly id: FiberId,
    wait: UIO<Exit<E, A>>,
    readonly children: UIO<Conc<Fiber.Runtime<any, any>>>,
    readonly inheritAll: UIO<void>,
    readonly poll: UIO<Maybe<Exit<E, A>>>,
    readonly interruptAsFork: (fiberId: FiberId) => UIO<void>,
  ) {
    this.await = wait;
  }
}

export type ConcreteFiber<E, A> = Fiber.Runtime<E, A> | Fiber.Synthetic<E, A>;

/**
 * @tsplus fluent fncts.io.Fiber concrete
 * @tsplus macro remove
 */
export function concrete<E, A>(_fiber: Fiber<E, A>): asserts _fiber is ConcreteFiber<E, A> {
  //
}

export function isFiber(u: unknown): u is Fiber<unknown, unknown> {
  return hasTypeId(u, FiberTypeId);
}
