import type { MergeDecision } from "@fncts/io/Channel/internal/MergeDecision";

import { MergeDecisionTag } from "@fncts/io/Channel/internal/MergeDecision";
import { MergeState, MergeStateTag } from "@fncts/io/Channel/internal/MergeState";
import { SingleProducerAsyncInput } from "@fncts/io/Channel/internal/SingleProducerAsyncInput";

/**
 * Returns a new channel, which is the merge of this channel and the specified channel, where
 * the behavior of the returned channel on left or right early termination is decided by the
 * specified `leftDone` and `rightDone` merge decisions.
 *
 * @tsplus pipeable fncts.io.Channel mergeWith
 */
export function mergeWith<
  Env1,
  Env2,
  Env3,
  InErr1,
  InElem1,
  InDone1,
  OutErr,
  OutErr1,
  OutErr2,
  OutErr3,
  OutElem1,
  OutDone,
  OutDone1,
  OutDone2,
  OutDone3,
>(
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
  leftDone: (ex: Exit<OutErr, OutDone>) => MergeDecision<Env2, OutErr1, OutDone1, OutErr2, OutDone2>,
  rightDone: (ex: Exit<OutErr1, OutDone1>) => MergeDecision<Env3, OutErr, OutDone, OutErr3, OutDone3>,
) {
  return <Env, InErr, InElem, InDone, OutElem>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env | Env1 | Env2 | Env3,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr2 | OutErr3,
    OutElem | OutElem1,
    OutDone2 | OutDone3
  > => {
    return Channel.unwrapScoped(
      Do((_) => {
        const input       = _(SingleProducerAsyncInput<InErr & InErr1, InElem & InElem1, InDone & InDone1>());
        const queueReader = Channel.fromInput(input);
        const pullL       = _(queueReader.pipeTo(self).toPull);
        const pullR       = _(queueReader.pipeTo(that).toPull);
        type LocalMergeState = MergeState<
          Env | Env1 | Env2 | Env3,
          OutErr,
          OutErr1,
          OutErr2 | OutErr3,
          OutElem | OutElem1,
          OutDone,
          OutDone1,
          OutDone2 | OutDone3
        >;
        const handleSide =
          <Err, Done, Err2, Done2>(
            exit: Exit<Err, Either<Done, OutElem | OutElem1>>,
            fiber: Fiber<Err2, Either<Done2, OutElem | OutElem1>>,
            pull: IO<Env | Env1 | Env2 | Env3, Err, Either<Done, OutElem | OutElem1>>,
          ) =>
          (
            done: (
              ex: Exit<Err, Done>,
            ) => MergeDecision<Env | Env1 | Env2 | Env3, Err2, Done2, OutErr2 | OutErr3, OutDone2 | OutDone3>,
            both: (
              f1: Fiber<Err, Either<Done, OutElem | OutElem1>>,
              f2: Fiber<Err2, Either<Done2, OutElem | OutElem1>>,
            ) => LocalMergeState,
            single: (
              f: (ex: Exit<Err2, Done2>) => IO<Env | Env1 | Env2 | Env3, OutErr2 | OutErr3, OutDone2 | OutDone3>,
            ) => LocalMergeState,
          ): IO<
            Env | Env1 | Env2 | Env3,
            never,
            Channel<
              Env | Env1 | Env2 | Env3,
              unknown,
              unknown,
              unknown,
              OutErr2 | OutErr3,
              OutElem | OutElem1,
              OutDone2 | OutDone3
            >
          > => {
            const onDecision = (
              decision: MergeDecision<Env | Env1 | Env2 | Env3, Err2, Done2, OutErr2 | OutErr3, OutDone2 | OutDone3>,
            ) => {
              decision.concrete();
              switch (decision._tag) {
                case MergeDecisionTag.Done:
                  return IO.succeedNow(Channel.fromIO(fiber.interrupt.apSecond(decision.io)));
                case MergeDecisionTag.Await:
                  return fiber.await.map((ex) =>
                    ex.match(
                      (cause) => Channel.fromIO(decision.f(Exit.failCause(cause))),
                      (r) =>
                        r.match(
                          (done) => Channel.fromIO(decision.f(Exit.succeed(done))),
                          (elem) => Channel.writeNow(elem).apSecond(go(single(decision.f))),
                        ),
                    ),
                  );
              }
            };
            return exit.match(
              (cause) => onDecision(done(Exit.failCause(cause))),
              (r) =>
                r.match(
                  (d) => onDecision(done(Exit.succeed(d))),
                  (elem) =>
                    pull.forkDaemon.map((leftFiber) => Channel.writeNow(elem).apSecond(go(both(leftFiber, fiber)))),
                ),
            );
          };
        const go = (
          state: LocalMergeState,
        ): Channel<
          Env | Env1 | Env2 | Env3,
          unknown,
          unknown,
          unknown,
          OutErr2 | OutErr3,
          OutElem | OutElem1,
          OutDone2 | OutDone3
        > => {
          switch (state._tag) {
            case MergeStateTag.BothRunning: {
              const lj: IO<Env2, OutErr, Either<OutDone, OutElem | OutElem1>>   = state.left.join;
              const rj: IO<Env3, OutErr1, Either<OutDone1, OutElem | OutElem1>> = state.right.join;
              return Channel.unwrap(
                lj.raceWith(
                  rj,
                  (leftEx, _) =>
                    handleSide(leftEx, state.right, pullL)(
                      leftDone,
                      (l, r) => MergeState.BothRunning(l, r),
                      (f) => MergeState.LeftDone(f),
                    ),
                  (rightEx, _) =>
                    handleSide(rightEx, state.left, pullR)(
                      rightDone,
                      (l, r) => MergeState.BothRunning(r, l),
                      (f) => MergeState.RightDone(f),
                    ),
                ),
              );
            }
            case MergeStateTag.LeftDone:
              return Channel.unwrap(
                pullR.result.map((exit) =>
                  exit.match(
                    (cause) => Channel.fromIO(state.f(Exit.failCause(cause))),
                    (r) =>
                      r.match(
                        (d) => Channel.fromIO(state.f(Exit.succeed(d))),
                        (elem) => Channel.writeNow(elem).apSecond(go(MergeState.LeftDone(state.f))),
                      ),
                  ),
                ),
              );
            case MergeStateTag.RightDone:
              return Channel.unwrap(
                pullL.result.map((exit) =>
                  exit.match(
                    (cause) => Channel.fromIO(state.f(Exit.failCause(cause))),
                    (r) =>
                      r.match(
                        (d) => Channel.fromIO(state.f(Exit.succeed(d))),
                        (elem) => Channel.writeNow(elem).apSecond(go(MergeState.RightDone(state.f))),
                      ),
                  ),
                ),
              );
          }
        };
        return Channel.fromIO(
          pullL.forkDaemon.zipWith(pullR.forkDaemon, (a, b) =>
            MergeState.BothRunning<unknown, OutErr, OutErr1, unknown, OutElem | OutElem1, OutDone, OutDone1, unknown>(
              a,
              b,
            ),
          ),
        )
          .flatMap(go)
          .embedInput(input);
      }),
    );
  };
}
