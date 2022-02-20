import type { FIO, UIO } from "../../IO";

import { Fiber } from "../definition";

/**
 * Lifts an `IO` into a `Fiber`.
 *
 * @tsplus static fncts.control.FiberOps fromIO
 */
export function fromIO<E, A>(effect: FIO<E, A>): UIO<Fiber<E, A>> {
  return effect.result.map((exit) => Fiber.done(exit));
}
