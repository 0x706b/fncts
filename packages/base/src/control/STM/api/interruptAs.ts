import type { FiberId } from "../../../data/FiberId";
import type { STM } from "../definition";

import { Effect, InterruptException } from "../definition";

/**
 * Interrupts the fiber running the effect with the specified fiber id.
 *
 * @tsplus static fncts.control.STMOps interruptAs
 */
export function interruptAs(fiberId: FiberId): STM<unknown, never, never> {
  return new Effect(() => {
    throw new InterruptException(fiberId);
  });
}
