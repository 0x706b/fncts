import type { USTM } from "../STM";

import { TRef } from "../TRef";
import { TSemaphore } from "./definition";

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
