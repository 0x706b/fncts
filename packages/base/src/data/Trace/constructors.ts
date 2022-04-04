import type { TraceElement } from "../TraceElement.js";

/**
 * @tsplus static fncts.data.TraceOps __call
 */
export function make(fiberId: FiberId, stackTrace: Conc<TraceElement>): Trace {
  return new Trace(fiberId, stackTrace);
}

/**
 * @tsplus static fncts.data.TraceOps none
 */
export const none: Trace = new Trace(FiberId.none, Conc.empty());
