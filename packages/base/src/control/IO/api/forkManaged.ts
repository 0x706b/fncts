import type { RuntimeFiber } from "../../Fiber.js";
import type { Managed } from "../../Managed.js";
import type { IO } from "../definition.js";

/**
 * @tsplus getter fncts.control.IO forkManaged
 */
export function forkManaged<R, E, A>(self: IO<R, E, A>): Managed<R, never, RuntimeFiber<E, A>> {
  return self.toManaged.fork;
}
