import type { Cause } from "../../data/Cause";
import type { Either } from "../../data/Either";
import type { Exit } from "../../data/Exit/definition";
import type { FiberDescriptor } from "../../data/FiberDescriptor";
import type { FiberId } from "../../data/FiberId";
import type { Lazy } from "../../data/function";
import type { InterruptStatus } from "../../data/InterruptStatus";
import type { Maybe } from "../../data/Maybe";
import type { RuntimeConfig } from "../../data/RuntimeConfig";
import type { Trace as Trace_ } from "../../data/Trace";
import type { Fiber } from "../Fiber";
import type { FiberContext } from "../Fiber/FiberContext";
import type { FiberRef } from "../FiberRef";
import type { Scope } from "../Scope";
import type { Supervisor } from "../Supervisor";

import { hasTypeId } from "../../util/predicates";

export const IOTypeId = Symbol.for("fncts.control.IO");
export type IOTypeId = typeof IOTypeId;

export type IOId = "IO";

/**
 * @tsplus type fncts.control.IO
 * @tsplus companion fncts.control.IOOps
 */
export abstract class IO<R, E, A> {
  readonly _typeId: IOTypeId = IOTypeId;
  readonly _U!: IOId;
  readonly _R!: (_: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => A;
}

/**
 * @tsplus unify fncts.control.IO
 */
export function unifyIO<X extends IO<any, any, any>>(
  self: X
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
  Asks = "Asks",
  Provide = "Provide",
  Race = "Race",
  SetInterrupt = "SetInterrupt",
  GetInterrupt = "GetInterrupt",
  GetDescriptor = "GetDescriptor",
  Supervise = "Supervise",
  FiberRefGetAll = "FiberRefGetAll",
  FiberRefModify = "FiberRefModify",
  FiberRefLocally = "FiberRefLocally",
  FiberRefDelete = "FiberRefDelete",
  FiberRefWith = "FiberRefWith",
  GetForkScope = "GetForkScope",
  OverrideForkScope = "OverrideForkScope",
  Trace = "Trace",
  GetRuntimeConfig = "GetRuntimeConfig",
  Ensuring = "Ensuring",
}

export function isIO(u: unknown): u is IO<any, any, any> {
  return hasTypeId(u, IOTypeId);
}

/**
 * @internal
 */
export class Chain<R, R1, E, E1, A, A1> extends IO<R & R1, E | E1, A1> {
  readonly _tag = IOTag.Chain;
  constructor(
    readonly io: IO<R, E, A>,
    readonly f: (a: A) => IO<R1, E1, A1>,
    readonly trace?: string
  ) {
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
  constructor(
    readonly effect: (runtimeConfig: RuntimeConfig, fiberId: FiberId) => A,
    readonly trace?: string
  ) {
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
    readonly register: (
      f: (_: IO<R, E, A>) => void
    ) => Either<Canceler<R1>, IO<R, E, A>>,
    readonly blockingOn: FiberId,
    readonly trace?: string
  ) {
    super();
  }
}

/**
 * @internal
 */
export class Match<R, E, A, R1, E1, B, R2, E2, C> extends IO<
  R & R1 & R2,
  E1 | E2,
  B | C
> {
  readonly _tag = IOTag.Match;

  constructor(
    readonly io: IO<R, E, A>,
    readonly onFailure: (cause: Cause<E>) => IO<R1, E1, B>,
    readonly apply: (a: A) => IO<R2, E2, C>,
    readonly trace?: string
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

  constructor(
    readonly io: IO<R, E, A>,
    readonly scope: Maybe<Scope>,
    readonly trace?: string
  ) {
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
export class Asks<R0, R, E, A> extends IO<R & R0, E, A> {
  readonly _tag = IOTag.Asks;

  constructor(readonly f: (_: R0) => IO<R, E, A>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class Give<R, E, A> extends IO<unknown, E, A> {
  readonly _tag = IOTag.Provide;

  constructor(
    readonly io: IO<R, E, A>,
    readonly env: R,
    readonly trace?: string
  ) {
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

  constructor(
    readonly make: (runtimeConfig: RuntimeConfig, id: FiberId) => IO<R, E, A>,
    readonly trace?: string
  ) {
    super();
  }
}

/**
 * @internal
 */
export class Race<R, E, A, R1, E1, A1, R2, E2, A2, R3, E3, A3> extends IO<
  R & R1 & R2 & R3,
  E2 | E3,
  A2 | A3
> {
  readonly _tag = "Race";

  constructor(
    readonly left: IO<R, E, A>,
    readonly right: IO<R1, E1, A1>,
    readonly leftWins: (
      exit: Exit<E, A>,
      fiber: Fiber<E1, A1>
    ) => IO<R2, E2, A2>,
    readonly rightWins: (
      exit: Exit<E1, A1>,
      fiber: Fiber<E, A>
    ) => IO<R3, E3, A3>,
    readonly scope: Maybe<Scope>,
    readonly trace?: string
  ) {
    super();
  }
}

/**
 * @internal
 */
export class SetInterrupt<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.SetInterrupt;

  constructor(
    readonly io: IO<R, E, A>,
    readonly flag: InterruptStatus,
    readonly trace?: string
  ) {
    super();
  }
}

/**
 * @internal
 */
export class GetInterrupt<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.GetInterrupt;

  constructor(
    readonly f: (_: InterruptStatus) => IO<R, E, A>,
    readonly trace?: string
  ) {
    super();
  }
}

/**
 * @internal
 */
export class GetDescriptor<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.GetDescriptor;

  constructor(
    readonly f: (_: FiberDescriptor) => IO<R, E, A>,
    readonly trace?: string
  ) {
    super();
  }
}

/**
 * @internal
 */
export class Supervise<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.Supervise;

  constructor(
    readonly io: IO<R, E, A>,
    readonly supervisor: Supervisor<any>,
    readonly trace?: string
  ) {
    super();
  }
}

/**
 * @internal
 */
export class FiberRefGetAll<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.FiberRefGetAll;

  constructor(
    readonly make: (refs: Map<FiberRef.Runtime<unknown>, any>) => IO<R, E, A>,
    readonly trace?: string
  ) {
    super();
  }
}

/**
 * @internal
 */
export class FiberRefModify<A, B> extends IO<unknown, never, B> {
  readonly _tag = IOTag.FiberRefModify;

  constructor(
    readonly fiberRef: FiberRef.Runtime<A>,
    readonly f: (a: A) => readonly [B, A],
    readonly trace?: string
  ) {
    super();
  }
}

export class FiberRefLocally<V, R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.FiberRefLocally;
  constructor(
    readonly localValue: V,
    readonly fiberRef: FiberRef.Runtime<V>,
    readonly io: IO<R, E, A>,
    readonly trace?: string
  ) {
    super();
  }
}

export class FiberRefDelete extends IO<unknown, never, void> {
  readonly _tag = IOTag.FiberRefDelete;
  constructor(
    readonly fiberRef: FiberRef.Runtime<any>,
    readonly trace?: string
  ) {
    super();
  }
}

export class FiberRefWith<R, E, A, B> extends IO<R, E, B> {
  readonly _tag = IOTag.FiberRefWith;
  constructor(
    readonly fiberRef: FiberRef.Runtime<A>,
    readonly f: (a: A) => IO<R, E, B>,
    readonly trace?: string
  ) {
    super();
  }
}

/**
 * @internal
 */
export class GetForkScope<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.GetForkScope;

  constructor(readonly f: (_: Scope) => IO<R, E, A>, readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class OverrideForkScope<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.OverrideForkScope;

  constructor(
    readonly io: IO<R, E, A>,
    readonly forkScope: Maybe<Scope>,
    readonly trace?: string
  ) {
    super();
  }
}

export class GetRuntimeConfig<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.GetRuntimeConfig;

  constructor(
    readonly f: (_: RuntimeConfig) => IO<R, E, A>,
    readonly trace?: string
  ) {
    super();
  }
}

export class Ensuring<R, E, A, R1> extends IO<R & R1, E, A> {
  readonly _tag = IOTag.Ensuring;
  constructor(
    readonly io: IO<R, E, A>,
    readonly finalizer: IO<R1, never, any>,
    readonly trace?: string
  ) {
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
  | Asks<any, any, any, any>
  | Give<any, any, any>
  | Defer<any, any, any>
  | DeferWith<any, any, any>
  | FiberRefGetAll<any, any, any>
  | FiberRefModify<any, any>
  | FiberRefLocally<any, any, any, any>
  | FiberRefDelete
  | FiberRefWith<any, any, any, any>
  | Race<any, any, any, any, any, any, any, any, any, any, any, any>
  | Supervise<any, any, any>
  | GetForkScope<any, any, any>
  | OverrideForkScope<any, any, any>
  | Trace
  | GetRuntimeConfig<any, any, any>
  | Ensuring<any, any, any, any>;

/**
 * @optimize identity
 */
export function concrete(_: IO<any, any, any>): Instruction {
  // @ts-expect-error
  return _;
}

export type Canceler<R> = URIO<R, void>;

export const IOErrorTypeId = Symbol.for("fncts.control.IO.IOError");
export type IOErrorTypeId = typeof IOErrorTypeId;

export class IOError<E, A> {
  readonly _typeId: IOErrorTypeId = IOErrorTypeId;
  constructor(readonly exit: Exit<E, A>) {}
}

export function isIOError(u: unknown): u is IOError<unknown, unknown> {
  return hasTypeId(u, IOErrorTypeId);
}
