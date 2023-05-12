import { tuple } from "@fncts/base/data/function";

import { ChannelPrimitive, ChannelTag, ContinuationK, Done, Fail, Fold } from "./definition.js";

/**
 * Halt a channel with the specified cause
 *
 * @tsplus static fncts.io.ChannelOps failCause
 */
export function failCause<E>(result: Lazy<Cause<E>>): Channel<never, unknown, unknown, unknown, E, never, never> {
  const op = new ChannelPrimitive(ChannelTag.Halt);
  op.i0    = result;
  return op as any;
}

/**
 * Halt a channel with the specified cause
 *
 * @tsplus static fncts.io.ChannelOps failCauseNow
 */
export function failCauseNow<E>(result: Cause<E>): Channel<never, unknown, unknown, unknown, E, never, never> {
  return Channel.failCause(result);
}

/**
 * End a channel with the specified result
 *
 * @tsplus static fncts.io.ChannelOps end
 */
export function end<OutDone>(result: Lazy<OutDone>): Channel<never, unknown, unknown, unknown, never, never, OutDone> {
  const op = new ChannelPrimitive(ChannelTag.Done);
  op.i0    = result;
  return op as any;
}

/**
 * End a channel with the specified result
 *
 * @tsplus static fncts.io.ChannelOps endNow
 */
export function endNow<OutDone>(result: OutDone): Channel<never, unknown, unknown, unknown, never, never, OutDone> {
  return Channel.end(result);
}

/**
 * End a channel with the specified result
 *
 * @tsplus static fncts.io.ChannelOps succeed
 */
export function succeed<Z>(z: Lazy<Z>): Channel<never, unknown, unknown, unknown, never, never, Z> {
  return Channel.end(z);
}

/**
 * End a channel with the specified result
 *
 * @tsplus static fncts.io.ChannelOps succeedNow
 */
export function succeedNow<Z>(z: Z): Channel<never, unknown, unknown, unknown, never, never, Z> {
  return Channel.end(z);
}

/**
 * Returns a new channel, which is the same as this one, except the terminal value of the
 * returned channel is created by applying the specified function to the terminal value of this
 * channel.
 *
 * @tsplus pipeable fncts.io.Channel map
 */
export function map<OutDone, OutDone2>(f: (out: OutDone) => OutDone2) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2> => {
    return self.flatMap((z) => Channel.succeedNow(f(z)));
  };
}

/**
 * Returns a new channel, which sequentially combines this channel, together with the provided
 * factory function, which creates a second channel based on the terminal value of this channel.
 * The result is a channel that will first perform the functions of this channel, before
 * performing the functions of the created channel (including yielding its terminal value).
 *
 * @tsplus pipeable fncts.io.Channel flatMap
 */
export function flatMap<OutDone, Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone2>(
  f: (d: OutDone) => Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone2>,
) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem>(
    channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env | Env1,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr | OutErr1,
    OutElem | OutElem1,
    OutDone2
  > => {
    const op = new ChannelPrimitive(ChannelTag.Fold);

    const continuation = new ChannelPrimitive(ChannelTag.ContinuationK);
    continuation.i0    = f;
    continuation.i1    = Channel.failCauseNow;

    op.i0 = channel;
    op.i1 = continuation;

    return op as any;
  };
}

/**
 * Returns a new channel that is the sequential composition of this channel and the specified
 * channel. The returned channel terminates with a tuple of the terminal values of both channels.
 *
 * @tsplus pipeable fncts.io.Channel cross
 */
export function cross<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>(
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env | Env1,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr | OutErr1,
    OutElem | OutElem1,
    readonly [OutDone, OutDone1]
  > => {
    return self.flatMap((z) => that.map((z2) => tuple(z, z2)));
  };
}

/**
 * Returns a new channel that is the sequential composition of this channel and the specified
 * channel. The returned channel terminates with the terminal value of this channel.
 *
 * @tsplus pipeable fncts.io.Channel zipLeft
 */
export function zipLeft<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>(
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env | Env1,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr | OutErr1,
    OutElem | OutElem1,
    OutDone
  > => {
    return self.flatMap((a) => that.map(() => a));
  };
}

/**
 * Returns a new channel that is the sequential composition of this channel and the specified
 * channel. The returned channel terminates with the terminal value of the other channel.
 *
 * @tsplus pipeable fncts.io.Channel zipRight
 * @tsplus pipeable-operator fncts.io.Channel >
 */
export function zipRight<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>(
  that: Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone1>,
) {
  return <Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
    self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  ): Channel<
    Env | Env1,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr1 | OutErr,
    OutElem1 | OutElem,
    OutDone1
  > => {
    return self.flatMap(() => that);
  };
}
