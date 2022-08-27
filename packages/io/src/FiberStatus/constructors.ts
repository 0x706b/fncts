import type { RuntimeFlags } from "../RuntimeFlags.js";
import type { FiberStatus } from "./definition.js";

import { Done, Running, Suspended } from "./definition.js";

/**
 * @tsplus static fncts.FiberStatusOps done
 */
export const done: FiberStatus = new Done();

/**
 * @tsplus static fncts.FiberStatusOps running
 */
export function running(runtimeFlags: RuntimeFlags, trace?: string): FiberStatus {
  return new Running(runtimeFlags, trace);
}

/**
 * @tsplus static fncts.FiberStatusOps suspended
 */
export function suspended(runtimeFlags: RuntimeFlags, blockingOn: FiberId, trace?: string): FiberStatus {
  return new Suspended(runtimeFlags, blockingOn, trace);
}
