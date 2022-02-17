import type { FiberState } from "./definition";

import { Cause } from "../Cause";

/**
 * @tsplus getter fncts.data.FiberState interruptorsCause
 */
export function interruptorsCause<E, A>(state: FiberState<E, A>): Cause<never> {
  let cause: Cause<never> = Cause.empty();
  for (const id of state.interruptors) {
    cause = Cause.then(cause, Cause.interrupt(id));
  }
  return cause;
}
