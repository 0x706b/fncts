import type { MergeStrategy } from "@fncts/io/Channel/api/mergeAllWith";

/**
 * @tsplus pipeable fncts.io.Channel mergeMap
 */
export function mergeMap<OutElem, Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1>(
  f: (elem: OutElem) => Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, any>,
  n: number,
  bufferSize = 16,
  mergeStrategy: MergeStrategy = "BackPressure",
) {
  return <Env, InErr, InElem, InDone, OutErr>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, any>,
  ): Channel<Env | Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem1, unknown> => {
    return self.mapOut(f).mergeAll(n, bufferSize, mergeStrategy);
  };
}
