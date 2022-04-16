export const enum SinkEndReasonTag {
  SinkEnd = "SinkEnd",
  ScheduleTimeout = "ScheduleTimeout",
  ScheduleEnd = "ScheduleEnd",
  UpstreamEnd = "UpstreamEnd",
}

export const SinkEndReasonTypeId = Symbol.for("fncts.io.Stream.SinkEndReason");

export class SinkEnd {
  readonly _typeId: typeof SinkEndReasonTypeId = SinkEndReasonTypeId;
  readonly _tag = SinkEndReasonTag.SinkEnd;
}

export class ScheduleTimeout {
  readonly _typeId: typeof SinkEndReasonTypeId = SinkEndReasonTypeId;
  readonly _tag = SinkEndReasonTag.ScheduleTimeout;
}

export class ScheduleEnd<C> {
  readonly _typeId: typeof SinkEndReasonTypeId = SinkEndReasonTypeId;
  readonly _tag = SinkEndReasonTag.ScheduleEnd;

  constructor(readonly c: C) {}
}

export class UpstreamEnd {
  readonly _typeId: typeof SinkEndReasonTypeId = SinkEndReasonTypeId;
  readonly _tag = SinkEndReasonTag.UpstreamEnd;
}

/**
 * @tsplus type fncts.io.Stream.SinkEndReason
 */
export type SinkEndReason<C> = SinkEnd | ScheduleTimeout | ScheduleEnd<C> | UpstreamEnd;

/**
 * @tsplus fluent fncts.io.Stream.SinkEndReason match
 */
export function matchSinkEndReason_<A, B, C, D, E>(
  self: SinkEndReason<A>,
  cases: {
    SinkEnd: (_: SinkEnd) => B;
    ScheduleTimeout: (_: ScheduleTimeout) => C;
    ScheduleEnd: (_: ScheduleEnd<A>) => D;
    UpstreamEnd: (_: UpstreamEnd) => E;
  },
): B | C | D | E {
  switch (self._tag) {
    case SinkEndReasonTag.SinkEnd:
      return cases.SinkEnd(self);
    case SinkEndReasonTag.ScheduleTimeout:
      return cases.ScheduleTimeout(self);
    case SinkEndReasonTag.ScheduleEnd:
      return cases.ScheduleEnd(self);
    case SinkEndReasonTag.UpstreamEnd:
      return cases.UpstreamEnd(self);
  }
}
