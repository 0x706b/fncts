export const SinkEndReasonTypeId = Symbol.for("fncts.control.Stream.SinkEndReason");

export const SinkEndTypeId = Symbol.for("fncts.control.Stream.SinkEndReason.SinkEnd");
export class SinkEnd {
  readonly _typeId: typeof SinkEndReasonTypeId = SinkEndReasonTypeId;
  readonly _tag: typeof SinkEndTypeId          = SinkEndTypeId;
}

export const ScheduleTimeoutTypeId = Symbol.for("fncts.control.Stream.SinkEndReason.ScheduleTimeout");
export class ScheduleTimeout {
  readonly _typeId: typeof SinkEndReasonTypeId = SinkEndReasonTypeId;
  readonly _tag: typeof ScheduleTimeoutTypeId  = ScheduleTimeoutTypeId;
}

export const ScheduleEndTypeId = Symbol.for("fncts.control.Stream.SinkEndReason.ScheduleEnd");
export class ScheduleEnd<C> {
  readonly _typeId: typeof SinkEndReasonTypeId = SinkEndReasonTypeId;
  readonly _tag: typeof ScheduleEndTypeId      = ScheduleEndTypeId;

  constructor(readonly c: C) {}
}

export const UpstreamEndTypeId = Symbol.for("fncts.control.Stream.SinkEndReason.ScheduleEnd");
export class UpstreamEnd {
  readonly _typeId: typeof SinkEndReasonTypeId = SinkEndReasonTypeId;
  readonly _tag: typeof UpstreamEndTypeId      = UpstreamEndTypeId;
}

export type SinkEndReason<C> = SinkEnd | ScheduleTimeout | ScheduleEnd<C> | UpstreamEnd;
