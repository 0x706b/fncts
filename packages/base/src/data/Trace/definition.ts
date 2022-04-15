import type { TraceElement } from "../TraceElement.js";

/**
 * @tsplus type fncts.Trace
 * @tsplus companion fncts.TraceOps
 */
export class Trace {
  constructor(readonly fiberId: FiberId, readonly stackTrace: Conc<TraceElement>) {}
}
