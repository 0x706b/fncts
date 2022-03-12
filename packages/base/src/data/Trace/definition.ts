import type { Conc } from "../../collection/immutable/Conc.js";
import type { Monoid, Semigroup } from "../../prelude.js";
import type { FiberId } from "../FiberId.js";
import type { TraceElement } from "../TraceElement.js";

/**
 * @tsplus type fncts.data.Trace
 * @tsplus companion fncts.data.TraceOps
 */
export class Trace {
  constructor(readonly fiberId: FiberId, readonly stackTrace: Conc<TraceElement>) {}
}
