import type { ChildExecutorDecision } from "./ChildExecutorDecision.js";
import type { AsyncInputProducer } from "./internal/AsyncInputProducer.js";
import type { UpstreamPullRequest } from "./UpstreamPullRequest.js";
import type { UpstreamPullStrategy } from "./UpstreamPullStrategy.js";

export const enum ChannelTag {
  PipeTo,
  ContinuationK,
  ContinuationFinalizer,
  Fold,
  Bridge,
  Read,
  Done,
  Halt,
  FromIO,
  Emit,
  Defer,
  Ensuring,
  ConcatAll,
  BracketOut,
  Provide,
}

export const ChannelVariance = Symbol.for("fncts.io.Channel.Variance");
export type ChannelVariance = typeof ChannelVariance;

export const ChannelTypeId = Symbol.for("fncts.io.Channel");
export type ChannelTypeId = typeof ChannelTypeId;

/**
 * @tsplus type fncts.io.Channel
 * @tsplus companion fncts.io.ChannelOps
 */
export abstract class Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  readonly [ChannelTypeId]: ChannelTypeId = ChannelTypeId;
  declare [ChannelVariance]: {
    _Env: () => Env;
    _InErr: (_: InErr) => void;
    _InElem: (_: InElem) => void;
    _InDone: (_: InDone) => void;
    _OutErr: () => OutErr;
    _OutElem: () => OutElem;
    _OutDone: () => OutDone;
  };
}

/**
 * @tsplus unify fncts.io.Channel
 */
export function unifyChannel<X extends Channel<any, any, any, any, any, any, any>>(
  _: X,
): Channel<
  [X] extends [
    {
      [ChannelVariance]: {
        _Env: () => infer Env;
      };
    },
  ]
    ? Env
    : never,
  [X] extends [
    {
      [ChannelVariance]: {
        _InErr: (_: infer InErr) => void;
      };
    },
  ]
    ? InErr
    : never,
  [X] extends [
    {
      [ChannelVariance]: {
        _InElem: (_: infer InElem) => void;
      };
    },
  ]
    ? InElem
    : never,
  [X] extends [
    {
      [ChannelVariance]: {
        _InDone: (_: infer InDone) => void;
      };
    },
  ]
    ? InDone
    : never,
  [X] extends [
    {
      [ChannelVariance]: {
        _OutErr: () => infer OutErr;
      };
    },
  ]
    ? OutErr
    : never,
  [X] extends [
    {
      [ChannelVariance]: {
        _OutElem: () => infer OutElem;
      };
    },
  ]
    ? OutElem
    : never,
  [X] extends [
    {
      [ChannelVariance]: {
        _OutDone: () => infer OutDone;
      };
    },
  ]
    ? OutDone
    : never
> {
  return _;
}

export type ChannelOp<Tag extends string | number, Body = {}> = Channel<
  any,
  unknown,
  unknown,
  unknown,
  never,
  never,
  never
> &
  Body & {
    readonly _tag: Tag;
  };

export class ChannelPrimitive {
  public i0: any                   = undefined;
  public i1: any                   = undefined;
  public i2: any                   = undefined;
  public i3: any                   = undefined;
  public i4: any                   = undefined;
  public i5: any                   = undefined;
  public trace: string | undefined = undefined;
  [ChannelTypeId]                  = ChannelTypeId;
  constructor(readonly _tag: Primitive["_tag"] | ContinuationPrimitive["_tag"]) {}
}

export abstract class Continuation<Env, InErr, InElem, InDone, OutErr, OutErr2, OutElem, OutDone, OutDone2> {
  readonly _Env!: () => Env;
  readonly _InErr!: (_: InErr) => void;
  readonly _InElem!: (_: InElem) => void;
  readonly _InDone!: (_: InDone) => void;
  readonly _OutErr!: (_: OutErr) => OutErr;
  readonly _OutErr2!: () => OutErr2;
  readonly _OutElem!: () => OutElem;
  readonly _OutDone!: (_: OutDone) => OutDone;
  readonly _OutDone2!: () => OutDone2;
}

export type ChannelContinuationOp<Tag extends string | number, Body = {}> = Continuation<
  never,
  unknown,
  unknown,
  unknown,
  any,
  never,
  never,
  any,
  never
> &
  Body & {
    readonly _tag: Tag;
  };

export interface ContinuationK
  extends ChannelContinuationOp<
    ChannelTag.ContinuationK,
    {
      readonly i0: (_: any) => Primitive;
      readonly i1: (_: Cause<any>) => Primitive;
    }
  > {}

export interface ContinuationFinalizer
  extends ChannelContinuationOp<
    ChannelTag.ContinuationFinalizer,
    {
      readonly i0: (_: Exit<any, any>) => URIO<any, any>;
    }
  > {}

export type ContinuationPrimitive = ContinuationK | ContinuationFinalizer;

/**
 * @optimize remove
 */
export function concreteContinuation<Env, InErr, InElem, InDone, OutErr, OutErr2, OutElem, OutDone, OutDone2>(
  _: Continuation<Env, InErr, InElem, InDone, OutErr, OutErr2, OutElem, OutDone, OutDone2>,
): asserts _ is ContinuationK | ContinuationFinalizer {
  //
}

export interface PipeTo
  extends ChannelOp<
    ChannelTag.PipeTo,
    {
      readonly i0: () => Primitive;
      readonly i1: () => Primitive;
    }
  > {}

export interface Fold
  extends ChannelOp<
    ChannelTag.Fold,
    {
      readonly i0: Primitive;
      readonly i1: ContinuationK;
    }
  > {}

export interface Read
  extends ChannelOp<
    ChannelTag.Read,
    {
      readonly i0: (_: any) => Primitive;
      readonly i1: ContinuationK;
    }
  > {}

export interface Done
  extends ChannelOp<
    ChannelTag.Done,
    {
      readonly i0: () => any;
    }
  > {}

export interface Fail
  extends ChannelOp<
    ChannelTag.Halt,
    {
      readonly i0: () => Cause<any>;
    }
  > {}

export interface FromIO
  extends ChannelOp<
    ChannelTag.FromIO,
    {
      readonly i0: IO<any, any, any>;
    }
  > {}

export interface Defer
  extends ChannelOp<
    ChannelTag.Defer,
    {
      readonly i0: () => Primitive;
    }
  > {}

export interface Ensuring
  extends ChannelOp<
    ChannelTag.Ensuring,
    {
      readonly i0: Primitive;
      readonly i1: (_: Exit<any, any>) => URIO<any, any>;
    }
  > {}

export interface ConcatAll
  extends ChannelOp<
    ChannelTag.ConcatAll,
    {
      readonly i0: (_: any, __: any) => any;
      readonly i1: (_: any, __: any) => any;
      readonly i2: (_: UpstreamPullRequest<any>) => UpstreamPullStrategy<any>;
      readonly i3: (_: any) => ChildExecutorDecision;
      readonly i4: Primitive;
      readonly i5: (_: any) => Primitive;
    }
  > {}

export interface BracketOut
  extends ChannelOp<
    ChannelTag.BracketOut,
    {
      readonly i0: IO<any, any, any>;
      readonly i1: (_: any, __: Exit<any, any>) => URIO<any, any>;
    }
  > {}

export interface Provide
  extends ChannelOp<
    ChannelTag.Provide,
    {
      readonly i0: Environment<any>;
      readonly i1: Primitive;
    }
  > {}

export interface Emit
  extends ChannelOp<
    ChannelTag.Emit,
    {
      readonly i0: () => any;
    }
  > {}

export interface Bridge
  extends ChannelOp<
    ChannelTag.Bridge,
    {
      readonly i0: AsyncInputProducer<any, any, any>;
      readonly i1: Primitive;
    }
  > {}

export type Primitive =
  | PipeTo
  | Read
  | Done
  | Fail
  | FromIO
  | Emit
  | ConcatAll
  | Bridge
  | Fold
  | Provide
  | BracketOut
  | Ensuring
  | Defer;

/**
 * @tsplus macro remove
 */
export function concrete<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  _: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): asserts _ is Primitive {
  //
}
