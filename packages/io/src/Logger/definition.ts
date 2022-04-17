import type { LogSpan } from "@fncts/io/LogSpan";

/**
 * @tsplus type fncts.io.Logger
 * @tsplus companion fncts.io.LoggerOps
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
      context: HashMap<FiberRef<unknown>, unknown>,
      spans: List<LogSpan>,
      annotations: HashMap<string, string>,
    ) => Output,
  ) {}
}
