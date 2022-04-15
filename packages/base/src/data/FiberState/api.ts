import type { FiberState } from "./definition.js";

/**
 * @tsplus getter fncts.FiberState interruptorsCause
 */
export function interruptorsCause<E, A>(state: FiberState<E, A>): Cause<never> {
  let cause: Cause<never> = Cause.empty();
  for (const id of state.interruptors) {
    cause = Cause.then(cause, Cause.interrupt(id));
  }
  return cause;
}
