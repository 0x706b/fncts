import type { HashMap } from "../../collection/immutable/HashMap";
import type { List } from "../../collection/immutable/List";
import type { Cause } from "../../data/Cause";
import type { FiberId } from "../../data/FiberId";
import type { LogLevel } from "../../data/LogLevel";
import type { LogSpan } from "../../data/LogSpan";
import type { TraceElement } from "../../data/TraceElement";
import type { FiberRef } from "../FiberRef";

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
