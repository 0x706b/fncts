import type { LogSpan } from "@fncts/base/data/LogSpan";

/**
 * @tsplus type fncts.control.Logger
 * @tsplus companion fncts.control.LoggerOps
 */
export class Logger<Message, Output> {
  readonly _Message!: (_: Message) => void;
  readonly _Output!: () => Output;
  constructor(
    readonly log: (
      trace: TraceElement,
      fiberId: FiberId,
      logLevel: LogLevel,
      message: () => Message,
      cause: Cause<any>,
      context: Map<FiberRef.Runtime<any>, any>,
      spans: List<LogSpan>,
      annotations: HashMap<string, string>,
    ) => Output,
  ) {}
}
