import { Logger } from "./definition";

/**
 * @tsplus static fncts.control.LoggerOps defaultString
 */
export const defaultString: Logger<string, string> = new Logger(
  (trace, fiberId, logLevel, message, cause, context, spans, annotations) => {
    let s           = "";
    const nowMillis = Date.now();
    const now       = new Date(nowMillis);

    s += "timestamp=";
    s += now.toISOString();
    s += " level=";
    s += logLevel.label;
    s += " thread=#";
    s += fiberId.threadName;
    s += ' message="';
    s += message();
    s += '"';

    if (spans.isNonEmpty()) {
      let first = true;
      for (const span of spans) {
        if (first) {
          first = false;
        } else {
          s += " ";
        }

        s += span.render(nowMillis);
      }
    }

    if (trace._tag === "SourceLocation") {
      s += " location=";
      s += quoted(trace.show);
    }

    // TODO: render Cause, and Annotations

    return s;
  }
);

/**
 * @tsplus fncts.control.Logger none
 */
export const none: Logger<unknown, void> = new Logger(() => undefined);

function quoted(label: string): string {
  if (label.indexOf(" ") < 0) {
    return label;
  } else {
    let s = "";
    s    += '"';
    s    += label;
    s    += '"';
    return s;
  }
}
