import type { AsyncInputConsumer } from "@fncts/io/Channel/internal/AsyncInputConsumer";
import type { AsyncInputProducer } from "@fncts/io/Channel/internal/AsyncInputProducer";
import type { UpstreamPullRequest } from "@fncts/io/Channel/UpstreamPullRequest";

import { identity, tuple } from "@fncts/base/data/function";
import { ChildExecutorDecision } from "@fncts/io/Channel/ChildExecutorDecision";
import {
  BracketOut,
  Bridge,
  Channel,
  ChannelPrimitive,
  ChannelTag,
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
 * @tsplus pipeable fncts.io.Channel as
 */
export function as_<OutDone2>(z2: Lazy<OutDone2>) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2> => {
    return self.map(() => z2());
  };
}

/**
 * @tsplus static fncts.io.ChannelOps ask
 */
export function ask<Env>(): Channel<Env, unknown, unknown, unknown, never, never, Environment<Env>> {
  return Channel.fromIO(IO.environment<Env>());
}

/**
 * @tsplus getter fncts.io.Channel asUnit
 */
export function asUnit<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, void> {
  return self.as(undefined);
}

/**
 * @tsplus static fncts.io.ChannelOps acquireReleaseWith
 */
export function acquireReleaseWith<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone, Acquired>(
  acquire: IO<Env, OutErr, Acquired>,
  use: (a: Acquired) => Channel<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone>,
  release: (a: Acquired) => URIO<Env, any>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone> {
  return Channel.acquireReleaseExitWith(acquire, use, (a, _) => release(a));
}

/**
 * @tsplus static fncts.io.ChannelOps acquireReleaseExitWith
 */
export function acquireReleaseExitWith<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone, Acquired>(
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
 * @tsplus static fncts.io.ChannelOps acquireReleaseOutWith
 */
export function acquireReleaseOutWith<Env, OutErr, Acquired, Z>(
  acquire: IO<Env, OutErr, Acquired>,
  release: (a: Acquired) => URIO<Env, Z>,
): Channel<Env, unknown, unknown, unknown, OutErr, Acquired, void> {
  return Channel.acquireReleaseOutExitWith(acquire, (z, _) => release(z));
}

/**
 * Construct a resource Channel with Acquire / Release
 *
 * @tsplus static fncts.io.ChannelOps acquireReleaseOutExitWith
 */
export function acquireReleaseOutExitWith<R, R2, E, Z>(
  self: IO<R, E, Z>,
  release: (z: Z, e: Exit<unknown, unknown>) => URIO<R2, unknown>,
): Channel<R | R2, unknown, unknown, unknown, E, Z, void> {
  const op = new ChannelPrimitive(ChannelTag.BracketOut);
  op.i0    = self;
  op.i1    = release;
  return op as any;
}

/**
 * Creates a channel backed by a buffer. When the buffer is empty, the channel will simply
 * passthrough its input as output. However, when the buffer is non-empty, the value inside
 * the buffer will be passed along as output.
 *
 * @tsplus static fncts.io.ChannelOps buffer
 */
export function buffer<InElem, InErr, InDone>(
  empty: InElem,
  isEmpty: Predicate<InElem>,
  ref: Ref<InElem>,
): Channel<never, InErr, InElem, InDone, InErr, InElem, InDone> {
  return Channel.unwrap(
    ref.modify((v) => {
      if (isEmpty(v)) {
        return tuple(
          readWith(
            (_in: InElem) => Channel.writeNow(_in).zipRight(Channel.buffer<InElem, InErr, InDone>(empty, isEmpty, ref)),
            (err: InErr) => Channel.failNow(err),
            (done: InDone) => Channel.endNow(done),
          ),
          v,
        );
      } else {
        return tuple(Channel.writeNow(v).zipRight(Channel.buffer<InElem, InErr, InDone>(empty, isEmpty, ref)), empty);
      }
    }),
  );
}

/**
 * @tsplus static fncts.io.ChannelOps bufferChunk
 */
export function bufferChunk<InElem, InErr, InDone>(
  ref: Ref<Conc<InElem>>,
): Channel<never, InErr, Conc<InElem>, InDone, InErr, Conc<InElem>, InDone> {
  return Channel.buffer(Conc.empty<InElem>(), (conc) => conc.isEmpty, ref);
}

/**
 * Returns a new channel that is the same as this one, except if this channel errors for any
 * typed error, then the returned channel will switch over to using the fallback channel returned
 * by the specified error handler.
 *
 * @tsplus pipeable fncts.io.Channel catchAll
 */
export function catchAll<Env1, InErr1, InElem1, InDone1, OutErr, OutErr1, OutElem1, OutDone1>(
  f: (error: OutErr) => Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env | Env1,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr1,
    OutElem | OutElem1,
    OutDone | OutDone1
  > => {
    return self.catchAllCause((cause) =>
      cause.failureOrCause.match({
        Left: (l) => f(l),
        Right: (r) => Channel.failCauseNow(r),
      }),
    );
  };
}

/**
 * Returns a new channel that is the same as this one, except if this channel errors for any
 * typed error, then the returned channel will switch over to using the fallback channel returned
 * by the specified error handler.
 *
 * @tsplus pipeable fncts.io.Channel catchAllCause
 */
export function catchAllCause<Env1, InErr1, InElem1, InDone1, OutErr, OutErr1, OutElem1, OutDone1>(
  f: (cause: Cause<OutErr>) => Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env | Env1,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr1,
    OutElem | OutElem1,
    OutDone | OutDone1
  > => {
    const op           = new ChannelPrimitive(ChannelTag.Fold);
    const continuation = new ChannelPrimitive(ChannelTag.ContinuationK);

    continuation.i0 = Channel.endNow;
    continuation.i1 = f;

    op.i0 = self;
    op.i1 = continuation;

    return op as any;
  };
}

/**
 * @tsplus getter fncts.io.Channel collectElements
 */
export function collectElements<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): Channel<Env, InErr, InElem, InDone, OutErr, never, readonly [Conc<OutElem>, OutDone]> {
  return Channel.defer(() => {
    const builder = new ConcBuilder<OutElem>(Conc.empty());
    const reader: Channel<Env, OutErr, OutElem, OutDone, OutErr, never, OutDone> = Channel.readWith(
      (out) => Channel.succeed(builder.append(out)) > reader,
      Channel.failNow,
      Channel.succeedNow,
    );
    return self.pipeTo(reader).flatMap((z) => Channel.succeedNow([builder.result(), z]));
  });
}

/**
 * @tsplus getter fncts.io.Channel concatAll
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
 * @tsplus pipeable fncts.io.Channel concatMapWith
 */
export function concatMapWith<OutElem, OutElem2, OutDone, OutDone2, OutDone3, Env2, InErr2, InElem2, InDone2, OutErr2>(
  f: (o: OutElem) => Channel<Env2, InErr2, InElem2, InDone2, OutErr2, OutElem2, OutDone>,
  g: (o: OutDone, o1: OutDone) => OutDone,
  h: (o: OutDone, o2: OutDone2) => OutDone3,
) {
  return <Env, InErr, InElem, InDone, OutErr>(
    channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2>,
  ): Channel<Env | Env2, InErr & InErr2, InElem & InElem2, InDone & InDone2, OutErr | OutErr2, OutElem2, OutDone3> => {
    const op = new ChannelPrimitive(ChannelTag.ConcatAll);
    op.i0    = g;
    op.i1    = h;
    op.i2    = () => UpstreamPullStrategy.PullAfterNext(Nothing());
    op.i3    = () => ChildExecutorDecision.Continue;
    op.i4    = channel;
    op.i5    = f;
    return op as any;
  };
}

/**
 * Returns a new channel whose outputs are fed to the specified factory function, which creates
 * new channels in response. These new channels are sequentially concatenated together, and all
 * their outputs appear as outputs of the newly returned channel. The provided merging function
 * is used to merge the terminal values of all channels into the single terminal value of the
 * returned channel.
 *
 * @tsplus pipeable fncts.io.Channel concatMapWithCustom
 */
export function concatMapWithCustom<
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
  f: (o: OutElem) => Channel<Env2, InErr2, InElem2, InDone2, OutErr2, OutElem2, OutDone>,
  g: (o: OutDone, o1: OutDone) => OutDone,
  h: (o: OutDone, o2: OutDone2) => OutDone3,
  onPull: (_: UpstreamPullRequest<OutElem>) => UpstreamPullStrategy<OutElem2>,
  onEmit: (_: OutElem2) => ChildExecutorDecision,
) {
  return <Env, InErr, InElem, InDone, OutErr>(
    channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2>,
  ): Channel<Env | Env2, InErr & InErr2, InElem & InElem2, InDone & InDone2, OutErr | OutErr2, OutElem2, OutDone3> => {
    const op = new ChannelPrimitive(ChannelTag.ConcatAll);
    op.i0    = g;
    op.i1    = h;
    op.i2    = onPull;
    op.i3    = onEmit;
    op.i4    = channel;
    op.i5    = f;
    return op as any;
  };
}

/**
 * Concat sequentially a channel of channels
 *
 * @tsplus pipeable fncts.io.Channel concatAllWith
 */
export function concatAllWith<OutDone, OutDone2, OutDone3>(
  f: (o: OutDone, o1: OutDone) => OutDone,
  g: (o: OutDone, o2: OutDone2) => OutDone3,
) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, Env2, InErr2, InElem2, InDone2, OutErr2>(
    channels: Channel<
      Env,
      InErr,
      InElem,
      InDone,
      OutErr,
      Channel<Env2, InErr2, InElem2, InDone2, OutErr2, OutElem, OutDone>,
      OutDone2
    >,
  ): Channel<Env | Env2, InErr & InErr2, InElem & InElem2, InDone & InDone2, OutErr | OutErr2, OutElem, OutDone3> => {
    const op = new ChannelPrimitive(ChannelTag.ConcatAll);
    op.i0    = f;
    op.i1    = g;
    op.i2    = () => UpstreamPullStrategy.PullAfterNext(Nothing());
    op.i3    = () => ChildExecutorDecision.Continue;
    op.i4    = channels;
    op.i5    = identity;
    return op as any;
  };
}

/**
 * Returns a new channel whose outputs are fed to the specified factory function, which creates
 * new channels in response. These new channels are sequentially concatenated together, and all
 * their outputs appear as outputs of the newly returned channel.
 *
 * @tsplus pipeable fncts.io.Channel concatMap
 */
export function concatMap<OutElem, OutElem2, OutDone, Env2, InErr2, InElem2, InDone2, OutErr2>(
  f: (o: OutElem) => Channel<Env2, InErr2, InElem2, InDone2, OutErr2, OutElem2, OutDone>,
) {
  return <Env, InErr, InElem, InDone, OutErr, OutDone2>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2>,
  ): Channel<Env | Env2, InErr & InErr2, InElem & InElem2, InDone & InDone2, OutErr | OutErr2, OutElem2, unknown> => {
    return self.concatMapWith(
      f,
      () => void 0,
      () => void 0,
    );
  };
}

function contramapReader<InErr, InElem, InDone0, InDone>(
  f: (a: InDone0) => InDone,
): Channel<never, InErr, InElem, InDone0, InErr, InElem, InDone> {
  return readWith(
    (_in) => Channel.writeNow(_in).zipRight(contramapReader(f)),
    Channel.failNow,
    (done) => Channel.endNow(f(done)),
  );
}

/**
 * @tsplus pipeable fncts.io.Channel contramap
 */
export function contramap<InDone0, InDone>(f: (a: InDone0) => InDone) {
  return <Env, InErr, InElem, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env, InErr, InElem, InDone0, OutErr, OutElem, OutDone> => {
    return contramapReader<InErr, InElem, InDone0, InDone>(f).pipeTo(self);
  };
}

function contramapInReader<InErr, InElem0, InElem, InDone>(
  f: (a: InElem0) => InElem,
): Channel<never, InErr, InElem0, InDone, InErr, InElem, InDone> {
  return readWith(
    (_in) => Channel.writeNow(f(_in)).zipRight(contramapInReader(f)),
    Channel.failNow,
    (done) => Channel.endNow(done),
  );
}
/**
 * @tsplus pipeable fncts.io.Channel contramapIn
 */
export function contramapIn<InElem0, InElem>(f: (a: InElem0) => InElem) {
  return <Env, InErr, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env, InErr, InElem0, InDone, OutErr, OutElem, OutDone> => {
    return contramapInReader<InErr, InElem0, InElem, InDone>(f).pipeTo(self);
  };
}

function contramapIOReader<Env1, InErr, InElem, InDone0, InDone>(
  f: (i: InDone0) => IO<Env1, InErr, InDone>,
): Channel<Env1, InErr, InElem, InDone0, InErr, InElem, InDone> {
  return readWith(
    (_in) => Channel.writeNow(_in).zipRight(contramapIOReader(f)),
    Channel.failNow,
    (done0) => Channel.fromIO(f(done0)),
  );
}

/**
 * @tsplus pipeable fncts.io.Channel contramapIO
 */
export function contramapIO<Env1, InErr, InDone0, InDone>(f: (i: InDone0) => IO<Env1, InErr, InDone>) {
  return <Env, InElem, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env1 | Env, InErr, InElem, InDone0, OutErr, OutElem, OutDone> => {
    return contramapIOReader<Env1, InErr, InElem, InDone0, InDone>(f).pipeTo(self);
  };
}

function contramapInIOReader<Env1, InErr, InElem0, InElem, InDone>(
  f: (a: InElem0) => IO<Env1, InErr, InElem>,
): Channel<Env1, InErr, InElem0, InDone, InErr, InElem, InDone> {
  return Channel.readWith(
    (inp) => Channel.fromIO(f(inp)).flatMap(Channel.writeNow).zipRight(contramapInIOReader(f)),
    Channel.failNow,
    Channel.endNow,
  );
}

/**
 * @tsplus pipeable fncts.io.Channel contramapInIO
 */
export function contramapInIO<Env1, InErr, InElem0, InElem>(f: (a: InElem0) => IO<Env1, InErr, InElem>) {
  return <Env, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env1 | Env, InErr, InElem0, InDone, OutErr, OutElem, OutDone> => {
    return contramapInIOReader<Env1, InErr, InElem0, InElem, InDone>(f).pipeTo(self);
  };
}

/**
 * @tsplus static fncts.io.ChannelOps defer
 */
export function defer<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  effect: Lazy<Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  const op = new ChannelPrimitive(ChannelTag.Defer);
  op.i0    = effect;
  return op as any;
}

function doneCollectReader<OutErr, OutElem, OutDone>(
  builder: ConcBuilder<OutElem>,
): Channel<never, OutErr, OutElem, OutDone, OutErr, never, OutDone> {
  return Channel.readWith(
    (out) =>
      Channel.fromIO(
        IO.succeed(() => {
          builder.append(out);
        }),
      ).zipRight(doneCollectReader(builder)),
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
 * @tsplus getter fncts.io.Channel doneCollect
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
 * @tsplus getter fncts.io.Channel drain
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
 * @tsplus getter fncts.io.Channel emitCollect
 */
export function emitCollect<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): Channel<Env, InErr, InElem, InDone, OutErr, readonly [Conc<OutElem>, OutDone], void> {
  return self.doneCollect.flatMap((t) => Channel.writeNow(t));
}

/**
 * @tsplus pipeable fncts.io.Channel ensuring
 */
export function ensuring<Env1, Z>(finalizer: URIO<Env1, Z>) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env | Env1, InErr, InElem, InDone, OutErr, OutElem, OutDone> => {
    return self.ensuringWith(() => finalizer);
  };
}

/**
 * Returns a new channel with an attached finalizer. The finalizer is guaranteed to be executed
 * so long as the channel begins execution (and regardless of whether or not it completes).
 *
 * @tsplus pipeable fncts.io.Channel ensuringWith
 */
export function ensuringWith<Env2, OutErr, OutDone>(finalizer: (e: Exit<OutErr, OutDone>) => IO<Env2, never, unknown>) {
  return <Env, InErr, InElem, InDone, OutElem>(
    channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env | Env2, InErr, InElem, InDone, OutErr, OutElem, OutDone> => {
    const op = new ChannelPrimitive(ChannelTag.Ensuring);
    op.i0    = channel;
    op.i1    = finalizer;
    return op as any;
  };
}

/**
 * Embed inputs from continuos pulling of a producer
 *
 * @tsplus pipeable fncts.io.Channel embedInput
 */
export function embedInput<InErr, InElem, InDone>(input: AsyncInputProducer<InErr, InElem, InDone>) {
  return <Env, OutErr, OutElem, OutDone>(
    self: Channel<Env, unknown, unknown, unknown, OutErr, OutElem, OutDone>,
  ): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> => {
    const op = new ChannelPrimitive(ChannelTag.Bridge);
    op.i0    = input;
    op.i1    = self;
    return op as any;
  };
}

/**
 * Halt a channel with the specified error
 *
 * @tsplus static fncts.io.ChannelOps fail
 */
export function fail<E>(error: Lazy<E>): Channel<never, unknown, unknown, unknown, E, never, never> {
  const op = new ChannelPrimitive(ChannelTag.Halt);
  op.i0    = () => Cause.fail(error());
  return op as any;
}

/**
 * Halt a channel with the specified error
 *
 * @tsplus static fncts.io.ChannelOps failNow
 */
export function failNow<E>(error: E): Channel<never, unknown, unknown, unknown, E, never, never> {
  const op = new ChannelPrimitive(ChannelTag.Halt);
  op.i0    = () => Cause.fail(error);
  return op as any;
}

/**
 * Returns a new channel, which flattens the terminal value of this channel. This function may
 * only be called if the terminal value of this channel is another channel of compatible types.
 *
 * @tsplus getter fncts.io.Channel flatten
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
  Env | Env1,
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
 * @tsplus static fncts.io.ChannelOps fromEither
 */
export function fromEither<E, A>(either: Lazy<Either<E, A>>): Channel<never, unknown, unknown, unknown, E, never, A> {
  return Channel.defer(either().match({ Left: Channel.failNow, Right: Channel.succeedNow }));
}

/**
 * @tsplus static fncts.io.ChannelOps fromInput
 */
export function fromInput<Err, Elem, Done>(
  input: AsyncInputConsumer<Err, Elem, Done>,
): Channel<never, unknown, unknown, unknown, Err, Elem, Done> {
  return unwrap(
    input.takeWith(Channel.failCauseNow, (elem) => Channel.writeNow(elem).zipRight(fromInput(input)), Channel.endNow),
  );
}

/**
 * Use an effect to end a channel
 *
 * @tsplus static fncts.io.ChannelOps fromIO
 */
export function fromIO<R, E, A>(io: Lazy<IO<R, E, A>>): Channel<R, unknown, unknown, unknown, E, never, A> {
  return Channel.defer(() => {
    const op = new ChannelPrimitive(ChannelTag.FromIO) as any;
    op.i0    = io();
    return op;
  });
}

/**
 * @tsplus static fncts.io.ChannelOps fromOption
 */
export function fromOption<A>(option: Lazy<Maybe<A>>): Channel<never, unknown, unknown, unknown, Nothing, never, A> {
  return Channel.defer(option().match(() => Channel.failNow(Nothing() as Nothing), Channel.succeedNow));
}

/**
 * @tsplus static fncts.io.ChannelOps fromQueue
 */
export function fromQueue<Err, Elem, Done>(
  queue: Queue.Dequeue<Either<Exit<Err, Done>, Elem>>,
): Channel<never, unknown, unknown, unknown, Err, Elem, Done> {
  return Channel.fromIO(queue.take).flatMap((_) =>
    _.match({
      Left: (_) => _.match(Channel.failCauseNow, Channel.endNow),
      Right: (elem) => Channel.writeNow(elem).zipRight(Channel.fromQueue(queue)),
    }),
  );
}

/**
 * Provides the channel with its required environment, which eliminates
 * its dependency on `Env`.
 *
 * @tsplus pipeable fncts.io.Channel provideEnvironment
 */
export function provideEnvironment<Env>(env: Lazy<Environment<Env>>) {
  return <InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<never, InErr, InElem, InDone, OutErr, OutElem, OutDone> => {
    return Channel.defer(() => {
      const op = new ChannelPrimitive(ChannelTag.Provide);
      op.i0    = env();
      op.i1    = self;
      return op as any;
    });
  };
}

/**
 * @tsplus pipeable fncts.io.Channel contramapEnvironment
 */
export function contramapEnvironment<Env, Env0>(f: (env0: Environment<Env0>) => Environment<Env>) {
  return <InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env0, InErr, InElem, InDone, OutErr, OutElem, OutDone> => {
    return Channel.ask<Env0>().flatMap((env0) => self.provideEnvironment(f(env0)));
  };
}

/**
 * Halt a channel with the specified exception
 *
 * @tsplus static fncts.io.ChannelOps haltNow
 */
export function haltNow(defect: unknown): Channel<never, unknown, unknown, unknown, never, never, never> {
  const op = new ChannelPrimitive(ChannelTag.Halt);
  op.i0    = () => Cause.halt(defect);
  return op as any;
}

/**
 * Halt a channel with the specified exception
 *
 * @tsplus static fncts.io.ChannelOps halt
 */
export function halt(defect: Lazy<unknown>): Channel<never, unknown, unknown, unknown, never, never, never> {
  const op = new ChannelPrimitive(ChannelTag.Halt);
  op.i0    = () => Cause.halt(defect());
  return op as any;
}

/**
 * @tsplus static fncts.io.ChannelOps id
 */
export function id<Err, Elem, Done>(): Channel<never, Err, Elem, Done, Err, Elem, Done> {
  return Channel.readWith((_in) => write(_in).zipRight(id<Err, Elem, Done>()), Channel.failNow, Channel.endNow);
}

/**
 * @tsplus static fncts.io.ChannelOps interrupt
 */
export function interrupt(fiberId: FiberId): Channel<never, unknown, unknown, unknown, never, never, never> {
  return Channel.failCauseNow(Cause.interrupt(fiberId));
}

/**
 * Use a managed to emit an output element
 *
 * @tsplus static fncts.io.ChannelOps scoped
 */
export function scoped<R, E, A>(
  io: Lazy<IO<R, E, A>>,
): Channel<Exclude<R, Scope>, unknown, unknown, unknown, E, A, unknown> {
  return Channel.unwrap(
    IO.uninterruptibleMask((restore) =>
      Scope.make.map((scope) =>
        Channel.acquireReleaseOutExitWith(
          restore(scope.extend(io)).tapErrorCause((cause) => scope.close(Exit.failCause(cause))),
          (_, exit) => scope.close(exit),
        ),
      ),
    ),
  );
}

/**
 * Returns a new channel, which is the same as this one, except the failure value of the returned
 * channel is created by applying the specified function to the failure value of this channel.
 *
 * @tsplus pipeable fncts.io.Channel mapError
 */
export function mapError<OutErr, OutErr2>(f: (err: OutErr) => OutErr2) {
  return <Env, InErr, InElem, InDone, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env, InErr, InElem, InDone, OutErr2, OutElem, OutDone> => {
    return self.mapErrorCause((cause) => cause.map(f));
  };
}

/**
 * A more powerful version of `mapError` which also surfaces the `Cause` of the channel failure
 *
 * @tsplus pipeable fncts.io.Channel mapErrorCause
 */
export function mapErrorCause<OutErr, OutErr2>(f: (cause: Cause<OutErr>) => Cause<OutErr2>) {
  return <Env, InErr, InElem, InDone, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env, InErr, InElem, InDone, OutErr2, OutElem, OutDone> => {
    return self.catchAllCause((cause) => Channel.failCauseNow(f(cause)));
  };
}

/**
 * Returns a new channel, which is the same as this one, except the terminal value of the
 * returned channel is created by applying the specified effectful function to the terminal value
 * of this channel.
 *
 * @tsplus pipeable fncts.io.Channel mapIO
 */
export function mapIO<Env1, OutErr1, OutDone, OutDone1>(f: (o: OutDone) => IO<Env1, OutErr1, OutDone1>) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env | Env1, InErr, InElem, InDone, OutErr | OutErr1, OutElem, OutDone1> => {
    return self.flatMap((outDone) => Channel.fromIO(f(outDone)));
  };
}

/**
 * Maps the output of this channel using f
 *
 * @tsplus pipeable fncts.io.Channel mapOut
 */
export function mapOut<OutElem, OutElem2>(f: (o: OutElem) => OutElem2) {
  return <Env, InErr, InElem, InDone, OutErr, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env, InErr, InElem, InDone, OutErr, OutElem2, OutDone> => {
    const reader: Channel<Env, OutErr, OutElem, OutDone, OutErr, OutElem2, OutDone> = readWith(
      (out) => Channel.writeNow(f(out)).zipRight(reader),
      Channel.failNow,
      Channel.endNow,
    );
    return self.pipeTo(reader);
  };
}

const mapOutIOReader = <Env, Env1, OutErr, OutErr1, OutElem, OutElem1, OutDone>(
  f: (o: OutElem) => IO<Env1, OutErr1, OutElem1>,
): Channel<Env | Env1, OutErr, OutElem, OutDone, OutErr | OutErr1, OutElem1, OutDone> =>
  Channel.readWithCause(
    (out) => Channel.fromIO(f(out)).flatMap(Channel.writeNow).zipRight(mapOutIOReader(f)),
    Channel.failCauseNow,
    Channel.succeedNow,
  );

/**
 * @tsplus pipeable fncts.io.Channel mapOutIO
 */
export function mapOutIO<Env1, OutErr1, OutElem, OutElem1>(f: (o: OutElem) => IO<Env1, OutErr1, OutElem1>) {
  return <Env, InErr, InElem, InDone, OutErr, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env | Env1, InErr, InElem, InDone, OutErr | OutErr1, OutElem1, OutDone> => {
    return self.pipeTo(mapOutIOReader(f));
  };
}

/**
 * Fold the channel exposing success and full error cause
 *
 * @tsplus pipeable fncts.io.Channel matchCauseChannel
 */
export function matchCauseChannel<
  Env1,
  Env2,
  InErr1,
  InErr2,
  InElem1,
  InElem2,
  InDone1,
  InDone2,
  OutErr,
  OutErr2,
  OutErr3,
  OutElem1,
  OutElem2,
  OutDone,
  OutDone2,
  OutDone3,
>(
  onError: (c: Cause<OutErr>) => Channel<Env1, InErr1, InElem1, InDone1, OutErr2, OutElem1, OutDone2>,
  onSuccess: (o: OutDone) => Channel<Env2, InErr2, InElem2, InDone2, OutErr3, OutElem2, OutDone3>,
) {
  return <Env, InErr, InElem, InDone, OutElem>(
    channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env | Env1 | Env2,
    InErr & InErr1 & InErr2,
    InElem & InElem1 & InElem2,
    InDone & InDone1 & InDone2,
    OutErr2 | OutErr3,
    OutElem | OutElem1 | OutElem2,
    OutDone2 | OutDone3
  > => {
    const op = new ChannelPrimitive(ChannelTag.Fold);
    op.i0    = channel;

    const continuation = new ChannelPrimitive(ChannelTag.ContinuationK);
    continuation.i0    = onSuccess;
    continuation.i1    = onError;

    op.i1 = continuation;

    return op as any;
  };
}

/**
 * Fold the channel exposing success and full error cause
 *
 * @tsplus pipeable fncts.io.Channel matchChannel
 */
export function matchChannel<
  Env1,
  Env2,
  InErr1,
  InErr2,
  InElem1,
  InElem2,
  InDone1,
  InDone2,
  OutErr,
  OutErr2,
  OutErr3,
  OutElem1,
  OutElem2,
  OutDone,
  OutDone2,
  OutDone3,
>(
  onError: (e: OutErr) => Channel<Env1, InErr1, InElem1, InDone1, OutErr2, OutElem1, OutDone2>,
  onSuccess: (o: OutDone) => Channel<Env2, InErr2, InElem2, InDone2, OutErr3, OutElem2, OutDone3>,
) {
  return <Env, InErr, InElem, InDone, OutElem>(
    channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env | Env1 | Env2,
    InErr & InErr1 & InErr2,
    InElem & InElem1 & InElem2,
    InDone & InDone1 & InDone2,
    OutErr2 | OutErr3,
    OutElem | OutElem1 | OutElem2,
    OutDone2 | OutDone3
  > => {
    return channel.matchCauseChannel(
      (cause) => cause.failureOrCause.match({ Left: onError, Right: Channel.failCauseNow }),
      onSuccess,
    );
  };
}

export const never: Channel<never, unknown, unknown, unknown, never, never, never> = Channel.fromIO(IO.never);

/**
 * Returns a new channel that will perform the operations of this one, until failure, and then
 * it will switch over to the operations of the specified fallback channel.
 *
 * @tsplus pipeable fncts.io.Channel orElse
 */
export function orElse<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>(
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env | Env1,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr1,
    OutElem | OutElem1,
    OutDone | OutDone1
  > => {
    return self.catchAll((_) => that);
  };
}

/**
 * @tsplus pipeable fncts.io.Channel orHalt
 */
export function orHalt<E>(err: E) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> => {
    return self.orHaltWith(() => err);
  };
}

/**
 * @tsplus pipeable fncts.io.Channel orHaltWith
 */
export function orHaltWith<OutErr, E>(f: (e: OutErr) => E) {
  return <Env, InErr, InElem, InDone, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env, InErr, InElem, InDone, never, OutElem, OutDone> => {
    return self.catchAll((e) => Channel.haltNow(f(e)));
  };
}

/**
 * Pipe the output of a channel into the input of another
 *
 * @tsplus pipeable fncts.io.Channel pipeTo
 * @tsplus pipeable-operator fncts.io.Channel >>>
 */
export function pipeTo<OutErr, OutElem, OutDone, Env1, OutErr1, OutElem1, OutDone1>(
  right: Channel<Env1, OutErr, OutElem, OutDone, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone>(
    left: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env | Env1, InErr, InElem, InDone, OutErr1, OutElem1, OutDone1> => {
    const op = new ChannelPrimitive(ChannelTag.PipeTo);
    op.i0    = () => left;
    op.i1    = () => right;
    return op as any;
  };
}

const ChannelFailureTypeId = Symbol.for("@principia/base/Channel/ChannelFailure");
class ChannelFailure<E> {
  readonly [ChannelFailureTypeId] = ChannelFailureTypeId;
  constructor(readonly error: E) {}
}

function isChannelFailure<E>(u: unknown): u is ChannelFailure<E> {
  return isObject(u) && ChannelFailureTypeId in u;
}

/**
 * @tsplus pipeable fncts.io.Channel pipeToOrFail
 * @tsplus pipeable-operator fncts.io.Channel >>>
 */
export function pipeToOrFail<OutElem, OutDone, Env1, OutErr1, OutElem1, OutDone1>(
  right: Channel<Env1, never, OutElem, OutDone, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone, OutErr>(
    left: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env | Env1, InErr, InElem, InDone, OutErr | OutErr1, OutElem1, OutDone1> => {
    return left
      .catchAll((err) => Channel.failCauseNow(Cause.halt(new ChannelFailure(err))))
      .pipeTo(right)
      .catchAllCause((cause) =>
        cause.isHalt() && isChannelFailure(cause.value)
          ? Channel.failNow(cause.value.error as OutErr)
          : Channel.haltNow(cause),
      );
  };
}

/**
 * @tsplus static fncts.io.ChannelOps read
 */
export function read<In>(): Channel<never, unknown, In, unknown, Nothing, never, In> {
  return Channel.readOrFail(Nothing() as Nothing);
}

/**
 * @tsplus static fncts.io.ChannelOps readOrFail
 */
export function readOrFail<In, E>(e: E): Channel<never, unknown, In, unknown, E, never, In> {
  const op = new ChannelPrimitive(ChannelTag.Read);
  op.i0    = Channel.endNow;

  const continuation = new ChannelPrimitive(ChannelTag.ContinuationK);
  continuation.i0    = () => Channel.failNow(e);
  continuation.i1    = () => Channel.failNow(e);

  op.i1 = continuation;

  return op as any;
}

/**
 * Reads an input and continue exposing both full error cause and completion
 *
 * @tsplus static fncts.io.ChannelOps readWithCause
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
  Env | Env1 | Env2,
  InErr,
  InElem,
  InDone,
  OutErr | OutErr1 | OutErr2,
  OutElem | OutElem1 | OutElem2,
  OutDone | OutDone1 | OutDone2
> {
  const op = new ChannelPrimitive(ChannelTag.Read);
  op.i0    = inp;

  const continuation = new ChannelPrimitive(ChannelTag.ContinuationK);
  continuation.i0    = done;
  continuation.i1    = halt;

  op.i1 = continuation;

  return op as any;
}

/**
 * Reads an input and continue exposing both error and completion
 *
 * @tsplus static fncts.io.ChannelOps readWith
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
  Env | Env1 | Env2,
  InErr,
  InElem,
  InDone,
  OutErr | OutErr1 | OutErr2,
  OutElem | OutElem1 | OutElem2,
  OutDone | OutDone1 | OutDone2
> {
  return Channel.readWithCause(inp, (c) => c.failureOrCause.match({ Left: error, Right: Channel.failCauseNow }), done);
}

/**
 * Repeats this channel forever
 *
 * @tsplus getter fncts.io.Channel repeated
 */
export function repeated<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return self.flatMap(() => self.repeated);
}

/**
 * @tsplus static fncts.io.ChannelOps toQueue
 */
export function toQueue<Err, Done, Elem>(
  queue: Lazy<Queue.Enqueue<Either<Exit<Err, Done>, Elem>>>,
): Channel<never, Err, Elem, Done, never, never, unknown> {
  return Channel.defer(() => {
    function toQueue<Err, Done, Elem>(
      queue: Queue.Enqueue<Either<Exit<Err, Done>, Elem>>,
    ): Channel<never, Err, Elem, Done, never, never, unknown> {
      return Channel.readWithCause(
        (inp) => Channel.fromIO(queue.offer(Either.right(inp))) > toQueue(queue),
        (cause) => Channel.fromIO(queue.offer(Either.left(Exit.failCause(cause)))),
        (done) => Channel.fromIO(queue.offer(Either.left(Exit.succeed(done)))),
      );
    }
    return toQueue(queue());
  });
}

/**
 * Writes an output to the channel
 *
 * @tsplus static fncts.io.ChannelOps write
 */
export function write<OutElem>(out: Lazy<OutElem>): Channel<never, unknown, unknown, unknown, never, OutElem, void> {
  const op = new ChannelPrimitive(ChannelTag.Emit);
  op.i0    = out;
  return op as any;
}

/**
 * @tsplus static fncts.io.ChannelOps writeAll
 */
export function writeAll<Out>(outs: ReadonlyArray<Out>): Channel<never, unknown, unknown, unknown, never, Out, void> {
  return Channel.writeChunk(Conc.from(outs));
}

function writeChunkWriter<Out>(
  outs: Conc<Out>,
  idx: number,
  len: number,
): Channel<never, unknown, unknown, unknown, never, Out, void> {
  if (idx === len) return Channel.unit;
  return Channel.writeNow(outs.unsafeGet(idx)).zipRight(writeChunkWriter(outs, idx + 1, len));
}

/**
 * @tsplus static fncts.io.ChannelOps writeChunk
 */
export function writeChunk<Out>(outs: Conc<Out>): Channel<never, unknown, unknown, unknown, never, Out, void> {
  return writeChunkWriter(outs, 0, outs.length);
}

/**
 * Writes an output to the channel
 *
 * @tsplus static fncts.io.ChannelOps writeNow
 */
export function writeNow<OutElem>(out: OutElem): Channel<never, unknown, unknown, unknown, never, OutElem, void> {
  const op = new ChannelPrimitive(ChannelTag.Emit);
  op.i0    = () => out;
  return op as any;
}

/**
 * @tsplus static fncts.io.ChannelOps unit
 */
export const unit: Channel<never, unknown, unknown, unknown, never, never, void> = Channel.endNow(undefined);

/**
 * Makes a channel from an effect that returns a channel in case of success
 *
 * @tsplus static fncts.io.ChannelOps unwrap
 */
export function unwrap<R, E, Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Lazy<IO<R, E, Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>>>,
): Channel<R | Env, InErr, InElem, InDone, E | OutErr, OutElem, OutDone> {
  return Channel.fromIO(self).flatten;
}

/**
 * Makes a channel from a managed that returns a channel in case of success
 *
 * @tsplus static fncts.io.ChannelOps unwrapScoped
 */
export function unwrapScoped<R, E, Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Lazy<IO<R, E, Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>>>,
): Channel<Exclude<R, Scope> | Env, InErr, InElem, InDone, E | OutErr, OutElem, OutDone> {
  return Channel.scoped(self).concatAllWith(
    (d, _) => d,
    (d, _) => d,
  );
}

/**
 * @tsplus static fncts.io.ChannelOps fromHubScoped
 */
export function fromHubScoped<Err, Done, Elem>(
  hub: Lazy<Hub<Either<Exit<Err, Done>, Elem>>>,
): IO<Scope, never, Channel<never, unknown, unknown, unknown, Err, Elem, Done>> {
  return IO.defer(hub().subscribe.map(Channel.fromQueue));
}

/**
 * @tsplus static fncts.io.ChannelOps toHub
 */
export function toHub<Err, Done, Elem>(
  hub: Lazy<Hub<Either<Exit<Err, Done>, Elem>>>,
): Channel<never, Err, Elem, Done, never, never, unknown> {
  return Channel.toQueue(hub);
}
