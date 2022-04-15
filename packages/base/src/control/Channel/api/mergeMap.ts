import type { MergeStrategy } from "@fncts/base/control/Channel/api/mergeAllWith";

/**
 * @tsplus fluent fncts.control.Channel mergeMap
 */
export function mergeMap_<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  Env1,
  InErr1,
  InElem1,
  InDone1,
  OutErr1,
  OutElem1,
>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, any>,
  f: (elem: OutElem) => Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, any>,
  n: number,
  bufferSize = 16,
  mergeStrategy: MergeStrategy = "BackPressure",
): Channel<Env & Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem1, unknown> {
  return self.mapOut(f).mergeAll(n, bufferSize, mergeStrategy);
}
