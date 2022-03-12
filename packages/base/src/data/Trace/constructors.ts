import type { Monoid } from "../../prelude.js";
import type { TraceElement } from "../TraceElement.js";

import { Conc } from "../../collection/immutable/Conc.js";
import { FiberId } from "../FiberId.js";
import { Trace } from "./definition.js";

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
