import type { TraceElement } from "../TraceElement.js";

/**
 * @tsplus type fncts.data.Trace
 * @tsplus companion fncts.data.TraceOps
 */
export class Trace {
  constructor(readonly fiberId: FiberId, readonly stackTrace: Conc<TraceElement>) {}
}
