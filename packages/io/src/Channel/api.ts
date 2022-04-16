import type { AsyncInputConsumer } from "@fncts/io/Channel/internal/AsyncInputConsumer";
import type { AsyncInputProducer } from "@fncts/io/Channel/internal/AsyncInputProducer";
import type { UpstreamPullRequest } from "@fncts/io/Channel/UpstreamPullRequest";

import { identity, tuple } from "@fncts/base/data/function";
import { ChildExecutorDecision } from "@fncts/io/Channel/ChildExecutorDecision";
import {
  BracketOut,
  Bridge,
  Channel,
  ConcatAll,
  ContinuationK,
  Defer,
  Emit,
  Ensuring,
  Fail,
  Fold,
  FromIO,
  PipeTo,
  Provide,
  Read,
} from "@fncts/io/Channel/definition";
import { UpstreamPullStrategy } from "@fncts/io/Channel/UpstreamPullStrategy";

/**
 * Returns a new channel that is the same as this one, except the terminal value of the channel
 * is the specified constant value.
 *
 * This method produces the same result as mapping this channel to the specified constant value.
 *
 * @tsplus fluent fncts.control.Channel as
 */
export function as_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, OutDone2>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  z2: Lazy<OutDone2>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2> {
  return self.map(() => z2());
}

/**
 * @tsplus static fncts.control.ChannelOps ask
 */
export function ask<Env>(): Channel<Env, unknown, unknown, unknown, never, never, Environment<Env>> {
  return Channel.fromIO(IO.environment<Env>());
}

/**
 * @tsplus getter fncts.control.Channel asUnit
 */
export function asUnit<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, void> {
  return self.as(undefined);
}

/**
 * @tsplus static fncts.control.ChannelOps acquireReleaseWith
 */
export function acquireReleaseWith_<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone, Acquired>(
  acquire: IO<Env, OutErr, Acquired>,
  use: (a: Acquired) => Channel<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone>,
  release: (a: Acquired) => URIO<Env, any>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone> {
  return Channel.acquireReleaseExitWith(acquire, use, (a, _) => release(a));
}

/**
 * @tsplus static fncts.control.ChannelOps acquireReleaseExitWith
 */
export function acquireReleaseExitWith_<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone, Acquired>(
  acquire: IO<Env, OutErr, Acquired>,
  use: (a: Acquired) => Channel<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone>,
  release: (a: Acquired, exit: Exit<OutErr, OutDone>) => URIO<Env, any>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone> {
  return Channel.fromIO(Ref.make<(exit: Exit<OutErr, OutDone>) => URIO<Env, any>>((_) => IO.unit)).flatMap((ref) =>
    Channel.fromIO(acquire.tap((a) => ref.set((exit) => release(a, exit))).uninterruptible)
      .flatMap(use)
      .ensuringWith((exit) => ref.get.flatMap((fin) => fin(exit))),
  );
}

/**
 * Construct a resource Channel with Acquire / Release
 *
 * @tsplus static fncts.control.ChannelOps acquireReleaseOut
 */
export function acquireReleaseOut_<Env, OutErr, Acquired, Z>(
  acquire: IO<Env, OutErr, Acquired>,
  release: (a: Acquired) => URIO<Env, Z>,
): Channel<Env, unknown, unknown, unknown, OutErr, Acquired, void> {
  return Channel.acquireReleaseOutExit(acquire, (z, _) => release(z));
}

/**
 * Construct a resource Channel with Acquire / Release
 *
 * @tsplus static fncts.control.ChannelOps acquireReleaseOutExit
 */
export function acquireReleaseOutExit_<R, R2, E, Z>(
  self: IO<R, E, Z>,
  release: (z: Z, e: Exit<unknown, unknown>) => URIO<R2, unknown>,
): Channel<R & R2, unknown, unknown, unknown, E, Z, void> {
  return new BracketOut<R & R2, E, Z, void>(self, release);
}

/**
 * Creates a channel backed by a buffer. When the buffer is empty, the channel will simply
 * passthrough its input as output. However, when the buffer is non-empty, the value inside
 * the buffer will be passed along as output.
 *
 * @tsplus static fncts.control.ChannelOps buffer
 */
export function buffer<InElem, InErr, InDone>(
  empty: InElem,
  isEmpty: Predicate<InElem>,
  ref: Ref<InElem>,
): Channel<unknown, InErr, InElem, InDone, InErr, InElem, InDone> {
  return Channel.unwrap(
    ref.modify((v) => {
      if (isEmpty(v)) {
        return tuple(
          readWith(
            (_in) => Channel.writeNow(_in).apSecond(Channel.buffer(empty, isEmpty, ref)),
            Channel.failNow,
            Channel.endNow,
          ),
          v,
        );
      } else {
        return tuple(Channel.writeNow(v).apSecond(Channel.buffer(empty, isEmpty, ref)), empty);
      }
    }),
  );
}

/**
 * @tsplus static fncts.control.ChannelOps bufferChunk
 */
export function bufferChunk<InElem, InErr, InDone>(
  ref: Ref<Conc<InElem>>,
): Channel<unknown, InErr, Conc<InElem>, InDone, InErr, Conc<InElem>, InDone> {
  return Channel.buffer(Conc.empty<InElem>(), (conc) => conc.isEmpty, ref);
}

/**
 * Returns a new channel that is the same as this one, except if this channel errors for any
 * typed error, then the returned channel will switch over to using the fallback channel returned
 * by the specified error handler.
 *
 * @tsplus fluent fncts.control.Channel catchAll
 */
export function catchAll_<
  Env,
  Env1,
  InErr,
  InErr1,
  InElem,
  InElem1,
  InDone,
  InDone1,
  OutErr,
  OutErr1,
  OutElem,
  OutElem1,
  OutDone,
  OutDone1,
>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (error: OutErr) => Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
): Channel<
  Env & Env1,
  InErr & InErr1,
  InElem & InElem1,
  InDone & InDone1,
  OutErr1,
  OutElem | OutElem1,
  OutDone | OutDone1
> {
  return self.catchAllCause((cause) =>
    cause.failureOrCause.match(
      (l) => f(l),
      (r) => Channel.failCauseNow(r),
    ),
  );
}

/**
 * Returns a new channel that is the same as this one, except if this channel errors for any
 * typed error, then the returned channel will switch over to using the fallback channel returned
 * by the specified error handler.
 *
 * @tsplus fluent fncts.control.Channel catchAllCause
 */
export function catchAllCause_<
  Env,
  Env1,
  InErr,
  InErr1,
  InElem,
  InElem1,
  InDone,
  InDone1,
  OutErr,
  OutErr1,
  OutElem,
  OutElem1,
  OutDone,
  OutDone1,
>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (cause: Cause<OutErr>) => Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
): Channel<
  Env & Env1,
  InErr & InErr1,
  InElem & InElem1,
  InDone & InDone1,
  OutErr1,
  OutElem | OutElem1,
  OutDone | OutDone1
> {
  return new Fold<
    Env & Env1,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr,
    OutErr1,
    OutElem | OutElem1,
    OutDone | OutDone1,
    OutDone | OutDone1
  >(self, new ContinuationK((_) => Channel.endNow(_), f));
}

/**
 * @tsplus getter fncts.control.Channel concatAll
 */
export function concatAll<Env, InErr, InElem, InDone, OutErr, OutElem>(
  channels: Channel<Env, InErr, InElem, InDone, OutErr, Channel<Env, InErr, InElem, InDone, OutErr, OutElem, any>, any>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, any> {
  return channels.concatAllWith(
    () => void 0,
    () => void 0,
  );
}

/**
 * Returns a new channel whose outputs are fed to the specified factory function, which creates
 * new channels in response. These new channels are sequentially concatenated together, and all
 * their outputs appear as outputs of the newly returned channel. The provided merging function
 * is used to merge the terminal values of all channels into the single terminal value of the
 * returned channel.
 *
 * @tsplus fluent fncts.control.Channel concatMapWith
 */
export function concatMapWith_<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutElem2,
  OutDone,
  OutDone2,
  OutDone3,
  Env2,
  InErr2,
  InElem2,
  InDone2,
  OutErr2,
>(
  channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2>,
  f: (o: OutElem) => Channel<Env2, InErr2, InElem2, InDone2, OutErr2, OutElem2, OutDone>,
  g: (o: OutDone, o1: OutDone) => OutDone,
  h: (o: OutDone, o2: OutDone2) => OutDone3,
): Channel<Env & Env2, InErr & InErr2, InElem & InElem2, InDone & InDone2, OutErr | OutErr2, OutElem2, OutDone3> {
  return new ConcatAll<
    Env & Env2,
    InErr & InErr2,
    InElem & InElem2,
    InDone & InDone2,
    OutErr | OutErr2,
    OutElem,
    OutElem2,
    OutDone,
    OutDone2,
    OutDone3
  >(
    g,
    h,
    () => UpstreamPullStrategy.PullAfterNext(Nothing()),
    () => ChildExecutorDecision.Continue,
    channel,
    f,
  );
}

/**
 * Returns a new channel whose outputs are fed to the specified factory function, which creates
 * new channels in response. These new channels are sequentially concatenated together, and all
 * their outputs appear as outputs of the newly returned channel. The provided merging function
 * is used to merge the terminal values of all channels into the single terminal value of the
 * returned channel.
 *
 * @tsplus fluent fncts.control.Channel concatMapWithCustom
 */
export function concatMapWithCustom_<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutElem2,
  OutDone,
  OutDone2,
  OutDone3,
  Env2,
  InErr2,
  InElem2,
  InDone2,
  OutErr2,
>(
  channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2>,
  f: (o: OutElem) => Channel<Env2, InErr2, InElem2, InDone2, OutErr2, OutElem2, OutDone>,
  g: (o: OutDone, o1: OutDone) => OutDone,
  h: (o: OutDone, o2: OutDone2) => OutDone3,
  onPull: (_: UpstreamPullRequest<OutElem>) => UpstreamPullStrategy<OutElem2>,
  onEmit: (_: OutElem2) => ChildExecutorDecision,
): Channel<Env & Env2, InErr & InErr2, InElem & InElem2, InDone & InDone2, OutErr | OutErr2, OutElem2, OutDone3> {
  return new ConcatAll<
    Env & Env2,
    InErr & InErr2,
    InElem & InElem2,
    InDone & InDone2,
    OutErr | OutErr2,
    OutElem,
    OutElem2,
    OutDone,
    OutDone2,
    OutDone3
  >(g, h, onPull, onEmit, channel, f);
}

/**
 * Concat sequentially a channel of channels
 *
 * @tsplus fluent fncts.control.Channel concatAllWith
 */
export function concatAllWith_<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutDone,
  OutDone2,
  OutDone3,
  Env2,
  InErr2,
  InElem2,
  InDone2,
  OutErr2,
>(
  channels: Channel<
    Env,
    InErr,
    InElem,
    InDone,
    OutErr,
    Channel<Env2, InErr2, InElem2, InDone2, OutErr2, OutElem, OutDone>,
    OutDone2
  >,
  f: (o: OutDone, o1: OutDone) => OutDone,
  g: (o: OutDone, o2: OutDone2) => OutDone3,
): Channel<Env & Env2, InErr & InErr2, InElem & InElem2, InDone & InDone2, OutErr | OutErr2, OutElem, OutDone3> {
  return new ConcatAll<
    Env & Env2,
    InErr & InErr2,
    InElem & InElem2,
    InDone & InDone2,
    OutErr | OutErr2,
    Channel<Env2, InErr2, InElem2, InDone2, OutErr2, OutElem, OutDone>,
    OutElem,
    OutDone,
    OutDone2,
    OutDone3
  >(
    f,
    g,
    () => UpstreamPullStrategy.PullAfterNext(Nothing()),
    () => ChildExecutorDecision.Continue,
    channels,
    identity,
  );
}

/**
 * Returns a new channel whose outputs are fed to the specified factory function, which creates
 * new channels in response. These new channels are sequentially concatenated together, and all
 * their outputs appear as outputs of the newly returned channel.
 *
 * @tsplus fluent fncts.control.Channel concatMap
 */
export function concatMap_<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutElem2,
  OutDone,
  OutDone2,
  Env2,
  InErr2,
  InElem2,
  InDone2,
  OutErr2,
>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2>,
  f: (o: OutElem) => Channel<Env2, InErr2, InElem2, InDone2, OutErr2, OutElem2, OutDone>,
): Channel<Env & Env2, InErr & InErr2, InElem & InElem2, InDone & InDone2, OutErr | OutErr2, OutElem2, unknown> {
  return self.concatMapWith(
    f,
    () => void 0,
    () => void 0,
  );
}

function contramapReader<InErr, InElem, InDone0, InDone>(
  f: (a: InDone0) => InDone,
): Channel<unknown, InErr, InElem, InDone0, InErr, InElem, InDone> {
  return readWith(
    (_in) => Channel.writeNow(_in).apSecond(contramapReader(f)),
    Channel.failNow,
    (done) => Channel.endNow(f(done)),
  );
}

/**
 * @tsplus fluent fncts.control.Channel contramap
 */
export function contramap_<Env, InErr, InElem, InDone0, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (a: InDone0) => InDone,
): Channel<Env, InErr, InElem, InDone0, OutErr, OutElem, OutDone> {
  return contramapReader<InErr, InElem, InDone0, InDone>(f).pipeTo(self);
}

function contramapInReader<InErr, InElem0, InElem, InDone>(
  f: (a: InElem0) => InElem,
): Channel<unknown, InErr, InElem0, InDone, InErr, InElem, InDone> {
  return readWith(
    (_in) => Channel.writeNow(f(_in)).apSecond(contramapInReader(f)),
    Channel.failNow,
    (done) => Channel.endNow(done),
  );
}

/**
 * @tsplus fluent fncts.control.Channel contramapIn
 */
export function contramapIn_<Env, InErr, InElem0, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (a: InElem0) => InElem,
): Channel<Env, InErr, InElem0, InDone, OutErr, OutElem, OutDone> {
  return contramapInReader<InErr, InElem0, InElem, InDone>(f).pipeTo(self);
}

function contramapIOReader<Env1, InErr, InElem, InDone0, InDone>(
  f: (i: InDone0) => IO<Env1, InErr, InDone>,
): Channel<Env1, InErr, InElem, InDone0, InErr, InElem, InDone> {
  return readWith(
    (_in) => Channel.writeNow(_in).apSecond(contramapIOReader(f)),
    Channel.failNow,
    (done0) => Channel.fromIO(f(done0)),
  );
}

/**
 * @tsplus fluent fncts.control.Channel contramapIO
 */
export function contramapIO_<Env, Env1, InErr, InElem, InDone0, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (i: InDone0) => IO<Env1, InErr, InDone>,
): Channel<Env1 & Env, InErr, InElem, InDone0, OutErr, OutElem, OutDone> {
  return contramapIOReader<Env1, InErr, InElem, InDone0, InDone>(f).pipeTo(self);
}

function contramapInIOReader<Env1, InErr, InElem0, InElem, InDone>(
  f: (a: InElem0) => IO<Env1, InErr, InElem>,
): Channel<Env1, InErr, InElem0, InDone, InErr, InElem, InDone> {
  return Channel.readWith(
    (inp) => Channel.fromIO(f(inp)).flatMap(Channel.writeNow).apSecond(contramapInIOReader(f)),
    Channel.failNow,
    Channel.endNow,
  );
}

/**
 * @tsplus fluent fncts.control.Channel contramapInIO
 */
export function contramapInIO_<Env, Env1, InErr, InElem0, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (a: InElem0) => IO<Env1, InErr, InElem>,
): Channel<Env1 & Env, InErr, InElem0, InDone, OutErr, OutElem, OutDone> {
  return contramapInIOReader<Env1, InErr, InElem0, InElem, InDone>(f).pipeTo(self);
}

/**
 * @tsplus static fncts.control.ChannelOps defer
 */
export function defer<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  effect: Lazy<Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return new Defer(effect);
}

function doneCollectReader<Env, OutErr, OutElem, OutDone>(
  builder: ConcBuilder<OutElem>,
): Channel<Env, OutErr, OutElem, OutDone, OutErr, never, OutDone> {
  return Channel.readWith(
    (out) =>
      Channel.fromIO(
        IO.succeed(() => {
          builder.append(out);
        }),
      ).apSecond(doneCollectReader(builder)),
    Channel.failNow,
    Channel.endNow,
  );
}

/**
 * Returns a new channel, which is the same as this one, except that all the outputs are
 * collected and bundled into a tuple together with the terminal value of this channel.
 *
 * As the channel returned from this channel collects all of this channels output into an in-
 * memory chunk, it is not safe to call this method on channels that output a large or unbounded
 * number of values.
 *
 * @tsplus getter fncts.control.Channel doneCollect
 */
export function doneCollect<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): Channel<Env, InErr, InElem, InDone, OutErr, never, readonly [Conc<OutElem>, OutDone]> {
  return Channel.unwrap(
    IO.succeed(() => {
      const builder = Conc.builder<OutElem>();

      return self.pipeTo(doneCollectReader(builder)).mapIO((z) => IO.succeedNow(tuple(builder.result(), z)));
    }),
  );
}

/**
 * Returns a new channel which reads all the elements from upstream's output channel
 * and ignores them, then terminates with the upstream result value.
 *
 * @tsplus getter fncts.control.Channel drain
 */
export function drain<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): Channel<Env, InErr, InElem, InDone, OutErr, never, OutDone> {
  const drainer: Channel<Env, OutErr, OutElem, OutDone, OutErr, never, OutDone> = Channel.readWithCause(
    (_) => drainer,
    Channel.failCauseNow,
    Channel.endNow,
  );
  return channel.pipeTo(drainer);
}

/**
 * Returns a new channel that collects the output and terminal value of this channel, which it
 * then writes as output of the returned channel.
 *
 * @tsplus getter fncts.control.Channel emitCollect
 */
export function emitCollect<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): Channel<Env, InErr, InElem, InDone, OutErr, readonly [Conc<OutElem>, OutDone], void> {
  return self.doneCollect.flatMap((t) => Channel.writeNow(t));
}

/**
 * @tsplus fluent fncts.control.Channel ensuring
 */
export function ensuring_<Env, Env1, InErr, InElem, InDone, OutErr, OutElem, OutDone, Z>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  finalizer: URIO<Env1, Z>,
): Channel<Env & Env1, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return self.ensuringWith(() => finalizer);
}

/**
 * Returns a new channel with an attached finalizer. The finalizer is guaranteed to be executed
 * so long as the channel begins execution (and regardless of whether or not it completes).
 *
 * @tsplus fluent fncts.control.Channel ensuringWith
 */
export function ensuringWith_<Env, Env2, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  finalizer: (e: Exit<OutErr, OutDone>) => IO<Env2, never, unknown>,
): Channel<Env & Env2, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return new Ensuring<Env & Env2, InErr, InElem, InDone, OutErr, OutElem, OutDone>(channel, finalizer);
}

/**
 * Embed inputs from continuos pulling of a producer
 *
 * @tsplus fluent fncts.control.Channel embedInput
 */
export function embedInput_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, unknown, unknown, unknown, OutErr, OutElem, OutDone>,
  input: AsyncInputProducer<InErr, InElem, InDone>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return new Bridge(input, self);
}

/**
 * Halt a channel with the specified error
 *
 * @tsplus static fncts.control.ChannelOps fail
 */
export function fail<E>(error: Lazy<E>): Channel<unknown, unknown, unknown, unknown, E, never, never> {
  return new Fail(() => Cause.fail(error()));
}

/**
 * Halt a channel with the specified error
 *
 * @tsplus static fncts.control.ChannelOps failNow
 */
export function failNow<E>(error: E): Channel<unknown, unknown, unknown, unknown, E, never, never> {
  return new Fail(() => Cause.fail(error));
}

/**
 * Returns a new channel, which flattens the terminal value of this channel. This function may
 * only be called if the terminal value of this channel is another channel of compatible types.
 *
 * @tsplus getter fncts.control.Channel flatten
 */
export function flatten<
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
  OutDone2,
>(
  self: Channel<
    Env,
    InErr,
    InElem,
    InDone,
    OutErr,
    OutElem,
    Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone2>
  >,
): Channel<
  Env & Env1,
  InErr & InErr1,
  InElem & InElem1,
  InDone & InDone1,
  OutErr | OutErr1,
  OutElem | OutElem1,
  OutDone2
> {
  return self.flatMap(identity);
}

/**
 * @tsplus static fncts.control.ChannelOps fromEither
 */
export function fromEither<E, A>(either: Lazy<Either<E, A>>): Channel<unknown, unknown, unknown, unknown, E, never, A> {
  return Channel.defer(either().match(Channel.failNow, Channel.succeedNow));
}

/**
 * @tsplus static fncts.control.ChannelOps fromInput
 */
export function fromInput<Err, Elem, Done>(
  input: AsyncInputConsumer<Err, Elem, Done>,
): Channel<unknown, unknown, unknown, unknown, Err, Elem, Done> {
  return unwrap(
    input.takeWith(Channel.failCauseNow, (elem) => Channel.writeNow(elem).apSecond(fromInput(input)), Channel.endNow),
  );
}

/**
 * Use an effect to end a channel
 *
 * @tsplus static fncts.control.ChannelOps fromIO
 */
export function fromIO<R, E, A>(io: IO<R, E, A>): Channel<R, unknown, unknown, unknown, E, never, A> {
  return new FromIO(io);
}

/**
 * @tsplus static fncts.control.ChannelOps fromOption
 */
export function fromOption<A>(option: Lazy<Maybe<A>>): Channel<unknown, unknown, unknown, unknown, Nothing, never, A> {
  return Channel.defer(option().match(() => Channel.failNow(Nothing() as Nothing), Channel.succeedNow));
}

/**
 * @tsplus static fncts.control.ChannelOps fromQueue
 */
export function fromQueue<Err, Elem, Done>(
  queue: Queue.Dequeue<Either<Exit<Err, Done>, Elem>>,
): Channel<unknown, unknown, unknown, unknown, Err, Elem, Done> {
  return Channel.fromIO(queue.take).flatMap((_) =>
    _.match(
      (_) => _.match(Channel.failCauseNow, Channel.endNow),
      (elem) => Channel.writeNow(elem).apSecond(Channel.fromQueue(queue)),
    ),
  );
}

/**
 * Provides the channel with its required environment, which eliminates
 * its dependency on `Env`.
 *
 * @tsplus fluent fncts.control.Channel provideEnvironment
 */
export function provideEnvironment_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  env: Environment<Env>,
): Channel<unknown, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return new Provide(env, self);
}

/**
 * @tsplus fluent fncts.control.Channel contramapEnvironment
 */
export function contramapEnvironment_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, Env0>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (env0: Environment<Env0>) => Environment<Env>,
): Channel<Env0, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return Channel.ask<Env0>().flatMap((env0) => self.provideEnvironment(f(env0)));
}

/**
 * Halt a channel with the specified exception
 *
 * @tsplus static fncts.control.ChannelOps haltNow
 */
export function haltNow(defect: unknown): Channel<unknown, unknown, unknown, unknown, never, never, never> {
  return new Fail(() => Cause.halt(defect));
}

/**
 * Halt a channel with the specified exception
 *
 * @tsplus static fncts.control.ChannelOps halt
 */
export function halt(defect: Lazy<unknown>): Channel<unknown, unknown, unknown, unknown, never, never, never> {
  return new Fail(() => Cause.halt(defect()));
}

/**
 * @tsplus static fncts.control.ChannelOps id
 */
export function id<Err, Elem, Done>(): Channel<unknown, Err, Elem, Done, Err, Elem, Done> {
  return Channel.readWith((_in) => write(_in).apSecond(id<Err, Elem, Done>()), Channel.failNow, Channel.endNow);
}

/**
 * @tsplus static fncts.control.ChannelOps interrupt
 */
export function interrupt(fiberId: FiberId): Channel<unknown, unknown, unknown, unknown, never, never, never> {
  return Channel.failCauseNow(Cause.interrupt(fiberId));
}

/**
 * Use a managed to emit an output element
 *
 * @tsplus static fncts.control.ChannelOps scoped
 */
export function scoped<R, E, A>(
  io: Lazy<IO<R & Has<Scope>, E, A>>,
): Channel<R, unknown, unknown, unknown, E, A, unknown> {
  return Channel.acquireReleaseOutExit(
    Scope.make.flatMap((scope) =>
      IO.uninterruptibleMask(({ restore }) =>
        restore(scope.extend(io)).matchCauseIO(
          (cause) => scope.close(Exit.failCause(cause)) > IO.failCauseNow(cause),
          (out) => IO.succeedNow(tuple(out, scope)),
        ),
      ),
    ),
    ([_, scope], exit) => scope.close(exit),
  ).mapOut(([a]) => a);
}

/**
 * Returns a new channel, which is the same as this one, except the failure value of the returned
 * channel is created by applying the specified function to the failure value of this channel.
 *
 * @tsplus fluent fncts.control.Channel mapError
 */
export function mapError_<Env, InErr, InElem, InDone, OutErr, OutErr2, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (err: OutErr) => OutErr2,
): Channel<Env, InErr, InElem, InDone, OutErr2, OutElem, OutDone> {
  return self.mapErrorCause((cause) => cause.map(f));
}

/**
 * A more powerful version of `mapError` which also surfaces the `Cause` of the channel failure
 *
 * @tsplus fluent fncts.control.Channel mapErrorCause
 */
export function mapErrorCause_<Env, InErr, InElem, InDone, OutErr, OutErr2, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (cause: Cause<OutErr>) => Cause<OutErr2>,
): Channel<Env, InErr, InElem, InDone, OutErr2, OutElem, OutDone> {
  return self.catchAllCause((cause) => Channel.failCauseNow(f(cause)));
}

/**
 * Returns a new channel, which is the same as this one, except the terminal value of the
 * returned channel is created by applying the specified effectful function to the terminal value
 * of this channel.
 *
 * @tsplus fluent fncts.control.Channel mapIO
 */
export function mapIO_<Env, Env1, InErr, InElem, InDone, OutErr, OutErr1, OutElem, OutDone, OutDone1>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (o: OutDone) => IO<Env1, OutErr1, OutDone1>,
): Channel<Env & Env1, InErr, InElem, InDone, OutErr | OutErr1, OutElem, OutDone1> {
  return self.flatMap((outDone) => Channel.fromIO(f(outDone)));
}

/**
 * Maps the output of this channel using f
 *
 * @tsplus fluent fncts.control.Channel mapOut
 */
export function mapOut_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, OutElem2>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (o: OutElem) => OutElem2,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem2, OutDone> {
  const reader: Channel<Env, OutErr, OutElem, OutDone, OutErr, OutElem2, OutDone> = readWith(
    (out) => Channel.writeNow(f(out)).apSecond(reader),
    Channel.failNow,
    Channel.endNow,
  );

  return self.pipeTo(reader);
}

const mapOutIOReader = <Env, Env1, OutErr, OutErr1, OutElem, OutElem1, OutDone>(
  f: (o: OutElem) => IO<Env1, OutErr1, OutElem1>,
): Channel<Env & Env1, OutErr, OutElem, OutDone, OutErr | OutErr1, OutElem1, OutDone> =>
  Channel.readWith(
    (out) => Channel.fromIO(f(out)).flatMap(Channel.writeNow).apSecond(mapOutIOReader(f)),
    Channel.failNow,
    Channel.endNow,
  );

/**
 * @tsplus fluent fncts.control.Channel mapOutIO
 */
export function mapOutIO_<Env, Env1, InErr, InElem, InDone, OutErr, OutErr1, OutElem, OutElem1, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (o: OutElem) => IO<Env1, OutErr1, OutElem1>,
): Channel<Env & Env1, InErr, InElem, InDone, OutErr | OutErr1, OutElem1, OutDone> {
  return pipeTo_(self, mapOutIOReader(f));
}

/**
 * Fold the channel exposing success and full error cause
 *
 * @tsplus fluent fncts.control.Channel matchCauseChannel
 */
export function matchCauseChannel_<
  Env,
  Env1,
  Env2,
  InErr,
  InErr1,
  InErr2,
  InElem,
  InElem1,
  InElem2,
  InDone,
  InDone1,
  InDone2,
  OutErr,
  OutErr2,
  OutErr3,
  OutElem,
  OutElem1,
  OutElem2,
  OutDone,
  OutDone2,
  OutDone3,
>(
  channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  onError: (c: Cause<OutErr>) => Channel<Env1, InErr1, InElem1, InDone1, OutErr2, OutElem1, OutDone2>,
  onSuccess: (o: OutDone) => Channel<Env2, InErr2, InElem2, InDone2, OutErr3, OutElem2, OutDone3>,
): Channel<
  Env & Env1 & Env2,
  InErr & InErr1 & InErr2,
  InElem & InElem1 & InElem2,
  InDone & InDone1 & InDone2,
  OutErr2 | OutErr3,
  OutElem | OutElem1 | OutElem2,
  OutDone2 | OutDone3
> {
  return new Fold<
    Env & Env1 & Env2,
    InErr & InErr1 & InErr2,
    InElem & InElem1 & InElem2,
    InDone & InDone1 & InDone2,
    OutErr,
    OutErr2 | OutErr3,
    OutElem | OutElem1 | OutElem2,
    OutDone,
    OutDone2 | OutDone3
  >(
    channel,
    new ContinuationK<
      Env & Env1 & Env2,
      InErr & InErr1 & InErr2,
      InElem & InElem1 & InElem2,
      InDone & InDone1 & InDone2,
      OutErr,
      OutErr2 | OutErr3,
      OutElem | OutElem1 | OutElem2,
      OutDone,
      OutDone2 | OutDone3
    >(onSuccess, onError),
  );
}

export const never: Channel<unknown, unknown, unknown, unknown, never, never, never> = Channel.fromIO(IO.never);

/**
 * Returns a new channel that will perform the operations of this one, until failure, and then
 * it will switch over to the operations of the specified fallback channel.
 *
 * @tsplus fluent fncts.control.Channel orElse
 */
export function orElse_<
  Env,
  Env1,
  InErr,
  InErr1,
  InElem,
  InElem1,
  InDone,
  InDone1,
  OutErr,
  OutErr1,
  OutElem,
  OutElem1,
  OutDone,
  OutDone1,
>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
): Channel<
  Env & Env1,
  InErr & InErr1,
  InElem & InElem1,
  InDone & InDone1,
  OutErr1,
  OutElem | OutElem1,
  OutDone | OutDone1
> {
  return self.catchAll((_) => that);
}

/**
 * @tsplus fluent fncts.control.Channel orHalt
 */
export function orHalt_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, E>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  err: E,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return self.orHaltWith(() => err);
}

/**
 * @tsplus fluent fncts.control.Channel orHaltWith
 */
export function orHaltWith_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, E>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (e: OutErr) => E,
): Channel<Env, InErr, InElem, InDone, never, OutElem, OutDone> {
  return self.catchAll((e) => Channel.haltNow(f(e)));
}

/**
 * Pipe the output of a channel into the input of another
 *
 * @tsplus fluent fncts.control.Channel pipeTo
 */
export function pipeTo_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, Env1, OutErr1, OutElem1, OutDone1>(
  left: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  right: Channel<Env1, OutErr, OutElem, OutDone, OutErr1, OutElem1, OutDone1>,
): Channel<Env & Env1, InErr, InElem, InDone, OutErr1, OutElem1, OutDone1> {
  return new PipeTo<Env & Env1, InErr, InElem, InDone, OutErr, OutErr1, OutElem, OutElem1, OutDone, OutDone1>(
    () => left,
    () => right,
  );
}

const ChannelFailureTypeId = Symbol.for("@principia/base/Channel/ChannelFailure");
class ChannelFailure<E> {
  readonly _typeId = ChannelFailureTypeId;
  constructor(readonly error: E) {}
}

function isChannelFailure<E>(u: unknown): u is ChannelFailure<E> {
  return hasTypeId(u, ChannelFailureTypeId);
}

/**
 * @tsplus fluent fncts.control.Channel pipeToOrFail
 */
export function pipeToOrFail_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, Env1, OutErr1, OutElem1, OutDone1>(
  left: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  right: Channel<Env1, never, OutElem, OutDone, OutErr1, OutElem1, OutDone1>,
): Channel<Env & Env1, InErr, InElem, InDone, OutErr | OutErr1, OutElem1, OutDone1> {
  return left
    .catchAll((err) => Channel.failCauseNow(Cause.halt(new ChannelFailure(err))))
    .pipeTo(right)
    .catchAllCause((cause) =>
      cause.isHalt() && isChannelFailure(cause.value)
        ? Channel.failNow(cause.value.error as OutErr)
        : Channel.haltNow(cause),
    );
}

/**
 * @tsplus static fncts.control.ChannelOps read
 */
export function read<In>(): Channel<unknown, unknown, In, unknown, Nothing, never, In> {
  return Channel.readOrFail(Nothing() as Nothing);
}

/**
 * @tsplus static fncts.control.ChannelOps readOrFail
 */
export function readOrFail<In, E>(e: E): Channel<unknown, unknown, In, unknown, E, never, In> {
  return new Read<unknown, unknown, In, unknown, never, E, never, never, In>(
    Channel.endNow,
    new ContinuationK(
      () => Channel.failNow(e),
      () => Channel.failNow(e),
    ),
  );
}

/**
 * Reads an input and continue exposing both full error cause and completion
 *
 * @tsplus static fncts.control.ChannelOps readWithCause
 */
export function readWithCause<
  Env,
  Env1,
  Env2,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutErr1,
  OutErr2,
  OutElem,
  OutElem1,
  OutElem2,
  OutDone,
  OutDone1,
  OutDone2,
>(
  inp: (i: InElem) => Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  halt: (e: Cause<InErr>) => Channel<Env1, InErr, InElem, InDone, OutErr1, OutElem1, OutDone1>,
  done: (d: InDone) => Channel<Env2, InErr, InElem, InDone, OutErr2, OutElem2, OutDone2>,
): Channel<
  Env & Env1 & Env2,
  InErr,
  InElem,
  InDone,
  OutErr | OutErr1 | OutErr2,
  OutElem | OutElem1 | OutElem2,
  OutDone | OutDone1 | OutDone2
> {
  return new Read<
    Env & Env1 & Env2,
    InErr,
    InElem,
    InDone,
    InErr,
    OutErr | OutErr1 | OutErr2,
    OutElem | OutElem1 | OutElem2,
    InDone,
    OutDone | OutDone1 | OutDone2
  >(
    inp,
    new ContinuationK<
      Env & Env1 & Env2,
      InErr,
      InElem,
      InDone,
      InErr,
      OutErr | OutErr1 | OutErr2,
      OutElem | OutElem1 | OutElem2,
      InDone,
      OutDone | OutDone1 | OutDone2
    >(done, halt),
  );
}

/**
 * Reads an input and continue exposing both error and completion
 *
 * @tsplus static fncts.control.ChannelOps readWith
 */
export function readWith<
  Env,
  Env1,
  Env2,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutErr1,
  OutErr2,
  OutElem,
  OutElem1,
  OutElem2,
  OutDone,
  OutDone1,
  OutDone2,
>(
  inp: (i: InElem) => Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  error: (e: InErr) => Channel<Env1, InErr, InElem, InDone, OutErr1, OutElem1, OutDone1>,
  done: (d: InDone) => Channel<Env2, InErr, InElem, InDone, OutErr2, OutElem2, OutDone2>,
): Channel<
  Env & Env1 & Env2,
  InErr,
  InElem,
  InDone,
  OutErr | OutErr1 | OutErr2,
  OutElem | OutElem1 | OutElem2,
  OutDone | OutDone1 | OutDone2
> {
  return Channel.readWithCause(inp, (c) => c.failureOrCause.match(error, Channel.failCauseNow), done);
}

/**
 * Repeats this channel forever
 *
 * @tsplus getter fncts.control.Channel repeated
 */
export function repeated<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return self.flatMap(() => self.repeated);
}

/**
 * @tsplus static fncts.control.Channel toQueue
 */
export function toQueue<Err, Done, Elem>(
  queue: Queue.Enqueue<Either<Exit<Err, Done>, Elem>>,
): Channel<unknown, Err, Elem, Done, never, never, any> {
  return readWithCause(
    (in_: Elem) => Channel.fromIO(queue.offer(Either.right(in_))).apSecond(toQueue(queue)),
    (cause: Cause<Err>) => Channel.fromIO(queue.offer(Either.left(Exit.failCause(cause)))),
    (done: Done) => Channel.fromIO(queue.offer(Either.left(Exit.succeed(done)))),
  );
}

/**
 * Writes an output to the channel
 *
 * @tsplus static fncts.control.ChannelOps write
 */
export function write<OutElem>(out: Lazy<OutElem>): Channel<unknown, unknown, unknown, unknown, never, OutElem, void> {
  return new Emit(out);
}

/**
 * @tsplus static fncts.control.ChannelOps writeAll
 */
export function writeAll<Out>(outs: ReadonlyArray<Out>): Channel<unknown, unknown, unknown, unknown, never, Out, void> {
  return Channel.writeChunk(Conc.from(outs));
}

function writeChunkWriter<Out>(
  outs: Conc<Out>,
  idx: number,
  len: number,
): Channel<unknown, unknown, unknown, unknown, never, Out, void> {
  if (idx === len) return Channel.unit;
  return Channel.writeNow(outs.unsafeGet(idx)).apSecond(writeChunkWriter(outs, idx + 1, len));
}

/**
 * @tsplus static fncts.control.ChannelOps writeChunk
 */
export function writeChunk<Out>(outs: Conc<Out>): Channel<unknown, unknown, unknown, unknown, never, Out, void> {
  return writeChunkWriter(outs, 0, outs.length);
}

/**
 * Writes an output to the channel
 *
 * @tsplus static fncts.control.ChannelOps writeNow
 */
export function writeNow<OutElem>(out: OutElem): Channel<unknown, unknown, unknown, unknown, never, OutElem, void> {
  return new Emit(() => out);
}

/**
 * @tsplus static fncts.control.ChannelOps unit
 */
export const unit: Channel<unknown, unknown, unknown, unknown, never, never, void> = Channel.endNow(undefined);

/**
 * Makes a channel from an effect that returns a channel in case of success
 *
 * @tsplus static fncts.control.ChannelOps unwrap
 */
export function unwrap<R, E, Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: IO<R, E, Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>>,
): Channel<R & Env, InErr, InElem, InDone, E | OutErr, OutElem, OutDone> {
  return Channel.fromIO(self).flatten;
}

/**
 * Makes a channel from a managed that returns a channel in case of success
 *
 * @tsplus static fncts.control.ChannelOps unwrapScoped
 */
export function unwrapScoped<R, E, Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: IO<R & Has<Scope>, E, Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>>,
): Channel<R & Env, InErr, InElem, InDone, E | OutErr, OutElem, OutDone> {
  return Channel.scoped(self).concatAllWith(
    (d, _) => d,
    (d, _) => d,
  );
}
