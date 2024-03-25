import { FiberRefsPatch } from "@fncts/io/FiberRefs";

/**
 * @tsplus getter fncts.io.IO diffFiberRefs
 */
export function diffFiberRefs<R, E, A>(
  self: IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, readonly [FiberRefsPatch, A]> {
  return self.summarized(IO.getFiberRefs(), FiberRefsPatch.diff);
}
