import type { Sink as Sink_, UnsafeSink, UnsafeSink as UnsafeSink_ } from "./Sink.js";
import type { FlattenStrategy } from "@fncts/io/Push/FlattenStrategy";
import type { IOProducer } from "@fncts/io/Push/Producer/IOProducer";

import { type SyncProducer } from "@fncts/io/Push/Producer/SyncProducer";

import { Sink } from "./Sink.js";

export const PushVariance = Symbol.for("fncts.io.Push.Variance");
export type PushVariance = typeof PushVariance;

export const PushTypeId = Symbol.for("fncts.io.Push");
export type PushTypeId = typeof PushTypeId;

export const enum PushTag {
  Defer,
  ProducerSync,
  ProducerIO,
  FailCause,
  OnSuccess,
  OnSuccessWithStrategy,
  OnSuccessAndFailure,
  External,
  FromPush,
  Transform,
}

/**
 * @tsplus type fncts.io.Push
 * @tsplus companion fncts.io.PushOps
 */
export abstract class Push<R, E, A> {
  readonly [PushTypeId]: PushTypeId    = PushTypeId;
  readonly _pushOpCode: PushTag | null = null;

  declare [PushVariance]: {
    readonly _R: (_: never) => R;
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };

  constructor() {
    this.run = this.run.bind(this);
  }

  run<R1>(sink: UnsafeSink<R1, E, A>): IO<R | R1, never, void> {
    return this.unsafeRun(sink);
  }
}

export declare namespace Push {
  export type Run<R, E, A> = <R1>(emitter: UnsafeSink<R1, E, A>) => IO<R | R1, never, unknown>;
  export type EnvironmentOf<X> = [X] extends [{ [PushVariance]: { readonly _R: (_: never) => infer R } }] ? R : never;
  export type ErrorOf<X> = [X] extends [{ [PushVariance]: { readonly _E: (_: never) => infer E } }] ? E : never;
  export type ValueOf<X> = [X] extends [{ [PushVariance]: { readonly _A: (_: never) => infer A } }] ? A : never;
  export type Sink<Env, R, E, A> = Sink_<Env, R, E, A>;
  export type UnsafeSink<R, E, A> = UnsafeSink_<R, E, A>;
}

/**
 * @tsplus pipeable fncts.io.Push unsafeRun
 */
export function unsafeRun<E, A, R1>(sink: UnsafeSink<R1, E, A>) {
  return <R>(push: Push<R, E, A>): IO<R | R1, never, void> => unsafeRunPush(push, sink);
}

export type PushOp<Tag extends string | number | null, Body = {}> = Push<never, any, any> &
  Body & {
    readonly _pushOpCode: Tag;
  };

export class PushPrimitive extends Push<never, any, any> {
  public i0: any                   = undefined;
  public i1: any                   = undefined;
  public i2: any                   = undefined;
  public i3: any                   = undefined;
  public i4: any                   = undefined;
  public trace: string | undefined = undefined;
  constructor(readonly _pushOpCode: PushTag | null) {
    super();
  }
}

export interface Base<R = never, E = any, A = any>
  extends PushOp<
    null,
    {
      readonly run: Push.Run<R, E, A>;
    }
  > {}

export interface Defer
  extends PushOp<
    PushTag.Defer,
    {
      readonly i0: () => Primitive;
    }
  > {}

export interface FromPush<R = never, E = any, A = any>
  extends PushOp<
    PushTag.FromPush,
    {
      readonly i0: Push.Run<R, E, A>;
    }
  > {}

export interface ProducerSync<A = any>
  extends PushOp<
    PushTag.ProducerSync,
    {
      readonly i0: SyncProducer<A>;
    }
  > {}

export interface ProducerIO<R = never, E = any, A = any>
  extends PushOp<
    PushTag.ProducerIO,
    {
      readonly i0: IOProducer<R, E, A>;
    }
  > {}

export interface Fail<E = any>
  extends PushOp<
    PushTag.FailCause,
    {
      readonly i0: () => Cause<E>;
    }
  > {}

export interface OnSuccess<A = any>
  extends PushOp<
    PushTag.OnSuccess,
    {
      readonly i0: Primitive;
      readonly i1: (a: A) => Primitive;
    }
  > {}

export interface OnSuccessWithStrategy<A = any>
  extends PushOp<
    PushTag.OnSuccessWithStrategy,
    {
      readonly i0: Primitive;
      readonly i1: (a: A) => Primitive;
      readonly i2: FlattenStrategy;
      readonly i3: ExecutionStrategy;
    }
  > {}

export interface OnSuccessAndFailure<E = any, A = any>
  extends PushOp<
    PushTag.OnSuccessAndFailure,
    {
      readonly i0: Primitive;
      readonly i1: (cause: Cause<E>) => Primitive;
      readonly i2: (a: A) => Primitive;
      readonly i3: FlattenStrategy;
      readonly i4: ExecutionStrategy;
    }
  > {}

export interface Transform
  extends PushOp<
    PushTag.Transform,
    {
      i0: Primitive;
      i1: (io: IO<any, any, any>) => IO<any, never, void>;
    }
  > {}

type Primitive =
  | Base
  | ProducerSync
  | ProducerIO
  | Fail
  | OnSuccess
  | OnSuccessWithStrategy
  | OnSuccessAndFailure
  | FromPush
  | Defer
  | Transform;

export function concrete(push: Push<any, any, any>): asserts push is Primitive {
  //
}

export function unsafeRunPush(push: Push<any, any, any>, sink: UnsafeSink<any, any, any>): IO<any, never, void> {
  concrete(push);
  switch (push._pushOpCode) {
    case PushTag.Defer: {
      return IO.defer(push.i0().unsafeRun(sink));
    }
    case PushTag.ProducerSync: {
      return push.i0.runSink(sink);
    }
    case PushTag.ProducerIO: {
      return push.i0.runSink(sink);
    }
    case PushTag.FailCause: {
      return sink.onFailure(push.i0());
    }
    case PushTag.OnSuccessWithStrategy: {
      return push.i2.withFork(
        (fork) =>
          push.i0.unsafeRun(
            Sink.unsafeMake(
              (value) => fork(push.i1(value).unsafeRun(sink)),
              (cause) => sink.onFailure(cause),
            ),
          ),
        push.i3,
      );
    }
    case PushTag.OnSuccess: {
      return push.i0.unsafeRun(
        Sink.unsafeMake(
          (value) => push.i1(value).unsafeRun(sink),
          (cause) => sink.onFailure(cause),
        ),
      );
    }
    case PushTag.OnSuccessAndFailure: {
      return push.i3.withFork(
        (fork) =>
          push.i0.unsafeRun(
            Sink.unsafeMake(
              (value) => fork(push.i2(value).unsafeRun(sink)),
              (cause) => fork(push.i1(cause).unsafeRun(sink)),
            ),
          ),
        push.i4,
      );
    }
    case PushTag.FromPush: {
      return IO.environmentWith((environment) => push.i0(sink).provideSomeEnvironment(environment));
    }
    case PushTag.Transform: {
      return IO.defer(push.i1(push.i0.unsafeRun(sink)));
    }
    case null: {
      return push.run(sink);
    }
  }
}
