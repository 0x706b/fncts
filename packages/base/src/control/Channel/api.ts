import type { ConcBuilder } from "../../collection/immutable/Conc";
import type { FiberId } from "../../data/FiberId";
import type { Lazy } from "../../data/function";
import type { Maybe } from "../../data/Maybe";
import type { Predicate } from "../../data/Predicate";
import type { URIO } from "../IO";
import type { AsyncInputConsumer } from "./internal/AsyncInputConsumer";
import type { AsyncInputProducer } from "./internal/AsyncInputProducer";
import type { ChannelState } from "./internal/ChannelState";
import type { UpstreamPullRequest } from "./internal/UpstreamPullRequest";

import { Conc } from "../../collection/immutable/Conc";
import { Cause } from "../../data/Cause";
import { Either } from "../../data/Either";
import { ExecutionStrategy } from "../../data/ExecutionStrategy";
import { Exit } from "../../data/Exit";
import { identity, tuple } from "../../data/function";
import { Just, Nothing } from "../../data/Maybe";
import { hasTypeId } from "../../util/predicates";
import { Fiber } from "../Fiber";
import { FiberRef } from "../FiberRef";
import { Future } from "../Future";
import { IO } from "../IO";
import { Managed } from "../Managed";
import { ReleaseMap } from "../Managed/ReleaseMap";
import { Queue } from "../Queue";
import { Ref } from "../Ref";
import { TSemaphore } from "../TSemaphore";
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
} from "./definition";
import { ChannelExecutor, readUpstream } from "./internal/ChannelExecutor";
import { ChannelStateTag } from "./internal/ChannelState";
import { ChildExecutorDecision } from "./internal/ChildExecutorDecision";
import { MergeDecision, MergeDecisionTag } from "./internal/MergeDecision";
import { MergeState, MergeStateTag } from "./internal/MergeState";
import { SingleProducerAsyncInput } from "./internal/SingleProducerAsyncInput";
import { UpstreamPullStrategy } from "./internal/UpstreamPullStrategy";

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
export function ask<Env>(): Channel<Env, unknown, unknown, unknown, never, never, Env> {
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
 * @tsplus static fncts.control.ChannelOps bracket
 */
export function bracket_<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone, Acquired>(
  acquire: IO<Env, OutErr, Acquired>,
  use: (a: Acquired) => Channel<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone>,
  release: (a: Acquired) => URIO<Env, any>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone> {
  return Channel.bracketExit(acquire, use, (a, _) => release(a));
}

/**
 * @tsplus static fncts.control.ChannelOps bracketExit
 */
export function bracketExit_<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone, Acquired>(
  acquire: IO<Env, OutErr, Acquired>,
  use: (a: Acquired) => Channel<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone>,
  release: (a: Acquired, exit: Exit<OutErr, OutDone>) => URIO<Env, any>,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem1, OutDone> {
  return Channel.fromIO(Ref.make<(exit: Exit<OutErr, OutDone>) => URIO<Env, any>>((_) => IO.unit)).chain((ref) =>
    Channel.fromIO(acquire.tap((a) => ref.set((exit) => release(a, exit))).uninterruptible)
      .chain(use)
      .ensuringWith((exit) => ref.get.chain((fin) => fin(exit))),
  );
}

/**
 * Construct a resource Channel with Acquire / Release
 *
 * @tsplus static fncts.control.ChannelOps bracketOut
 */
export function bracketOut_<Env, OutErr, Acquired, Z>(
  acquire: IO<Env, OutErr, Acquired>,
  release: (a: Acquired) => URIO<Env, Z>,
): Channel<Env, unknown, unknown, unknown, OutErr, Acquired, void> {
  return Channel.bracketOutExit(acquire, (z, _) => release(z));
}

/**
 * Construct a resource Channel with Acquire / Release
 *
 * @tsplus static fncts.control.ChannelOps bracketOutExit
 */
export function bracketOutExit_<R, R2, E, Z>(
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
          readWith((_in) => Channel.writeNow(_in).apSecond(Channel.buffer(empty, isEmpty, ref)), Channel.failNow, Channel.endNow),
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
): Channel<Env & Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr1, OutElem | OutElem1, OutDone | OutDone1> {
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
): Channel<Env & Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr1, OutElem | OutElem1, OutDone | OutDone1> {
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
  channels: Channel<Env, InErr, InElem, InDone, OutErr, Channel<Env2, InErr2, InElem2, InDone2, OutErr2, OutElem, OutDone>, OutDone2>,
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
    (inp) => Channel.fromIO(f(inp)).chain(Channel.writeNow).apSecond(contramapInIOReader(f)),
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
  return self.doneCollect.chain((t) => Channel.writeNow(t));
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
export function flatten<Env, InErr, InElem, InDone, OutErr, OutElem, Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone2>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone2>>,
): Channel<Env & Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem | OutElem1, OutDone2> {
  return self.chain(identity);
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
  return unwrap(input.takeWith(Channel.failCauseNow, (elem) => Channel.writeNow(elem).apSecond(fromInput(input)), Channel.endNow));
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
  return Channel.fromIO(queue.take).chain((_) =>
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
  env: Env,
): Channel<unknown, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return new Provide(env, self);
}

/**
 * @tsplus fluent fncts.control.Channel contramapEnvironment
 */
export function contramapEnvironment_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, Env0>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (env0: Env0) => Env,
): Channel<Env0, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return Channel.ask<Env0>().chain((env0) => self.provideEnvironment(f(env0)));
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
 * Returns a new channel, which is the same as this one, except it will be interrupted when the
 * specified effect completes. If the effect completes successfully before the underlying channel
 * is done, then the returned channel will yield the success value of the effect as its terminal
 * value. On the other hand, if the underlying channel finishes first, then the returned channel
 * will yield the success value of the underlying channel as its terminal value.
 *
 * @tsplus fluent fncts.control.Channel interruptWhen
 */
export function interruptWhen_<Env, Env1, InErr, InElem, InDone, OutErr, OutErr1, OutElem, OutDone, OutDone1>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  io: IO<Env1, OutErr1, OutDone1>,
): Channel<Env1 & Env, InErr, InElem, InDone, OutErr | OutErr1, OutElem, OutDone | OutDone1> {
  return self.mergeWith(
    Channel.fromIO(io),
    (selfDone) => MergeDecision.Done(IO.fromExitNow(selfDone)),
    (ioDone) => MergeDecision.Done(IO.fromExitNow(ioDone)),
  );
}

/**
 * Returns a new channel, which is the same as this one, except it will be interrupted when the
 * specified promise is completed. If the promise is completed before the underlying channel is
 * done, then the returned channel will yield the value of the promise. Otherwise, if the
 * underlying channel finishes first, then the returned channel will yield the value of the
 * underlying channel.
 *
 * @tsplus fluent fncts.control.Channel interruptWhen
 */
export function interruptWhenFuture_<Env, InErr, InElem, InDone, OutErr, OutErr1, OutElem, OutDone, OutDone1>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  promise: Future<OutErr1, OutDone1>,
): Channel<Env, InErr, InElem, InDone, OutErr | OutErr1, OutElem, OutDone | OutDone1> {
  return self.interruptWhen(promise.await);
}

/**
 * @tsplus static fncts.control.ChannelOps managed
 */
export function managed_<Env, Env1, InErr, InElem, InDone, OutErr, OutErr1, OutElem, OutDone, A>(
  m: Managed<Env, OutErr, A>,
  use: (a: A) => Channel<Env1, InErr, InElem, InDone, OutErr1, OutElem, OutDone>,
): Channel<Env & Env1, InErr, InElem, InDone, OutErr | OutErr1, OutElem, OutDone> {
  return Channel.bracketExit(
    ReleaseMap.make,
    (releaseMap) =>
      Channel.fromIO(FiberRef.currentReleaseMap.locally(releaseMap)(m.io))
        .map(([_, a]) => a)
        .chain(use),
    (releaseMap, exit) => releaseMap.releaseAll(exit, ExecutionStrategy.sequential),
  );
}

/**
 * Use a managed to emit an output element
 *
 * @tsplus static fncts.control.ChannelOps managedOut
 */
export function managedOut<R, E, A>(managed: Managed<R, E, A>): Channel<R, unknown, unknown, unknown, E, A, unknown> {
  return Channel.bracketOutExit(
    ReleaseMap.make.chain((releaseMap) =>
      IO.uninterruptibleMask(({ restore }) =>
        FiberRef.currentReleaseMap
          .locally(releaseMap)(restore(managed.io))
          .matchCauseIO(
            (cause) => releaseMap.releaseAll(Exit.failCause(cause), ExecutionStrategy.sequential).apSecond(IO.failCauseNow(cause)),
            ([_, out]) => IO.succeedNow(tuple(out, releaseMap)),
          ),
      ),
    ),
    ([_, releaseMap], exit) => releaseMap.releaseAll(exit, ExecutionStrategy.sequential),
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
  return self.chain((outDone) => Channel.fromIO(f(outDone)));
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
  Channel.readWith((out) => Channel.fromIO(f(out)).chain(Channel.writeNow).apSecond(mapOutIOReader(f)), Channel.failNow, Channel.endNow);

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
 * @tsplus fluent fncts.control.Channel mapOutIOC
 */
export function mapOutIOC_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, Env1, OutErr1, OutElem1>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  n: number,
  f: (_: OutElem) => IO<Env1, OutErr1, OutElem1>,
): Channel<Env & Env1, InErr, InElem, InDone, OutErr | OutErr1, OutElem1, OutDone> {
  return Channel.managed(
    Managed.withChildren((getChildren) =>
      Managed.gen(function* (_) {
        yield* _(Managed.finalizer(getChildren.chain(Fiber.interruptAll)));
        const queue = yield* _(
          Managed.bracket(Queue.makeBounded<IO<Env1, OutErr | OutErr1, Either<OutDone, OutElem1>>>(n), (queue) => queue.shutdown),
        );
        const errorSignal = yield* _(Future.make<OutErr1, never>());
        const permits     = yield* _(TSemaphore.make(n).commit);
        const pull        = yield* _(self.toPull);
        yield* _(
          pull.matchCauseIO(
            (cause) => queue.offer(IO.failCauseNow(cause)),
            (r) =>
              r.match(
                (outDone) =>
                  permits
                    .withPermits(n)(IO.unit)
                    .interruptible.apSecond(queue.offer(IO.succeedNow(Either.left(outDone)))).asUnit,
                (outElem) =>
                  IO.gen(function* (_) {
                    const p     = yield* _(Future.make<OutErr1, OutElem1>());
                    const latch = yield* _(Future.make<never, void>());
                    yield* _(queue.offer(p.await.map(Either.right)));
                    yield* _(
                      permits.withPermit(
                        latch.succeed(undefined).apSecond(
                          errorSignal.await
                            .raceFirst(f(outElem))
                            .tapErrorCause((c) => p.failCause(c))
                            .fulfill(p),
                        ),
                      ),
                    );
                    yield* _(latch.await);
                  }),
              ),
          ).forever.uninterruptible.fork,
        );
        return queue;
      }),
    ),
    (queue) => {
      const consumer: Channel<Env & Env1, unknown, unknown, unknown, OutErr | OutErr1, OutElem1, OutDone> = Channel.unwrap(
        queue.take.flatten.matchCause(Channel.failCauseNow, (r) =>
          r.match(Channel.endNow, (outElem) => Channel.writeNow(outElem).apSecond(consumer)),
        ),
      );
      return consumer;
    },
  );
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

export type MergeStrategy = "BackPressure" | "BufferSliding";

/**
 * @tsplus fluent fncts.control.Channel mergeAll
 */
export function mergeAll_<Env, InErr, InElem, InDone, OutErr, Env1, InErr1, InElem1, InDone1, OutErr1, OutElem>(
  channels: Channel<Env, InErr, InElem, InDone, OutErr, Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem, any>, any>,
  n: number,
  bufferSize = 16,
  mergeStrategy: MergeStrategy = "BackPressure",
): Channel<Env & Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem, unknown> {
  return channels.mergeAllWith(n, () => undefined, bufferSize, mergeStrategy);
}

/**
 * @tsplus fluent fncts.control.Channel mergeAllWith
 */
export function mergeAllWith_<Env, InErr, InElem, InDone, OutErr, OutDone, Env1, InErr1, InElem1, InDone1, OutErr1, OutElem>(
  channels: Channel<Env, InErr, InElem, InDone, OutErr, Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem, OutDone>, OutDone>,
  n: number,
  f: (x: OutDone, y: OutDone) => OutDone,
  bufferSize = 16,
  mergeStrategy: MergeStrategy = "BackPressure",
): Channel<Env & Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem, OutDone> {
  return Channel.managed(
    Managed.withChildren((getChildren) =>
      Managed.gen(function* (_) {
        yield* _(Managed.finalizer(getChildren.chain(Fiber.interruptAll)));
        const queue = yield* _(
          Managed.bracket(Queue.makeBounded<IO<Env, OutErr | OutErr1, Either<OutDone, OutElem>>>(bufferSize), (queue) => queue.shutdown),
        );
        const cancelers   = yield* _(Managed.bracket(Queue.makeUnbounded<Future<never, void>>(), (queue) => queue.shutdown));
        const lastDone    = yield* _(Ref.make<Maybe<OutDone>>(Nothing()));
        const errorSignal = yield* _(Future.make<never, void>());
        const permits     = yield* _(TSemaphore.make(n).commit);
        const pull        = yield* _(channels.toPull);

        const evaluatePull = (pull: IO<Env & Env1, OutErr | OutErr1, Either<OutDone, OutElem>>) =>
          pull
            .chain((ea) =>
              ea.match(
                (outDone) => IO.succeedNow(Just(outDone)),
                (outElem) => queue.offer(IO.succeedNow(Either.right(outElem))).as(Nothing()),
              ),
            )
            .repeatUntil((m) => m.isJust())
            .chain((md1) =>
              md1.match(
                () => IO.unit,
                (outDone) =>
                  lastDone.update((md2) =>
                    md2.match(
                      () => Just(outDone),
                      (lastDone) => Just(f(lastDone, outDone)),
                    ),
                  ),
              ),
            );

        yield* _(
          pull
            .matchCauseIO(
              (cause) => getChildren.chain(Fiber.interruptAll).apSecond(queue.offer(IO.failCauseNow(cause)).as(false)),
              (doneOrChannel) =>
                doneOrChannel.match(
                  (outDone) =>
                    errorSignal.await.raceWith(
                      permits.withPermits(n)(IO.unit),
                      (_, permitAcquisition) => getChildren.chain(Fiber.interruptAll).apSecond(permitAcquisition.interrupt.as(false)),
                      (_, failureAwait) =>
                        failureAwait.interrupt.apSecond(
                          lastDone.get
                            .chain((maybeDone) =>
                              maybeDone.match(
                                () => queue.offer(IO.succeedNow(Either.left(outDone))),
                                (lastDone) => queue.offer(IO.succeedNow(Either.left(f(lastDone, outDone)))),
                              ),
                            )
                            .as(false),
                        ),
                    ),
                  (channel) => {
                    switch (mergeStrategy) {
                      case "BackPressure":
                        return IO.gen(function* (_) {
                          const latch   = yield* _(Future.make<never, void>());
                          const raceIOs = channel.toPull.use((io) => evaluatePull(io).race(errorSignal.await));
                          yield* _(permits.withPermit(latch.succeed(undefined).apSecond(raceIOs)).fork);
                          yield* _(latch.await);
                          return !(yield* _(errorSignal.isDone));
                        });
                      case "BufferSliding":
                        return IO.gen(function* (_) {
                          const canceler = yield* _(Future.make<never, void>());
                          const latch    = yield* _(Future.make<never, void>());
                          const size     = yield* _(cancelers.size);
                          yield* _(cancelers.take.chain((f) => f.succeed(undefined)).when(size >= 0));
                          const raceIOs = channel.toPull.use((io) => evaluatePull(io).race(errorSignal.await).race(canceler.await));
                          yield* _(permits.withPermit(latch.succeed(undefined).apSecond(raceIOs)).fork);
                          yield* _(latch.await);
                          return !(yield* _(errorSignal.isDone));
                        });
                    }
                  },
                ),
            )
            .repeatWhile(identity).fork,
        );
        return queue;
      }),
    ),
    (queue) => {
      const consumer: Channel<Env & Env1, unknown, unknown, unknown, OutErr | OutErr1, OutElem, OutDone> = Channel.unwrap(
        queue.take.flatten.matchCause(Channel.failCauseNow, (out) =>
          out.match(Channel.endNow, (outElem) => Channel.writeNow(outElem).apSecond(consumer)),
        ),
      );
      return consumer;
    },
  );
}

/**
 * @tsplus fluent fncts.control.Channel mergeAllUnboundedWith
 */
export function mergeAllUnboundedWith_<Env, InErr, InElem, InDone, OutErr, Env1, InErr1, InElem1, InDone1, OutErr1, OutElem, OutDone>(
  channels: Channel<Env, InErr, InElem, InDone, OutErr, Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem, OutDone>, OutDone>,
  f: (x: OutDone, y: OutDone) => OutDone,
): Channel<Env & Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem, OutDone> {
  return channels.mergeAllWith(Number.MAX_SAFE_INTEGER, f);
}

/**
 * @tsplus fluent fncts.control.Channel mergeMap
 */
export function mergeMap_<Env, InErr, InElem, InDone, OutErr, OutElem, Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, any>,
  f: (elem: OutElem) => Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, any>,
  n: number,
  bufferSize = 16,
  mergeStrategy: MergeStrategy = "BackPressure",
): Channel<Env & Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem1, unknown> {
  return self.mapOut(f).mergeAll(n, bufferSize, mergeStrategy);
}

/**
 * Returns a new channel, which is the merge of this channel and the specified channel, where
 * the behavior of the returned channel on left or right early termination is decided by the
 * specified `leftDone` and `rightDone` merge decisions.
 *
 * @tsplus fluent fncts.control.Channel mergeWith
 */
export function mergeWith_<
  Env,
  Env1,
  Env2,
  Env3,
  InErr,
  InErr1,
  InElem,
  InElem1,
  InDone,
  InDone1,
  OutErr,
  OutErr1,
  OutErr2,
  OutErr3,
  OutElem,
  OutElem1,
  OutDone,
  OutDone1,
  OutDone2,
  OutDone3,
>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
  leftDone: (ex: Exit<OutErr, OutDone>) => MergeDecision<Env2, OutErr1, OutDone1, OutErr2, OutDone2>,
  rightDone: (ex: Exit<OutErr1, OutDone1>) => MergeDecision<Env3, OutErr, OutDone, OutErr3, OutDone3>,
): Channel<
  Env & Env1 & Env2 & Env3,
  InErr & InErr1,
  InElem & InElem1,
  InDone & InDone1,
  OutErr2 | OutErr3,
  OutElem | OutElem1,
  OutDone2 | OutDone3
> {
  return Channel.unwrapManaged(
    Managed.gen(function* (_) {
      const input       = yield* _(SingleProducerAsyncInput<InErr & InErr1, InElem & InElem1, InDone & InDone1>());
      const queueReader = Channel.fromInput(input);
      const pullL       = yield* _(queueReader.pipeTo(self).toPull);
      const pullR       = yield* _(queueReader.pipeTo(that).toPull);
      type LocalMergeState = MergeState<
        Env & Env1 & Env2 & Env3,
        OutErr,
        OutErr1,
        OutErr2 | OutErr3,
        OutElem | OutElem1,
        OutDone,
        OutDone1,
        OutDone2 | OutDone3
      >;

      const handleSide =
        <Err, Done, Err2, Done2>(
          exit: Exit<Err, Either<Done, OutElem | OutElem1>>,
          fiber: Fiber<Err2, Either<Done2, OutElem | OutElem1>>,
          pull: IO<Env & Env1 & Env2 & Env3, Err, Either<Done, OutElem | OutElem1>>,
        ) =>
        (
          done: (ex: Exit<Err, Done>) => MergeDecision<Env & Env1 & Env2 & Env3, Err2, Done2, OutErr2 | OutErr3, OutDone2 | OutDone3>,
          both: (f1: Fiber<Err, Either<Done, OutElem | OutElem1>>, f2: Fiber<Err2, Either<Done2, OutElem | OutElem1>>) => LocalMergeState,
          single: (f: (ex: Exit<Err2, Done2>) => IO<Env & Env1 & Env2 & Env3, OutErr2 | OutErr3, OutDone2 | OutDone3>) => LocalMergeState,
        ): IO<
          Env & Env1 & Env2 & Env3,
          never,
          Channel<Env & Env1 & Env2 & Env3, unknown, unknown, unknown, OutErr2 | OutErr3, OutElem | OutElem1, OutDone2 | OutDone3>
        > => {
          const onDecision = (decision: MergeDecision<Env & Env1 & Env2 & Env3, Err2, Done2, OutErr2 | OutErr3, OutDone2 | OutDone3>) => {
            decision.concrete();
            switch (decision._tag) {
              case MergeDecisionTag.Done:
                return IO.succeedNow(Channel.fromIO(fiber.interrupt.apSecond(decision.io)));
              case MergeDecisionTag.Await:
                return fiber.await.map((ex) =>
                  ex.match(
                    (cause) => Channel.fromIO(decision.f(Exit.failCause(cause))),
                    (r) =>
                      r.match(
                        (done) => Channel.fromIO(decision.f(Exit.succeed(done))),
                        (elem) => Channel.writeNow(elem).apSecond(go(single(decision.f))),
                      ),
                  ),
                );
            }
          };
          return exit.match(
            (cause) => onDecision(done(Exit.failCause(cause))),
            (r) =>
              r.match(
                (d) => onDecision(done(Exit.succeed(d))),
                (elem) => pull.forkDaemon.map((leftFiber) => Channel.writeNow(elem).apSecond(go(both(leftFiber, fiber)))),
              ),
          );
        };

      const go = (
        state: LocalMergeState,
      ): Channel<Env & Env1 & Env2 & Env3, unknown, unknown, unknown, OutErr2 | OutErr3, OutElem | OutElem1, OutDone2 | OutDone3> => {
        switch (state._tag) {
          case MergeStateTag.BothRunning: {
            const lj: IO<Env2, OutErr, Either<OutDone, OutElem | OutElem1>>   = state.left.join;
            const rj: IO<Env3, OutErr1, Either<OutDone1, OutElem | OutElem1>> = state.right.join;
            return Channel.unwrap(
              lj.raceWith(
                rj,
                (leftEx, _) =>
                  handleSide(leftEx, state.right, pullL)(
                    leftDone,
                    (l, r) => MergeState.BothRunning(l, r),
                    (f) => MergeState.LeftDone(f),
                  ),
                (rightEx, _) =>
                  handleSide(rightEx, state.left, pullR)(
                    rightDone,
                    (l, r) => MergeState.BothRunning(r, l),
                    (f) => MergeState.RightDone(f),
                  ),
              ),
            );
          }
          case MergeStateTag.LeftDone:
            return Channel.unwrap(
              pullR.result.map((exit) =>
                exit.match(
                  (cause) => Channel.fromIO(state.f(Exit.failCause(cause))),
                  (r) =>
                    r.match(
                      (d) => Channel.fromIO(state.f(Exit.succeed(d))),
                      (elem) => Channel.writeNow(elem).apSecond(go(MergeState.LeftDone(state.f))),
                    ),
                ),
              ),
            );
          case MergeStateTag.RightDone:
            return Channel.unwrap(
              pullL.result.map((exit) =>
                exit.match(
                  (cause) => Channel.fromIO(state.f(Exit.failCause(cause))),
                  (r) =>
                    r.match(
                      (d) => Channel.fromIO(state.f(Exit.succeed(d))),
                      (elem) => Channel.writeNow(elem).apSecond(go(MergeState.RightDone(state.f))),
                    ),
                ),
              ),
            );
        }
      };
      return Channel.fromIO(
        pullL.forkDaemon.zipWith(pullR.forkDaemon, (a, b) =>
          MergeState.BothRunning<unknown, OutErr, OutErr1, unknown, OutElem | OutElem1, OutDone, OutDone1, unknown>(a, b),
        ),
      )
        .chain(go)
        .embedInput(input);
    }),
  );
}

export const never: Channel<unknown, unknown, unknown, unknown, never, never, never> = Channel.fromIO(IO.never);

/**
 * Returns a new channel that will perform the operations of this one, until failure, and then
 * it will switch over to the operations of the specified fallback channel.
 *
 * @tsplus fluent fncts.control.Channel orElse
 */
export function orElse_<Env, Env1, InErr, InErr1, InElem, InElem1, InDone, InDone1, OutErr, OutErr1, OutElem, OutElem1, OutDone, OutDone1>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
): Channel<Env & Env1, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr1, OutElem | OutElem1, OutDone | OutDone1> {
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
      cause.isHalt() && isChannelFailure(cause.value) ? Channel.failNow(cause.value.error as OutErr) : Channel.haltNow(cause),
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
  return self.chain(() => self.repeated);
}

function runManagedInterpret<Env, InErr, InDone, OutErr, OutDone>(
  channelState: ChannelState<Env, OutErr>,
  exec: ChannelExecutor<Env, InErr, unknown, InDone, OutErr, never, OutDone>,
): IO<Env, OutErr, OutDone> {
  // eslint-disable-next-line no-constant-condition
  while (1) {
    switch (channelState._tag) {
      case ChannelStateTag.Effect: {
        return channelState.effect.chain(() => runManagedInterpret(exec.run(), exec));
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
        return readUpstream(channelState, () => runManagedInterpret(exec.run(), exec));
      }
    }
  }
  throw new Error("Bug");
}

/**
 * Runs a channel until the end is received
 *
 * @tsplus getter fncts.control.Channel runManaged
 */
export function runManaged<Env, InErr, InDone, OutErr, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, never, OutDone>,
): Managed<Env, OutErr, OutDone> {
  return Managed.bracketExit(
    IO.succeed(new ChannelExecutor(() => self, undefined, identity)),
    (exec, exit) => exec.close(exit) || IO.unit,
  ).mapIO((exec) => IO.defer(runManagedInterpret(exec.run(), exec)));
}

/**
 * Runs a channel until the end is received
 *
 * @tsplus getter fncts.control.Channel run
 */
export function run<Env, InErr, InDone, OutErr, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, never, OutDone>,
): IO<Env, OutErr, OutDone> {
  return runManaged(self).useNow;
}

/**
 * @tsplus getter fncts.control.Channel runCollect
 */
export function runCollect<Env, InErr, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, OutElem, OutDone>,
): IO<Env, OutErr, readonly [Conc<OutElem>, OutDone]> {
  return self.doneCollect.run;
}

/**
 * Runs a channel until the end is received
 *
 * @tsplus getter fncts.control.Channel runDrain
 */
export function runDrain<Env, InErr, InDone, OutElem, OutErr, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, OutElem, OutDone>,
): IO<Env, OutErr, OutDone> {
  return self.drain.run;
}

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

function writeChunkWriter<Out>(outs: Conc<Out>, idx: number, len: number): Channel<unknown, unknown, unknown, unknown, never, Out, void> {
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
 * @tsplus static fncts.control.ChannelOps unwrapManaged
 */
export function unwrapManaged<R, E, Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: Managed<R, E, Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>>,
): Channel<R & Env, InErr, InElem, InDone, E | OutErr, OutElem, OutDone> {
  return Channel.managedOut(self).concatAllWith(
    (d, _) => d,
    (d, _) => d,
  );
}

/**
 * @tsplus fluent fncts.control.Channel zipC
 */
export function zipC_<Env, Env1, InErr, InErr1, InElem, InElem1, InDone, InDone1, OutErr, OutErr1, OutElem, OutElem1, OutDone, OutDone1>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
): Channel<
  Env1 & Env,
  InErr & InErr1,
  InElem & InElem1,
  InDone & InDone1,
  OutErr | OutErr1,
  OutElem | OutElem1,
  readonly [OutDone, OutDone1]
> {
  return mergeWith_(
    self,
    that,
    (exit1) => MergeDecision.Await((exit2) => IO.fromExit(exit1.zipC(exit2))),
    (exit2) => MergeDecision.Await((exit1) => IO.fromExit(exit1.zipC(exit2))),
  );
}

/**
 * @tsplus fluent fncts.control.Channel zipFirstC
 */
export function zipFirstC_<
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
): Channel<Env1 & Env, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem | OutElem1, OutDone> {
  return self.zipC(that).map(([d]) => d);
}

/**
 * @tsplus fluent fncts.control.Channel zipSecondC
 */
export function zipSecondC_<
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
): Channel<Env1 & Env, InErr & InErr1, InElem & InElem1, InDone & InDone1, OutErr | OutErr1, OutElem | OutElem1, OutDone1> {
  return self.zipC(that).map(([_, d1]) => d1);
}
