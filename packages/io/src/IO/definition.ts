import type { FiberRuntime } from "../Fiber/FiberRuntime.js";
import type { Running } from "../FiberStatus.js";
import type { RuntimeFlagsPatch } from "../RuntimeFlags.js";
import type { Trace } from "@fncts/base/data/Trace";

import { RuntimeFlag } from "../RuntimeFlag.js";
import { RuntimeFlags } from "../RuntimeFlags.js";

export const IOTypeId = Symbol.for("fncts.io.IO");
export type IOTypeId = typeof IOTypeId;

export interface IOF extends HKT {
  type: IO<this["R"], this["E"], this["A"]>;
  variance: {
    R: "+";
    E: "+";
    A: "+";
  };
}

/**
 * @tsplus type fncts.io.IO
 * @tsplus companion fncts.io.IOOps
 */
export abstract class IO<R, E, A> {
  readonly _typeId: IOTypeId = IOTypeId;
  declare _R: () => R;
  declare _E: () => E;
  declare _A: () => A;
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
  [X] extends [{ _R: () => infer R }] ? R : never,
  [X] extends [{ _E: () => infer E }] ? E : never,
  [X] extends [{ _A: () => infer A }] ? A : never
> {
  return self;
}

export type UIO<A> = IO<never, never, A>;

export type URIO<R, A> = IO<R, never, A>;

export type FIO<E, A> = IO<never, E, A>;

export const enum IOTag {
  SucceedNow,
  Fail,
  Sync,
  Async,
  OnSuccessAndFailure,
  OnSuccess,
  OnFailure,
  UpdateRuntimeFlags,
  UpdateRuntimeFlagsWithin,
  GenerateStackTrace,
  Stateful,
  WhileLoop,
  YieldNow,
}

export function isIO(u: unknown): u is IO<any, any, any> {
  return hasTypeId(u, IOTypeId);
}

export class Sync<A> extends IO<never, never, A> {
  readonly _tag = IOTag.Sync;
  constructor(readonly evaluate: () => A, readonly trace?: string) {
    super();
  }
}

export class Async<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.Async;
  constructor(
    readonly registerCallback: (f: (_: IO<R, E, A>) => void) => any,
    readonly blockingOn: () => FiberId,
    readonly trace?: string,
  ) {
    super();
  }
}

/**
 * @internal
 */
export class OnSuccessAndFailure<R, E, A, R1, E1, B, R2, E2, C> extends IO<R | R1 | R2, E1 | E2, B | C> {
  readonly _tag = IOTag.OnSuccessAndFailure;

  constructor(
    readonly first: IO<R, E, A>,
    readonly failureK: (cause: Cause<E>) => IO<R1, E1, B>,
    readonly successK: (a: A) => IO<R2, E2, C>,
    readonly trace?: string,
  ) {
    super();
  }

  onFailure(c: Cause<E>): IO<R | R1 | R2, E1 | E2, B | C> {
    return this.failureK(c);
  }
  onSuccess(a: A): IO<R | R1 | R2, E1 | E2, B | C> {
    return this.successK(a);
  }
}

export class OnFailure<R, E, A, R1, E1, B> extends IO<R | R1, E1, A | B> {
  readonly _tag = IOTag.OnFailure;
  constructor(
    readonly first: IO<R, E, A>,
    readonly failureK: (cause: Cause<E>) => IO<R1, E1, B>,
    readonly trace?: string,
  ) {
    super();
  }

  onFailure(c: Cause<E>): IO<R | R1, E1, A | B> {
    return this.failureK(c);
  }
  onSuccess(a: A): IO<R | R1, E1, A | B> {
    return new SucceedNow(a);
  }
}

/**
 * @internal
 */
export class OnSuccess<R, R1, E, E1, A, A1> extends IO<R | R1, E | E1, A1> {
  readonly _tag = IOTag.OnSuccess;
  constructor(readonly first: IO<R, E, A>, readonly successK: (a: A) => IO<R1, E1, A1>, readonly trace?: string) {
    super();
  }
  onFailure(c: Cause<E>): IO<R | R1, E | E1, A1> {
    return new Fail(c);
  }
  onSuccess(a: A): IO<R | R1, E | E1, A1> {
    return this.successK(a);
  }
}

/**
 * @internal
 */
export class SucceedNow<A> extends IO<never, never, A> {
  readonly _tag = IOTag.SucceedNow;
  constructor(readonly value: A, readonly trace?: string) {
    super();
  }
}

export class UpdateRuntimeFlags extends IO<never, never, void> {
  readonly _tag = IOTag.UpdateRuntimeFlags;
  constructor(readonly update: RuntimeFlags.Patch, readonly trace?: string) {
    super();
  }
}

export class Interruptible<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.UpdateRuntimeFlagsWithin;
  constructor(readonly effect: IO<R, E, A>, readonly trace?: string) {
    super();
  }

  readonly update: RuntimeFlags.Patch = RuntimeFlags.enable(RuntimeFlag.Interruption);
  scope(oldRuntimeFlags: RuntimeFlags): IO<R, E, A> {
    return this.effect;
  }
}

export class Uninterruptible<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.UpdateRuntimeFlagsWithin;
  constructor(readonly effect: IO<R, E, A>, readonly trace?: string) {
    super();
  }

  readonly update: RuntimeFlags.Patch = RuntimeFlags.disable(RuntimeFlag.Interruption);
  scope(oldRuntimeFlags: RuntimeFlags): IO<R, E, A> {
    return this.effect;
  }
}

export class Dynamic<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.UpdateRuntimeFlagsWithin;
  constructor(
    readonly update: RuntimeFlagsPatch,
    readonly f: (oldRuntimeFlags: RuntimeFlags) => IO<R, E, A>,
    readonly trace?: string,
  ) {
    super();
  }

  scope(oldRuntimeFlags: RuntimeFlags): IO<R, E, A> {
    return this.f(oldRuntimeFlags);
  }
}

export class GenerateStackTrace extends IO<never, never, Trace> {
  readonly _tag = IOTag.GenerateStackTrace;
  constructor(readonly trace?: string) {
    super();
  }
}

export class Stateful<R, E, A> extends IO<R, E, A> {
  readonly _tag = IOTag.Stateful;
  constructor(readonly onState: (fiber: FiberRuntime<E, A>, status: Running) => IO<R, E, A>, readonly trace?: string) {
    super();
  }
}

export class WhileLoop<R, E, A> extends IO<R, E, void> {
  readonly _tag = IOTag.WhileLoop;
  constructor(
    readonly check: () => boolean,
    readonly body: () => IO<R, E, A>,
    readonly process: (a: A) => any,
    readonly trace?: string,
  ) {
    super();
  }
}

export class YieldNow extends IO<never, never, void> {
  readonly _tag = IOTag.YieldNow;
  constructor(readonly trace?: string) {
    super();
  }
}

/**
 * @internal
 */
export class Fail<E> extends IO<never, E, never> {
  readonly _tag = IOTag.Fail;

  constructor(readonly cause: Lazy<Cause<E>>, readonly trace?: string) {
    super();
  }
}

export type Concrete =
  | OnSuccessAndFailure<any, any, any, any, any, any, any, any, any>
  | OnFailure<any, any, any, any, any, any>
  | OnSuccess<any, any, any, any, any, any>
  | UpdateRuntimeFlagsWithin
  | Sync<any>
  | Async<any, any, any>
  | SucceedNow<any>
  | UpdateRuntimeFlags
  | GenerateStackTrace
  | Stateful<any, any, any>
  | WhileLoop<any, any, any>
  | YieldNow
  | Fail<any>;

/**
 * @tsplus static fncts.io.IOOps concrete
 * @tsplus macro identity
 */
export function concrete(io: IO<any, any, any>): Concrete {
  return io as Concrete;
}

export type EvaluationStep =
  | OnSuccessAndFailure<any, any, any, any, any, any, any, any, any>
  | OnFailure<any, any, any, any, any, any>
  | OnSuccess<any, any, any, any, any, any>;

export type UpdateRuntimeFlagsWithin =
  | Interruptible<any, any, any>
  | Uninterruptible<any, any, any>
  | Dynamic<any, any, any>;

export type Canceler<R> = URIO<R, void>;

export const IOErrorTypeId = Symbol.for("fncts.io.IO.IOError");
export type IOErrorTypeId = typeof IOErrorTypeId;

export class IOError<E> {
  readonly _typeId: IOErrorTypeId = IOErrorTypeId;
  constructor(readonly cause: Cause<E>) {}
}

export function isIOError(u: unknown): u is IOError<unknown> {
  return hasTypeId(u, IOErrorTypeId);
}
