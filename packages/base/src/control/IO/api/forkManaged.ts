import type { RuntimeFiber } from "../../Fiber";
import type { Managed } from "../../Managed";
import type { IO } from "../definition";

/**
 * @tsplus getter fncts.control.IO forkManaged
 */
export function forkManaged<R, E, A>(self: IO<R, E, A>): Managed<R, never, RuntimeFiber<E, A>> {
  return self.toManaged.fork;
}
