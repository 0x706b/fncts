import type { STM } from "../definition";

import { Effect, RetryException } from "../definition";

/**
 * @tsplus static fncts.control.STMOps retry
 */
export const retry: STM<unknown, never, never> = new Effect(() => {
  throw new RetryException();
});
