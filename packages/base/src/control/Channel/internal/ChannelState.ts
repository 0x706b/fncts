import type { ErasedExecutor } from "@fncts/base/control/Channel/internal/ChannelExecutor";

export const enum ChannelStateTag {
  Emit = "Emit",
  Done = "Done",
  Effect = "Effect",
  Read = "Read",
}

export const ChannelStateTypeId = Symbol.for("fncts.control.Channel.ChannelState");
export type ChannelStateTypeId = typeof ChannelStateTypeId;

export class Emit {
  readonly _tag = ChannelStateTag.Emit;
  readonly _R!: (_: unknown) => void;
  readonly _E!: () => never;
  get effect(): UIO<any> {
    return IO.unit;
  }
}
export const _Emit = new Emit();
export class Done {
  readonly _tag = ChannelStateTag.Done;
  readonly _R!: (_: unknown) => void;
  readonly _E!: () => never;
  get effect(): UIO<any> {
    return IO.unit;
  }
}
export const _Done = new Done();
export class Effect<R, E> {
  readonly _tag = ChannelStateTag.Effect;
  readonly _R!: (_: R) => void;
  readonly _E!: () => E;
  constructor(readonly io: IO<R, E, any>) {}
  get effect(): IO<R, E, any> {
    return this.io;
  }
}

export class Read<R, E> {
  readonly _tag = ChannelStateTag.Read;
  constructor(
    readonly upstream: ErasedExecutor<R> | null,
    readonly onEffect: (_: IO<R, never, void>) => IO<R, never, void>,
    readonly onEmit: (_: any) => IO<R, never, void> | null,
    readonly onDone: (exit: Exit<any, any>) => IO<R, never, void> | null,
  ) {}
  get effect(): IO<R, E, any> {
    return IO.unit;
  }
}

export type ChannelState<R, E> = Emit | Done | Effect<R, E> | Read<R, E>;

export function effectOrNullIgnored<R, E>(channelState: ChannelState<R, E> | null): IO<R, never, void> | null {
  if (channelState === null) {
    return null;
  }
  return channelState._tag === ChannelStateTag.Effect ? channelState.effect.ignore.asUnit : null;
}
