import type { FiberRefsPatch } from "@fncts/io/FiberRefs";

/**
 * @tsplus static fncts.io.IOOps patchFiberRefs
 */
export function patchFiberRefs(patch: FiberRefsPatch): UIO<void> {
  return IO.updateFiberRefs((fiberId, fiberRefs) => patch(fiberId, fiberRefs));
}
