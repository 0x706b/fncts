import type { Has } from "../../../prelude.js";
import type { Scope } from "../../Scope.js";
import type { Channel } from "../definition.js";
import type { ChannelState } from "../internal/ChannelState.js";

import { identity } from "../../../data/function.js";
import { IO } from "../../IO.js";
import { ChannelExecutor, readUpstream } from "../internal/ChannelExecutor.js";
import { ChannelStateTag } from "../internal/ChannelState.js";

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
    (exec, exit) => exec.close(exit) || IO.unit,
  ).chain((exec) => IO.defer(runScopedInterpret(exec.run(), exec)));
}
