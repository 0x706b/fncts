import type { Trace as Trace_ } from "@fncts/base/data/Trace";
import type { FiberContext } from "@fncts/io/Fiber/FiberContext";

export const IOTypeId = Symbol.for("fncts.io.IO");
export type IOTypeId = typeof IOTypeId;

/**
 * @tsplus type fncts.io.IO
 * @tsplus companion fncts.io.IOOps
 */
export abstract class IO<R, E, A> {
  readonly _typeId: IOTypeId = IOTypeId;
  readonly _R!: (_: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => A;
}

/**
 * @tsplus type fncts.io.IOAspects
 */
export interface IOAspects {}

/**
 * @tsplus static fncts.io.IOOps $
 */
export const IOAspects: IOAspects = {};

/**
 * @tsplus unify fncts.io.IO
 */
export function unifyIO<X extends IO<any, any, any>>(
  self: X,
): IO<
  [X] extends [IO<infer R, any, any>] ? R : never,
  [X] extends [IO<any, infer E, any>] ? E : never,
  [X] extends [IO<any, any, infer A>] ? A : never
> {
  return self;
}

export type UIO<A> = IO<unknown, never, A>;

export type URIO<R, A> = IO<R, never, A>;

export type FIO<E, A> = IO<unknown, E, A>;

export const enum IOTag {
  SucceedNow = "SucceedNow",
  Chain = "Chain",
  Defer = "Defer",
  DeferWith = "DeferWith",
  Succeed = "SucceedLazy",
  SucceedWith = "SucceedLazyWith",
  Async = "Async",
  Match = "Match",
  Fork = "Fork",
  Fail = "Fail",
  Yield = "Yield",
  Race = "Race",
  SetInterrupt = "SetInterrupt",
  GetInterrupt = "GetInterrupt",
  GetDescriptor = "GetDescriptor",
  Supervise = "Supervise",
  FiberRefModify = "FiberRefModify",
  FiberRefLocally = "FiberRefLocally",
  FiberRefDelete = "FiberRefDelete",
  FiberRefWith = "FiberRefWith",
  FiberRefModifyAll = "FiberRefModifyAll",
  GetForkScope = "GetForkScope",
  OverrideForkScope = "OverrideForkScope",
  Trace = "Trace",
  GetRuntimeConfig = "GetRuntimeConfig",
  Ensuring = "Ensuring",
  Logged = "Logged",
  SetRuntimeConfig = "SetRuntimeConfig",
}

export function isIO(u: unknown): u is IO<any, any, any> {
  return hasTypeId(u, IOTypeId);
}

/**
 * @internal
 */
export class Chain<R, R1, E, E1, A, A1> extends IO<R & R1, E | E1, A1> {
  readonly _tag = IOTag.Chain;
  constructor(readonly io: IO<R, E, A>, readonly f: (a: A) => IO<R1, E1, A1>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class SucceedNow<A> extends IO<unknown, never, A> {
  readonly _tag = IOTag.SucceedNow;
  constructor(readonly value: A, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class Succeed<A> extends IO<unknown, never, A> {
  readonly _tag = IOTag.Succeed;
  constructor(readonly effect: () => A, readonly trace?: string) {
    super();
  }
}

export class SucceedWith<A> extends IO<unknown, never, A> {
  readonly _tag = IOTag.SucceedWith;
  constructor(readonly effect: (runtimeConfig: RuntimeConfig, fiberId: FiberId) => A, readonly trace?: string) {
    super();
  }
}

export class Trace extends IO<unknown, never, Trace_> {
  readonly _tag = IOTag.Trace;
  constructor(readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class Async<R, E, A, R1> extends IO<R & R1, E, A> {
  readonly _tag = IOTag.Async;
  constructor(
    readonly register: (f: (_: IO<R, E, A>) => void) => Either<Canceler<R1>, IO<R, E, A>>,
    readonly blockingOn: FiberId,
    readonly trace?: string,
  ) {
    super();
  }
}

/**
 * @internal
 */
export class Match<R, E, A, R1, E1, B, R2, E2, C> extends IO<R & R1 & R2, E1 | E2, B | C> {
  readonly _tag = IOTag.Match;

  constructor(
    readonly io: IO<R, E, A>,
    readonly onFailure: (cause: Cause<E>) => IO<R1, E1, B>,
    readonly apply: (a: A) => IO<R2, E2, C>,
    readonly trace?: string,
  ) {
    super();
  }
}

export type FailureReporter = (e: Cause<unknown>) => void;

/**
 * @internal
 */
export class Fork<R, E, A> extends IO<R, never, FiberContext<E, A>> {
  readonly _tag = IOTag.Fork;

  constructor(readonly io: IO<R, E, A>, readonly scope: Maybe<FiberScope>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class Fail<E> extends IO<unknown, E, never> {
  readonly _tag = IOTag.Fail;

  constructor(readonly cause: Lazy<Cause<E>>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class Yield extends IO<unknown, never, void> {
  readonly _tag = IOTag.Yield;

  constructor(readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class Defer<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.Defer;

  constructor(readonly make: () => IO<R, E, A>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class DeferWith<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.DeferWith;

  constructor(readonly make: (runtimeConfig: RuntimeConfig, id: FiberId) => IO<R, E, A>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class Race<R, E, A, R1, E1, A1, R2, E2, A2, R3, E3, A3> extends IO<R & R1 & R2 & R3, E2 | E3, A2 | A3> {
  readonly _tag = "Race";

  constructor(
    readonly left: IO<R, E, A>,
    readonly right: IO<R1, E1, A1>,
    readonly leftWins: (exit: Fiber<E, A>, fiber: Fiber<E1, A1>) => IO<R2, E2, A2>,
    readonly rightWins: (exit: Fiber<E1, A1>, fiber: Fiber<E, A>) => IO<R3, E3, A3>,
    readonly trace?: string,
  ) {
    super();
  }
}

/**
 * @internal
 */
export class SetInterrupt<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.SetInterrupt;

  constructor(readonly io: IO<R, E, A>, readonly flag: InterruptStatus, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class GetInterrupt<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.GetInterrupt;

  constructor(readonly f: (_: InterruptStatus) => IO<R, E, A>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class GetDescriptor<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.GetDescriptor;

  constructor(readonly f: (_: FiberDescriptor) => IO<R, E, A>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class Supervise<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.Supervise;

  constructor(readonly io: IO<R, E, A>, readonly supervisor: Supervisor<any>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class FiberRefModify<A, B> extends IO<unknown, never, B> {
  readonly _tag = IOTag.FiberRefModify;

  constructor(readonly fiberRef: FiberRef<unknown>, readonly f: (a: A) => readonly [B, A], readonly trace?: string) {
    super();
  }
}

export class FiberRefLocally<V, R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.FiberRefLocally;
  constructor(
    readonly localValue: V,
    readonly fiberRef: FiberRef<V>,
    readonly io: IO<R, E, A>,
    readonly trace?: string,
  ) {
    super();
  }
}

export class FiberRefDelete extends IO<unknown, never, void> {
  readonly _tag = IOTag.FiberRefDelete;
  constructor(readonly fiberRef: FiberRef<unknown>, readonly trace?: string) {
    super();
  }
}

export class FiberRefWith<A, P, R, E, B> extends IO<R, E, B> {
  readonly _tag = IOTag.FiberRefWith;
  constructor(readonly fiberRef: FiberRef<A>, readonly f: (a: A) => IO<R, E, B>, readonly trace?: string) {
    super();
  }
}

export class FiberRefModifyAll<A> extends IO<unknown, never, A> {
  readonly _tag = IOTag.FiberRefModifyAll;
  constructor(
    readonly f: (fiberId: FiberId.Runtime, fiberRefs: FiberRefs) => readonly [A, FiberRefs],
    readonly trace?: string,
  ) {
    super();
  }
}

/**
 * @internal
 */
export class GetForkScope<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.GetForkScope;

  constructor(readonly f: (_: FiberScope) => IO<R, E, A>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class OverrideForkScope<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.OverrideForkScope;

  constructor(readonly io: IO<R, E, A>, readonly forkScope: Maybe<FiberScope>, readonly trace?: string) {
    super();
  }
}

export class GetRuntimeConfig<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.GetRuntimeConfig;

  constructor(readonly f: (_: RuntimeConfig) => IO<R, E, A>, readonly trace?: string) {
    super();
  }
}

export class Ensuring<R, E, A, R1> extends IO<R & R1, E, A> {
  readonly _tag = IOTag.Ensuring;
  constructor(readonly io: IO<R, E, A>, readonly finalizer: IO<R1, never, any>, readonly trace?: string) {
    super();
  }
}

export class Logged extends IO<unknown, never, void> {
  readonly _tag = IOTag.Logged;
  constructor(
    readonly message: () => string,
    readonly cause: Cause<any>,
    readonly overrideLogLevel: Maybe<LogLevel>,
    readonly trace?: string,
    readonly overrideRef1: FiberRef<unknown> | null = null,
    readonly overrideValue1: unknown | null = null,
  ) {
    super();
  }
}

export class SetRuntimeConfig extends IO<unknown, never, void> {
  readonly _tag = IOTag.SetRuntimeConfig;
  constructor(readonly runtimeConfig: RuntimeConfig, readonly trace?: string) {
    super();
  }
}

export type Instruction =
  | Chain<any, any, any, any, any, any>
  | SucceedNow<any>
  | Succeed<any>
  | SucceedWith<any>
  | Async<any, any, any, any>
  | Match<any, any, any, any, any, any, any, any, any>
  | Fork<any, any, any>
  | SetInterrupt<any, any, any>
  | GetInterrupt<any, any, any>
  | Fail<any>
  | GetDescriptor<any, any, any>
  | Yield
  | Defer<any, any, any>
  | DeferWith<any, any, any>
  | FiberRefModify<any, any>
  | FiberRefLocally<any, any, any, any>
  | FiberRefDelete
  | FiberRefWith<any, any, any, any, any>
  | FiberRefModifyAll<any>
  | Race<any, any, any, any, any, any, any, any, any, any, any, any>
  | Supervise<any, any, any>
  | GetForkScope<any, any, any>
  | OverrideForkScope<any, any, any>
  | Trace
  | GetRuntimeConfig<any, any, any>
  | Ensuring<any, any, any, any>
  | Logged
  | SetRuntimeConfig;

/**
 * @tsplus macro identity
 */
export function concrete(_: IO<any, any, any>): Instruction {
  // @ts-expect-error
  return _;
}

export type Canceler<R> = URIO<R, void>;

export const IOErrorTypeId = Symbol.for("fncts.io.IO.IOError");
export type IOErrorTypeId = typeof IOErrorTypeId;

export class IOError<E, A> {
  readonly _typeId: IOErrorTypeId = IOErrorTypeId;
  constructor(readonly exit: Exit<E, A>) {}
}

export function isIOError(u: unknown): u is IOError<unknown, unknown> {
  return hasTypeId(u, IOErrorTypeId);
}
