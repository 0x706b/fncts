import type { LogSpan } from "@fncts/io/LogSpan";

export const LoggerVariance = Symbol.for("fncts.io.Logger");
export type LoggerVariance = typeof LoggerVariance;

/**
 * @tsplus type fncts.io.Logger
 * @tsplus companion fncts.io.LoggerOps
 */
export class Logger<in Message, out Output> {
  declare LoggerVariance: {
    readonly _Message: (_: Message) => void;
    readonly _Output: (_: never) => Output;
  };
  constructor(
    readonly log: (
      trace: TraceElement,
      fiberId: FiberId,
      logLevel: LogLevel,
      message: () => Message,
      cause: Cause<any>,
      context: HashMap<FiberRef<any>, Cons<readonly [FiberId.Runtime, unknown]>>,
      spans: List<LogSpan>,
      annotations: HashMap<string, string>,
    ) => Output,
  ) {}
}
