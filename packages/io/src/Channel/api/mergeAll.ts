import type { MergeStrategy } from "@fncts/io/Channel/api/mergeAllWith";

/**
 * @tsplus pipeable fncts.io.Channel mergeAll
 */
export function mergeAll(n: number, bufferSize = 16, mergeStrategy: MergeStrategy = "BackPressure") {
  return <Env, InErr, InElem, InDone, OutErr, Env1, InErr1, InElem1, InDone1, OutErr1, OutElem>(
    channels: Channel<
      Env,
      InErr,
      InElem,
      InDone,
      OutErr,
      Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem, any>,
      any
    >,
  ): Channel<Env | Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem, unknown> => {
    return channels.mergeAllWith(n, () => undefined, bufferSize, mergeStrategy);
  };
}
