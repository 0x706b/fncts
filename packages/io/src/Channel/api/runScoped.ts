import type { ChannelState } from "@fncts/io/Channel/internal/ChannelState";

import { identity } from "@fncts/base/data/function";
import { ChannelExecutor, readUpstream } from "@fncts/io/Channel/internal/ChannelExecutor";
import { ChannelStateTag } from "@fncts/io/Channel/internal/ChannelState";

function runScopedInterpret<Env, InErr, InDone, OutErr, OutDone>(
  channelState: ChannelState<Env, OutErr>,
  exec: ChannelExecutor<Env, InErr, unknown, InDone, OutErr, never, OutDone>,
): IO<Env, OutErr, OutDone> {
  // eslint-disable-next-line no-constant-condition
  while (1) {
    switch (channelState._tag) {
      case ChannelStateTag.Effect: {
        return channelState.effect.chain(() => runScopedInterpret(exec.run(), exec));
      }
      case ChannelStateTag.Emit: {
        // eslint-disable-next-line no-param-reassign
        channelState = exec.run();
        break;
      }
      case ChannelStateTag.Done: {
        return IO.fromExit(exec.getDone());
      }
      case ChannelStateTag.Read: {
        return readUpstream(channelState, () => runScopedInterpret(exec.run(), exec));
      }
    }
  }
  throw new Error("Bug");
}

/**
 * Runs a channel until the end is received
 *
 * @tsplus getter fncts.control.Channel runScoped
 */
export function runScoped<Env, InErr, InDone, OutErr, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, never, OutDone>,
): IO<Env & Has<Scope>, OutErr, OutDone> {
  return IO.acquireReleaseExit(
    IO.succeed(new ChannelExecutor(() => self, null, identity)),
    (exec, exit) => exec.close(exit) ?? IO.unit,
  ).chain((exec) => IO.defer(runScopedInterpret(exec.run(), exec)));
}
