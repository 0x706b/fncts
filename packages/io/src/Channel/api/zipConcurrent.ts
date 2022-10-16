import { MergeDecision } from "@fncts/io/Channel/internal/MergeDecision";

/**
 * @tsplus pipeable fncts.io.Channel zipConcurrent
 */
export function zipConcurrent<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>(
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env1 | Env,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr | OutErr1,
    OutElem | OutElem1,
    readonly [OutDone, OutDone1]
  > => {
    return self.mergeWith(
      that,
      (exit1) => MergeDecision.Await((exit2) => IO.fromExit(exit1.zipConcurrent(exit2))),
      (exit2) => MergeDecision.Await((exit1) => IO.fromExit(exit1.zipConcurrent(exit2))),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Channel zipLeftConcurrent
 */
export function zipLeftConcurrent<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>(
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env1 | Env,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr | OutErr1,
    OutElem | OutElem1,
    OutDone
  > => {
    return self.zipConcurrent(that).map(([d]) => d);
  };
}

/**
 * @tsplus pipeable fncts.io.Channel zipRightConcurrent
 */
export function zipRightConcurrent<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>(
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env1 | Env,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr | OutErr1,
    OutElem | OutElem1,
    OutDone1
  > => {
    return self.zipConcurrent(that).map(([_, d1]) => d1);
  };
}
