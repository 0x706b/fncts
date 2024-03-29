/**
 * @tsplus pipeable fncts.io.Channel mergeAllUnboundedWith
 */
export function mergeAllUnboundedWith<OutDone>(f: (x: OutDone, y: OutDone) => OutDone) {
  return <Env, InErr, InElem, InDone, OutErr, Env1, InErr1, InElem1, InDone1, OutErr1, OutElem>(
    channels: Channel<
      Env,
      InErr,
      InElem,
      InDone,
      OutErr,
      Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem, OutDone>,
      OutDone
    >,
  ): Channel<Env | Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem, OutDone> => {
    return channels.mergeAllWith(Number.MAX_SAFE_INTEGER, f);
  };
}
