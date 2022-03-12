import type { USTM } from "../STM.js";

import { TRef } from "../TRef.js";
import { TSemaphore } from "./definition.js";

/**
 * @tsplus static fncts.control.TSemaphoreOps __call
 * @tsplus static fncts.control.TSemaphoreOps make
 */
export function make(permits: number): USTM<TSemaphore> {
  return TRef.make(permits).map((ref) => TSemaphore.get(ref));
}

/**
 * @tsplus static fncts.control.TSemaphoreOps unsafeMake
 */
export function unsafeMake(permits: number): TSemaphore {
  return TSemaphore.get(TRef.unsafeMake(permits));
}
