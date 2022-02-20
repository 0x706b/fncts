import type { FiberId } from "../../../data/FiberId";
import type { STM } from "../definition";

import { Effect } from "../definition";

/**
 * Returns the fiber id of the fiber committing the transaction.
 *
 * @tsplus static fncts.control.STMOps fiberId
 */
export const fiberId: STM<unknown, never, FiberId> = new Effect(
  (_, fiberId) => fiberId
);
