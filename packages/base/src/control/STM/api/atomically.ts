import type { STM } from "../definition";

import { TxnId } from "../../../data/TxnId";
import { AtomicReference } from "../../../internal/AtomicReference";
import { CommitState } from "../../../internal/CommitState";
import { tryCommitAsync, tryCommitSync } from "../../../internal/Journal";
import { TryCommitTag } from "../../../internal/TryCommit";
import { IO } from "../../IO";

/**
 * @tsplus getter fncts.control.STM atomically
 */
export function atomically<R, E, A>(stm: STM<R, E, A>): IO<R, E, A> {
  return IO.asksIO((r: R) =>
    IO.deferWith((_, fiberId) => {
      const result = tryCommitSync(fiberId, stm, r);
      switch (result._tag) {
        case TryCommitTag.Done: {
          return IO.fromExitNow(result.exit);
        }
        case TryCommitTag.Suspend: {
          const id    = TxnId.make();
          const state = new AtomicReference<CommitState<E, A>>(
            CommitState.Running
          );
          const async = IO.async(
            tryCommitAsync(result.journal, fiberId, stm, id, state, r)
          );
          return IO.uninterruptibleMask(({ restore }) =>
            restore(async).catchAllCause((cause) => {
              state.compareAndSet(CommitState.Running, CommitState.Interrupted);
              const newState = state.get;
              switch (newState._tag) {
                case "Done": {
                  return IO.fromExitNow(newState.exit);
                }
                default: {
                  return IO.failCauseNow(cause);
                }
              }
            })
          );
        }
      }
    })
  );
}
