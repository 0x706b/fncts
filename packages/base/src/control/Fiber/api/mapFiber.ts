import type { UIO } from "../../IO.js";

import { Fiber } from "../definition.js";

/**
 * Passes the success of this fiber to the specified callback, and continues
 * with the fiber that it returns.
 *
 * @tsplus fluent fncts.control.Fiber mapFiber
 */
export function mapFiber_<A, E, E1, A1>(
  fiber: Fiber<E, A>,
  f: (a: A) => Fiber<E1, A1>,
): UIO<Fiber<E | E1, A1>> {
  return fiber.await.map((exit) => exit.match(Fiber.failCause, f));
}
