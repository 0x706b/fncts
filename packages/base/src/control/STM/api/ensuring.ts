import { STM } from "../definition";

/**
 * Executes the specified finalization transaction whether or
 * not this effect succeeds. Note that as with all STM transactions,
 * if the full transaction fails, everything will be rolled back.
 *
 * @tsplus fluent fncts.control.STM ensuring
 */
export function ensuring_<R, E, A, R1, B>(
  self: STM<R, E, A>,
  finalizer: STM<R1, never, B>
): STM<R & R1, E, A> {
  return self.matchSTM(
    (e) => finalizer.chain(() => STM.failNow(e)),
    (a) => finalizer.chain(() => STM.succeedNow(a))
  );
}
