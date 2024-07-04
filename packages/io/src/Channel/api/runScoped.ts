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
        return channelState.effect.flatMap(() => runScopedInterpret(exec.run(), exec));
      }
      case ChannelStateTag.Emit: {
         
        channelState = exec.run();
        break;
      }
      case ChannelStateTag.Done: {
        return IO.fromExit(exec.getDone());
      }
      case ChannelStateTag.Read: {
        return readUpstream(
          channelState,
          () => runScopedInterpret(exec.run(), exec),
          (cause) => IO.refailCause(cause),
        );
      }
    }
  }
  throw new Error("Bug");
}

/**
 * Runs a channel until the end is received
 *
 * @tsplus getter fncts.io.Channel runScoped
 */
export function runScoped<Env, InErr, InDone, OutErr, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, never, OutDone>,
): IO<Env | Scope, OutErr, OutDone> {
  const run = (channelFuture: Future<OutErr, OutDone>, scopeFuture: Future<never, void>, scope: Scope) =>
    IO.acquireReleaseExit(IO.succeed(new ChannelExecutor(() => self, null, identity)), (exec, exit) => {
      const finalize = exec.close(exit);
      if (finalize !== null) {
        return finalize.tapErrorCause((cause) => scope.addFinalizer(IO.refailCause(cause)));
      } else {
        return IO.unit;
      }
    }).flatMap((exec) =>
      IO.defer(runScopedInterpret(exec.run(), exec).fulfill(channelFuture) > channelFuture.await < scopeFuture.await),
    );

  return IO.uninterruptibleMask((restore) =>
    Do((Δ) => {
      const parent        = Δ(IO.scope);
      const child         = Δ(parent.fork);
      const channelFuture = Δ(Future.make<OutErr, OutDone>());
      const scopeFuture   = Δ(Future.make<never, void>());
      const fiber         = Δ(restore(run(channelFuture, scopeFuture, child)).forkScoped);
      Δ(IO.addFinalizer(scopeFuture.succeed(undefined)));
      const done = Δ(restore(channelFuture.await));
      Δ(fiber.inheritAll);
      return done;
    }),
  );
}
