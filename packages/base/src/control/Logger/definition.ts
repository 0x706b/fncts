import type { HashMap } from "../../collection/immutable/HashMap.js";
import type { List } from "../../collection/immutable/List.js";
import type { Cause } from "../../data/Cause.js";
import type { FiberId } from "../../data/FiberId.js";
import type { LogLevel } from "../../data/LogLevel.js";
import type { LogSpan } from "../../data/LogSpan.js";
import type { TraceElement } from "../../data/TraceElement.js";
import type { FiberRef } from "../FiberRef.js";

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
