import type { Conc } from "../../collection/immutable/Conc";
import type { Monoid, Semigroup } from "../../prelude";
import type { FiberId } from "../FiberId";
import type { TraceElement } from "../TraceElement";

/**
 * @tsplus type fncts.data.Trace
 * @tsplus companion fncts.data.TraceOps
 */
export class Trace {
  constructor(readonly fiberId: FiberId, readonly stackTrace: Conc<TraceElement>) {}
}
