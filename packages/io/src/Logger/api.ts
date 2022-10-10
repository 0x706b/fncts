/**
 * @tsplus pipeable fncts.io.Logger filterLogLevel
 */
export function filterLogLevel(p: Predicate<LogLevel>) {
  return <Message, Output>(self: Logger<Message, Output>): Logger<Message, Maybe<Output>> => {
    return new Logger((trace, fiberId, logLevel, message, cause, context, spans, annotations) => {
      if (p(logLevel)) {
        return Just(self.log(trace, fiberId, logLevel, message, cause, context, spans, annotations));
      } else {
        return Nothing();
      }
    });
  };
}

/**
 * @tsplus pipeable fncts.io.Logger map
 */
export function map<Output, B>(f: (_: Output) => B) {
  return <Message>(self: Logger<Message, Output>): Logger<Message, B> => {
    return new Logger((trace, fiberId, logLevel, message, cause, context, spans, annotations) =>
      f(self.log(trace, fiberId, logLevel, message, cause, context, spans, annotations)),
    );
  };
}
