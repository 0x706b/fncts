import type { Channel } from "../definition";

/**
 * @tsplus fluent fncts.control.Channel mergeAllUnboundedWith
 */
export function mergeAllUnboundedWith_<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  Env1,
  InErr1,
  InElem1,
  InDone1,
  OutErr1,
  OutElem,
  OutDone,
>(
  channels: Channel<
    Env,
    InErr,
    InElem,
    InDone,
    OutErr,
    Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem, OutDone>,
    OutDone
  >,
  f: (x: OutDone, y: OutDone) => OutDone,
): Channel<
  Env & Env1,
  InErr & InErr1,
  InElem & InElem1,
  InDone & InDone1,
  OutErr | OutErr1,
  OutElem,
  OutDone
> {
  return channels.mergeAllWith(Number.MAX_SAFE_INTEGER, f);
}
