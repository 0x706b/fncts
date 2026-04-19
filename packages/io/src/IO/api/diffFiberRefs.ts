import { FiberRefsPatch } from "@fncts/io/FiberRefs";

/**
 * Returns a patch describing the changes to FiberRefs made by this effect.
 *
 * @tsplus getter fncts.io.IO diffFiberRefs
 */
export function diffFiberRefs<R, E, A>(
  self: IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, readonly [FiberRefsPatch, A]> {
  return self.summarized(IO.getFiberRefs(), FiberRefsPatch.diff);
}
