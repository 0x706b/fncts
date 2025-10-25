import type { Push } from "./definition.js";

import { withBuffers } from "./IndexedBuffer.js";
import { Sink } from "./Sink.js";

export abstract class MergeStrategy {
  abstract runMerge<Ps extends ReadonlyArray<Push<any, any, any>>, R>(
    ps: Ps,
    sink: Push.UnsafeSink<R, any, any>,
  ): IO<R | Push.EnvironmentOf<Ps[number]>, never, void>;
}

export class Unordered extends MergeStrategy {
  constructor(readonly executionStrategy: ExecutionStrategy) {
    super();
  }

  runMerge<Ps extends ReadonlyArray<Push<any, any, any>>, R>(
    ps: Ps,
    sink: Push.UnsafeSink<R, any, any>,
  ): IO<R | Push.EnvironmentOf<Ps[number]>, never, void> {
    return IO.foreachExecDiscard(ps, this.executionStrategy, (p) => p.run(sink));
  }
}

export class Ordered extends MergeStrategy {
  constructor(readonly executionStrategy: ExecutionStrategy) {
    super();
  }

  runMerge<Ps extends ReadonlyArray<Push<any, any, any>>, R>(
    ps: Ps,
    sink: Push.UnsafeSink<R, any, any>,
  ): IO<R | Push.EnvironmentOf<Ps[number]>, never, void> {
    return IO.fiberIdWith((fiberId) => {
      const buffers = withBuffers(ps.length, sink, fiberId);
      return IO.foreachWithIndexDiscardExec(
        ps,
        this.executionStrategy,
        (index, p) =>
          p.run(
            Sink.unsafeMake(
              (value) => buffers.onSuccess(index, value),
              (cause) => (cause.isInterruptedOnly ? buffers.onEnd(index) : sink.onFailure(cause)),
            ),
          ) > buffers.onEnd(index),
      );
    });
  }
}

export class Switch extends MergeStrategy {
  runMerge<Ps extends ReadonlyArray<Push<any, any, any>>, R>(
    ps: Ps,
    sink: Push.UnsafeSink<R, any, any>,
  ): IO<R | Push.EnvironmentOf<Ps[number]>, never, void> {
    return IO.foreachDiscard(ps, (p) => p.run(sink));
  }
}
