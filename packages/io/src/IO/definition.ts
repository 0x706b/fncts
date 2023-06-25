import type { FiberRuntime } from "../Fiber/FiberRuntime.js";
import type { Running } from "../FiberStatus.js";
import type { RuntimeFlagsPatch } from "../RuntimeFlags.js";
import type { RuntimeFlags } from "../RuntimeFlags.js";
import type { Left, Right } from "@fncts/base/data/Either";
import type { Failure, Success } from "@fncts/base/data/Exit";

export const IOVariance = Symbol.for("fncts.io.IO.Variance");
export type IOVariance = typeof IOVariance;

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
  readonly [IOTypeId]: IOTypeId = IOTypeId;
  declare [IOVariance]: {
    _R: () => R;
    _E: () => E;
    _A: () => A;
  };
}

export declare namespace IO {
  export type EnvironmentOf<T> = [T] extends [{ [IOVariance]: { _R: () => infer R } }] ? R : never;
  export type ErrorOf<T> = [T] extends [{ [IOVariance]: { _E: () => infer E } }] ? E : never;
  export type ValueOf<T> = [T] extends [{ [IOVariance]: { _A: () => infer A } }] ? A : never;
}

declare module "@fncts/base/data/Either/definition" {
  interface Either<E, A> extends IO<never, E, A> {}
}
declare module "@fncts/base/data/Maybe/definition" {
  interface Maybe<A> extends IO<never, NoSuchElementError, A> {}
}
declare module "@fncts/base/data/Exit/definition" {
  interface Success<A> extends IO<never, never, A> {}
  interface Failure<E> extends IO<never, E, never> {}
}

declare module "@fncts/base/data/Tag/definition" {
  interface Tag<T, Identifier = T> extends IO<never, never, T> {}
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
  [X] extends [{ [IOVariance]: { _R: () => infer R } }] ? R : never,
  [X] extends [{ [IOVariance]: { _E: () => infer E } }] ? E : never,
  [X] extends [{ [IOVariance]: { _A: () => infer A } }] ? A : never
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
  Commit,
  RevertFlags,
  UpdateTrace,
}

export type IOOp<Tag extends string | number, Body = {}> = IO<never, never, never> &
  Body & {
    readonly _tag: Tag;
  };

export class IOPrimitive {
  public i0: any                   = undefined;
  public i1: any                   = undefined;
  public i2: any                   = undefined;
  public trace: string | undefined = undefined;
  [IOTypeId] = IOTypeId;
  constructor(readonly _tag: Primitive["_tag"]) {}
}

export function isIO(u: unknown): u is IO<any, any, any> {
  return isObject(u) && IOTypeId in u;
}

export interface Sync<A = any>
  extends IOOp<
    IOTag.Sync,
    {
      readonly i0: () => A;
      readonly trace: string | undefined;
    }
  > {}

export interface Async<R = any, E = any, A = any>
  extends IOOp<
    IOTag.Async,
    {
      readonly i0: (resume: (io: Primitive) => void) => void;
      readonly i1: () => FiberId;
      readonly trace: string | undefined;
    }
  > {}

export interface OnSuccessAndFailure
  extends IOOp<
    IOTag.OnSuccessAndFailure,
    {
      readonly i0: Primitive;
      readonly i1: (cause: Cause<unknown>) => Primitive;
      readonly i2: (a: unknown) => Primitive;
      readonly trace: string | undefined;
    }
  > {}

export interface OnFailure
  extends IOOp<
    IOTag.OnFailure,
    {
      readonly i0: Primitive;
      readonly i1: (cause: Cause<unknown>) => Primitive;
      readonly trace: string | undefined;
    }
  > {}

export interface OnSuccess
  extends IOOp<
    IOTag.OnSuccess,
    {
      readonly i0: Primitive;
      readonly i1: (a: unknown) => Primitive;
      readonly trace: string | undefined;
    }
  > {}

export interface SucceedNow
  extends IOOp<
    IOTag.SucceedNow,
    {
      readonly i0: any;
      readonly trace: string | undefined;
    }
  > {}

export interface UpdateRuntimeFlags
  extends IOOp<
    IOTag.UpdateRuntimeFlags,
    {
      readonly i0: RuntimeFlags.Patch;
      readonly trace: string | undefined;
    }
  > {}

export interface UpdateRuntimeFlagsWithin
  extends IOOp<
    IOTag.UpdateRuntimeFlagsWithin,
    {
      readonly i0: RuntimeFlagsPatch;
      readonly i1: (oldRuntimeFlags: RuntimeFlags) => Primitive;
      readonly trace: string | undefined;
    }
  > {}

export interface GenerateStackTrace
  extends IOOp<
    IOTag.GenerateStackTrace,
    {
      readonly trace: string | undefined;
    }
  > {}

export interface Stateful
  extends IOOp<
    IOTag.Stateful,
    {
      readonly i0: (fiber: FiberRuntime<any, any>, status: Running) => Primitive;
      readonly trace: string | undefined;
    }
  > {}

export interface WhileLoop
  extends IOOp<
    IOTag.WhileLoop,
    {
      readonly i0: () => boolean;
      readonly i1: () => Primitive;
      readonly i2: (a: any) => any;
      readonly trace: string | undefined;
    }
  > {}

export interface YieldNow
  extends IOOp<
    IOTag.YieldNow,
    {
      readonly trace: string | undefined;
    }
  > {}

export interface Fail
  extends IOOp<
    IOTag.Fail,
    {
      readonly i0: () => Cause<unknown>;
      readonly trace: string | undefined;
    }
  > {}

export type Primitive =
  | OnSuccessAndFailure
  | OnFailure
  | OnSuccess
  | UpdateRuntimeFlagsWithin
  | Sync
  | Async
  | SucceedNow
  | UpdateRuntimeFlags
  | GenerateStackTrace
  | Stateful
  | WhileLoop
  | YieldNow
  | Fail
  | STM<any, any, any>
  | Left<any>
  | Right<any>
  | Nothing
  | Just<any>
  | Failure<any>
  | Success<any>
  | Tag<any>;

/**
 * @tsplus static fncts.io.IOOps concrete
 * @tsplus macro identity
 */
export function concrete(io: IO<any, any, any>): Primitive {
  return io as Primitive;
}

export type EvaluationStep = OnSuccessAndFailure | OnFailure | OnSuccess;

export type Canceler<R> = URIO<R, void>;
