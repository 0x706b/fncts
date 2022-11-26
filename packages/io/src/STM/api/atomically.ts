import { AtomicReference } from "@fncts/base/internal/AtomicReference";
import { CommitState } from "@fncts/io/STM/internal/CommitState";
import { tryCommitAsync, tryCommitSync } from "@fncts/io/STM/internal/Journal";
import { TryCommitTag } from "@fncts/io/STM/internal/TryCommit";
import { TxnId } from "@fncts/io/TxnId";

/**
 * @tsplus static fncts.io.STMOps atomically
 * @tsplus getter fncts.io.STM commit
 */
export function atomically<R, E, A>(stm: STM<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IO.environmentWithIO((r: Environment<R>) =>
    FiberRef.currentScheduler.getWith((scheduler) =>
      IO.fiberId.flatMap((fiberId) => {
        const result = tryCommitSync(fiberId, stm, r, scheduler);
        switch (result._tag) {
          case TryCommitTag.Done: {
            return IO.fromExitNow(result.exit);
          }
          case TryCommitTag.Suspend: {
            const id    = TxnId.make();
            const state = new AtomicReference<CommitState<E, A>>(CommitState.Running);
            const async = IO.async(tryCommitAsync(result.journal, fiberId, stm, id, state, r, scheduler));
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
              }),
            );
          }
        }
      }),
    ),
  );
}
