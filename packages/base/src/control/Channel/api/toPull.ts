import type { Channel } from "../definition.js";
import type { ChannelState } from "../internal/ChannelState.js";

import { Either } from "../../../data/Either.js";
import { identity } from "../../../data/function.js";
import { IO } from "../../IO.js";
import { Managed } from "../../Managed.js";
import { ChannelExecutor, readUpstream } from "../internal/ChannelExecutor.js";
import { ChannelStateTag } from "../internal/ChannelState.js";

/**
 * Interpret a channel to a managed Pull
 *
 * @tsplus getter fncts.control.Channel toPull
 */
export function toPull<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): Managed<Env, never, IO<Env, OutErr, Either<OutDone, OutElem>>> {
  return Managed.bracketExit(
    IO.succeed(new ChannelExecutor(() => self, undefined, identity)),
    (exec, exit) => exec.close(exit) || IO.unit,
  ).map((exec) => IO.defer(toPullInterpret(exec.run(), exec)));
}

function toPullInterpret<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  channelState: ChannelState<Env, OutErr>,
  exec: ChannelExecutor<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): IO<Env, OutErr, Either<OutDone, OutElem>> {
  switch (channelState._tag) {
    case ChannelStateTag.Effect:
      return channelState.effect.chain(() => toPullInterpret(exec.run(), exec));
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