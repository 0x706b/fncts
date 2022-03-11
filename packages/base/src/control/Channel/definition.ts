import type { Cause } from "../../data/Cause";
import type { Exit } from "../../data/Exit";
import type { IO, URIO } from "../IO";
import type { ChildExecutorDecision } from "./ChildExecutorDecision";
import type { AsyncInputProducer } from "./internal/AsyncInputProducer";
import type { UpstreamPullRequest } from "./UpstreamPullRequest";
import type { UpstreamPullStrategy } from "./UpstreamPullStrategy";

export const enum ChannelTag {
  PipeTo = "PipeTo",
  ContinuationK = "ContinuationK",
  ContinuationFinalizer = "ContinuationFinalizer",
  Fold = "Fold",
  Bridge = "Bridge",
  Read = "Read",
  Done = "Done",
  Halt = "Halt",
  FromIO = "FromIO",
  Emit = "Emit",
  Defer = "Defer",
  Ensuring = "Ensuring",
  ConcatAll = "ConcatAll",
  BracketOut = "BracketOut",
  Provide = "Provide",
}

/**
 * @tsplus type fncts.control.Channel
 * @tsplus companion fncts.control.ChannelOps
 */
export abstract class Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  readonly _Env!: (_: Env) => void;
  readonly _InErr!: (_: InErr) => void;
  readonly _InElem!: (_: InElem) => void;
  readonly _InDone!: (_: InDone) => void;
  readonly _OutErr!: () => OutErr;
  readonly _OutElem!: () => OutElem;
  readonly _OutDone!: () => OutDone;
}

export abstract class Continuation<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutErr2,
  OutElem,
  OutDone,
  OutDone2,
> {
  readonly _Env!: (_: Env) => void;
  readonly _InErr!: (_: InErr) => void;
  readonly _InElem!: (_: InElem) => void;
  readonly _InDone!: (_: InDone) => void;
  readonly _OutErr!: (_: OutErr) => OutErr;
  readonly _OutErr2!: () => OutErr2;
  readonly _OutElem!: () => OutElem;
  readonly _OutDone!: (_: OutDone) => OutDone;
  readonly _OutDone2!: () => OutDone2;
}

export class ContinuationK<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutErr2,
  OutElem,
  OutDone,
  OutDone2,
> extends Continuation<Env, InErr, InElem, InDone, OutErr, OutErr2, OutElem, OutDone, OutDone2> {
  readonly _tag = ChannelTag.ContinuationK;
  constructor(
    readonly onSuccess: (
      _: OutDone,
    ) => Channel<Env, InErr, InElem, InDone, OutErr2, OutElem, OutDone2>,
    readonly onHalt: (
      _: Cause<OutErr>,
    ) => Channel<Env, InErr, InElem, InDone, OutErr2, OutElem, OutDone2>,
  ) {
    super();
  }

  onExit(
    exit: Exit<OutErr, OutDone>,
  ): Channel<Env, InErr, InElem, InDone, OutErr2, OutElem, OutDone2> {
    return exit.match(this.onHalt, this.onSuccess);
  }
}

export class ContinuationFinalizer<Env, OutErr, OutDone> extends Continuation<
  Env,
  unknown,
  unknown,
  unknown,
  OutErr,
  never,
  never,
  OutDone,
  never
> {
  readonly _tag = ChannelTag.ContinuationFinalizer;
  constructor(readonly finalizer: (_: Exit<OutErr, OutDone>) => URIO<Env, any>) {
    super();
  }
}

/**
 * @optimize remove
 */
export function concreteContinuation<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutErr2,
  OutElem,
  OutDone,
  OutDone2,
>(
  _: Continuation<Env, InErr, InElem, InDone, OutErr, OutErr2, OutElem, OutDone, OutDone2>,
): asserts _ is
  | ContinuationK<Env, InErr, InElem, InDone, OutErr, OutErr2, OutElem, OutDone, OutDone2>
  | ContinuationFinalizer<Env, OutErr, OutDone> {
  //
}

export class PipeTo<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutErr2,
  OutElem,
  OutElem2,
  OutDone,
  OutDone2,
> extends Channel<Env, InErr, InElem, InDone, OutErr2, OutElem2, OutDone2> {
  readonly _tag = ChannelTag.PipeTo;
  constructor(
    readonly left: () => Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
    readonly right: () => Channel<Env, OutErr, OutElem, OutDone, OutErr2, OutElem2, OutDone2>,
  ) {
    super();
  }
}

export class Fold<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutErr2,
  OutElem,
  OutDone,
  OutDone2,
> extends Channel<Env, InErr, InElem, InDone, OutErr2, OutElem, OutDone2> {
  readonly _tag = ChannelTag.Fold;
  constructor(
    readonly value: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
    readonly k: ContinuationK<
      Env,
      InErr,
      InElem,
      InDone,
      OutErr,
      OutErr2,
      OutElem,
      OutDone,
      OutDone2
    >,
  ) {
    super();
  }
}

export class Read<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutErr2,
  OutElem,
  OutDone,
  OutDone2,
> extends Channel<Env, InErr, InElem, InDone, OutErr2, OutElem, OutDone2> {
  readonly _tag = ChannelTag.Read;
  constructor(
    readonly more: (_: InElem) => Channel<Env, InErr, InElem, InDone, OutErr2, OutElem, OutDone2>,
    readonly done: ContinuationK<
      Env,
      InErr,
      InElem,
      InDone,
      OutErr,
      OutErr2,
      OutElem,
      OutDone,
      OutDone2
    >,
  ) {
    super();
  }
}

export class Done<OutDone> extends Channel<
  unknown,
  unknown,
  unknown,
  unknown,
  never,
  never,
  OutDone
> {
  readonly _tag = ChannelTag.Done;
  constructor(readonly terminal: () => OutDone) {
    super();
  }
}

export class Fail<OutErr> extends Channel<
  unknown,
  unknown,
  unknown,
  unknown,
  OutErr,
  never,
  never
> {
  readonly _tag = ChannelTag.Halt;
  constructor(readonly cause: () => Cause<OutErr>) {
    super();
  }
}

export class FromIO<Env, OutErr, OutDone> extends Channel<
  Env,
  unknown,
  unknown,
  unknown,
  OutErr,
  never,
  OutDone
> {
  readonly _tag = ChannelTag.FromIO;
  constructor(readonly io: IO<Env, OutErr, OutDone>) {
    super();
  }
}

export class Defer<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> extends Channel<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutDone
> {
  readonly _tag = ChannelTag.Defer;
  constructor(
    readonly effect: () => Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ) {
    super();
  }
}

export class Ensuring<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> extends Channel<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutDone
> {
  readonly _tag = ChannelTag.Ensuring;
  constructor(
    readonly channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
    readonly finalizer: (_: Exit<OutErr, OutDone>) => IO<Env, never, any>,
  ) {
    super();
  }
}

export class ConcatAll<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutElem2,
  OutDone,
  OutDone2,
  OutDone3,
> extends Channel<Env, InErr, InElem, InDone, OutErr, OutElem2, OutDone3> {
  readonly _tag = ChannelTag.ConcatAll;
  constructor(
    readonly combineInners: (_: OutDone, __: OutDone) => OutDone,
    readonly combineAll: (_: OutDone, __: OutDone2) => OutDone3,
    readonly onPull: (_: UpstreamPullRequest<OutElem>) => UpstreamPullStrategy<OutElem2>,
    readonly onEmit: (_: OutElem2) => ChildExecutorDecision,
    readonly value: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2>,
    readonly k: (_: OutElem) => Channel<Env, InErr, InElem, InDone, OutErr, OutElem2, OutDone>,
  ) {
    super();
  }
}

export class BracketOut<R, E, Z, OutDone> extends Channel<
  R,
  unknown,
  unknown,
  unknown,
  E,
  Z,
  OutDone
> {
  readonly _tag = ChannelTag.BracketOut;
  constructor(
    readonly acquire: IO<R, E, Z>,
    readonly finalizer: (_: Z, exit: Exit<any, any>) => URIO<R, any>,
  ) {
    super();
  }
}

export class Provide<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> extends Channel<
  unknown,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutDone
> {
  readonly _tag = ChannelTag.Provide;
  constructor(
    readonly environment: Env,
    readonly inner: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ) {
    super();
  }
}

export class Emit<OutElem, OutDone> extends Channel<
  unknown,
  unknown,
  unknown,
  unknown,
  never,
  OutElem,
  OutDone
> {
  readonly _tag = ChannelTag.Emit;
  constructor(readonly out: () => OutElem) {
    super();
  }
}

export class Bridge<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> extends Channel<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutDone
> {
  readonly _tag = ChannelTag.Bridge;
  constructor(
    readonly input: AsyncInputProducer<InErr, InElem, InDone>,
    readonly channel: Channel<Env, unknown, unknown, unknown, OutErr, OutElem, OutDone>,
  ) {
    super();
  }
}

/**
 * @tsplus macro remove
 */
export function concrete<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  _: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): asserts _ is
  | PipeTo<Env, InErr, InElem, InDone, OutErr, any, OutElem, any, OutDone, any>
  | Read<Env, InErr, InElem, InDone, OutErr, any, OutElem, OutDone, any>
  | Done<OutDone>
  | Fail<OutErr>
  | FromIO<Env, OutErr, OutDone>
  | Emit<OutElem, OutDone>
  | ConcatAll<Env, InErr, InElem, InDone, OutErr, any, OutElem, any, OutDone, any>
  | Bridge<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
  | Fold<Env, InErr, InElem, InDone, OutErr, any, OutElem, OutDone, any>
  | Provide<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
  | BracketOut<Env, OutErr, OutElem, OutDone>
  | Ensuring<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
  | Defer<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  //
}
