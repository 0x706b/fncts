import type { LogLevel } from "../../data/LogLevel.js";
import type { Maybe } from "../../data/Maybe.js";
import type { Predicate } from "../../data/Predicate.js";

import { Just, Nothing } from "../../data/Maybe.js";
import { Logger } from "./definition.js";

/**
 * @tsplus fluent fncts.control.Logger filterLogLevel
 */
export function filterLogLevel_<Message, Output>(
  self: Logger<Message, Output>,
  p: Predicate<LogLevel>,
): Logger<Message, Maybe<Output>> {
  return new Logger((trace, fiberId, logLevel, message, cause, context, spans, annotations) => {
    if (p(logLevel)) {
      return Just(self.log(trace, fiberId, logLevel, message, cause, context, spans, annotations));
    } else {
      return Nothing();
    }
  });
}

/**
 * @tsplus fluent fncts.control.Logger map
 */
export function map_<Message, Output, B>(
  self: Logger<Message, Output>,
  f: (_: Output) => B,
): Logger<Message, B> {
  return new Logger((trace, fiberId, logLevel, message, cause, context, spans, annotations) =>
    f(self.log(trace, fiberId, logLevel, message, cause, context, spans, annotations)),
  );
}
