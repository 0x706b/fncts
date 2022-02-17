import { Trace } from "./definition";

/**
 * @tsplus fluent fncts.data.Trace combine
 */
export function combine_(self: Trace, that: Trace): Trace {
  return new Trace(
    self.fiberId.combine(that.fiberId),
    self.stackTrace.concat(that.stackTrace)
  );
}
