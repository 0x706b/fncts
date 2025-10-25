import type { Push } from "../definition.js";

export const enum IOProducerTag {
  FromIO,
  FromScheduled,
  Scheduled,
}

export class FromIO<R, E, A> {
  readonly _tag = IOProducerTag.FromIO;
  constructor(readonly source: IO<R, E, A>) {}
}

export class FromScheduled<R, E, I, R1, O> {
  readonly _tag = IOProducerTag.FromScheduled;
  constructor(
    readonly input: IO<R, E, I>,
    readonly schedule: Schedule<R1, I, O>,
  ) {}
}

export class Scheduled<R, E, A, R1, O> {
  readonly _tag = IOProducerTag.Scheduled;
  constructor(
    readonly input: IO<R, E, A>,
    readonly schedule: Schedule<R1, unknown, O>,
  ) {}
}

/**
 * @tsplus type fncts.io.Push.IOProducer
 * @tsplus companion fncts.io.Push.IOProducerOps
 */
export type IOProducer<R, E, A> = FromIO<R, E, A> | FromScheduled<R, E, any, any, A> | Scheduled<R, E, A, any, any>;

/**
 * @tsplus fluent fncts.io.Push.IOProducer runSink
 */
export function runSink<R, E, A, R1>(
  self: IOProducer<R, E, A>,
  sink: Push.UnsafeSink<R1, E, A>,
): IO<R | R1, never, unknown> {
  switch (self._tag) {
    case IOProducerTag.FromIO:
      return self.source.matchCauseIO(sink.onFailure, sink.onSuccess);
    case IOProducerTag.Scheduled:
      return self.input
        .matchCauseIO(sink.onFailure, sink.onSuccess)
        .schedule(self.schedule)
        .catchAllCause(sink.onFailure);
    case IOProducerTag.FromScheduled:
      return self.input
        .flatMap((i) => self.input.scheduleFrom(() => i, self.schedule.mapIO(sink.onSuccess)))
        .catchAllCause(sink.onFailure);
  }
}

/**
 * @tsplus fluent fncts.io.Push.IOProducer runIO
 */
export function runIO<R, E, A, R1, E1, A1>(
  self: IOProducer<R, E, A>,
  f: (a: A) => IO<R1, E1, A1>,
): IO<R | R1, E | E1, unknown> {
  switch (self._tag) {
    case IOProducerTag.FromIO:
      return self.source.flatMap(f);
    case IOProducerTag.FromScheduled:
      return self.input.flatMap((i) =>
        IO.asyncIO((resume) => {
          const onFailure = (cause: Cause<E | E1>) => IO.succeedNow(resume(IO.failCauseNow(cause)));
          return self.input
            .scheduleFrom(
              () => i,
              self.schedule.mapIO((a) => f(a).catchAllCause(onFailure)),
            )
            .matchCauseIO(onFailure, () => IO.succeedNow(resume(IO.unit))).asUnit;
        }),
      );
    case IOProducerTag.Scheduled:
      return self.input.flatMap(f).schedule(self.schedule);
  }
}
