import type { FIO, UIO } from "../../IO.js";

import { Fiber } from "../definition.js";

/**
 * Lifts an `IO` into a `Fiber`.
 *
 * @tsplus static fncts.control.FiberOps fromIO
 */
export function fromIO<E, A>(effect: FIO<E, A>): UIO<Fiber<E, A>> {
  return effect.result.map((exit) => Fiber.done(exit));
}
