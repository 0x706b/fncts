export const enum SinkEndReasonTag {
  SinkEnd = "SinkEnd",
  ScheduleTimeout = "ScheduleTimeout",
  ScheduleEnd = "ScheduleEnd",
  UpstreamEnd = "UpstreamEnd",
}

export const SinkEndReasonTypeId = Symbol.for("fncts.io.Stream.SinkEndReason");

export class ScheduleEnd {
  readonly _typeId: typeof SinkEndReasonTypeId = SinkEndReasonTypeId;
  readonly _tag = SinkEndReasonTag.ScheduleEnd;
}

export class UpstreamEnd {
  readonly _typeId: typeof SinkEndReasonTypeId = SinkEndReasonTypeId;
  readonly _tag = SinkEndReasonTag.UpstreamEnd;
}

/**
 * @tsplus type fncts.io.Stream.SinkEndReason
 */
export type SinkEndReason = ScheduleEnd | UpstreamEnd;

/**
 * @tsplus pipeable fncts.io.Stream.SinkEndReason match
 */
export function matchSinkEndReason<A, B>(cases: {
  ScheduleEnd: (_: ScheduleEnd) => A;
  UpstreamEnd: (_: UpstreamEnd) => B;
}) {
  return (self: SinkEndReason): A | B => {
    switch (self._tag) {
      case SinkEndReasonTag.ScheduleEnd:
        return cases.ScheduleEnd(self);
      case SinkEndReasonTag.UpstreamEnd:
        return cases.UpstreamEnd(self);
    }
  };
}
