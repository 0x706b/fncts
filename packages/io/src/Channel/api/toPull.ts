import type { ChannelState } from "@fncts/io/Channel/internal/ChannelState";

import { identity } from "@fncts/base/data/function";
import { ChannelExecutor, readUpstream } from "@fncts/io/Channel/internal/ChannelExecutor";
import { ChannelStateTag } from "@fncts/io/Channel/internal/ChannelState";

/**
 * Interpret a channel to a managed Pull
 *
 * @tsplus getter fncts.io.Channel toPull
 */
export function toPull<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): IO<Env | Scope, never, IO<Env, OutErr, Either<OutDone, OutElem>>> {
  return IO.acquireReleaseExit(
    IO.succeed(new ChannelExecutor(() => self, null, identity)),
    (exec, exit) => exec.close(exit) || IO.unit,
  ).map((exec) => IO.defer(toPullInterpret(exec.run(), exec)));
}

function toPullInterpret<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  channelState: ChannelState<Env, OutErr>,
  exec: ChannelExecutor<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): IO<Env, OutErr, Either<OutDone, OutElem>> {
  switch (channelState._tag) {
    case ChannelStateTag.Effect:
      return channelState.effect.flatMap(() => toPullInterpret(exec.run(), exec));
    case ChannelStateTag.Emit:
      return IO.succeed(Either.right(exec.getEmit()));
    case ChannelStateTag.Done: {
      const done = exec.getDone();
      return done.match(IO.failCauseNow, (outDone) => IO.succeedNow(Either.left(outDone)));
    }
    case ChannelStateTag.Read: {
      return readUpstream(channelState, () => toPullInterpret(exec.run(), exec));
    }
  }
}
