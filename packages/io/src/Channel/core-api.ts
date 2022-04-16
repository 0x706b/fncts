import { tuple } from "@fncts/base/data/function";

import { ContinuationK, Done, Fail, Fold } from "./definition.js";

/**
 * Halt a channel with the specified cause
 *
 * @tsplus static fncts.control.ChannelOps failCause
 */
export function failCause<E>(result: Lazy<Cause<E>>): Channel<unknown, unknown, unknown, unknown, E, never, never> {
  return new Fail(result);
}

/**
 * Halt a channel with the specified cause
 *
 * @tsplus static fncts.control.ChannelOps failCauseNow
 */
export function failCauseNow<E>(result: Cause<E>): Channel<unknown, unknown, unknown, unknown, E, never, never> {
  return Channel.failCause(result);
}

/**
 * End a channel with the specified result
 *
 * @tsplus static fncts.control.ChannelOps end
 */
export function end<OutDone>(
  result: Lazy<OutDone>,
): Channel<unknown, unknown, unknown, unknown, never, never, OutDone> {
  return new Done(result);
}

/**
 * End a channel with the specified result
 *
 * @tsplus static fncts.control.ChannelOps endNow
 */
export function endNow<OutDone>(result: OutDone): Channel<unknown, unknown, unknown, unknown, never, never, OutDone> {
  return Channel.end(result);
}

/**
 * End a channel with the specified result
 *
 * @tsplus static fncts.control.ChannelOps succeed
 */
export function succeed<Z>(z: Lazy<Z>): Channel<unknown, unknown, unknown, unknown, never, never, Z> {
  return Channel.end(z);
}

/**
 * End a channel with the specified result
 *
 * @tsplus static fncts.control.ChannelOps succeedNow
 */
export function succeedNow<Z>(z: Z): Channel<unknown, unknown, unknown, unknown, never, never, Z> {
  return Channel.end(z);
}

/**
 * Returns a new channel, which is the same as this one, except the terminal value of the
 * returned channel is created by applying the specified function to the terminal value of this
 * channel.
 *
 * @tsplus fluent fncts.control.Channel map
 */
export function map_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, OutDone2>(
  self: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (out: OutDone) => OutDone2,
): Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone2> {
  return self.flatMap((z) => Channel.succeedNow(f(z)));
}

/**
 * Returns a new channel, which sequentially combines this channel, together with the provided
 * factory function, which creates a second channel based on the terminal value of this channel.
 * The result is a channel that will first perform the functions of this channel, before
 * performing the functions of the created channel (including yielding its terminal value).
 *
 * @tsplus fluent fncts.control.Channel flatMap
 */
export function flatMap_<
  Env,
  InErr,
  InElem,
  InDone,
  OutErr,
  OutElem,
  OutDone,
  Env1,
  InErr1,
  InElem1,
  InDone1,
  OutErr1,
  OutElem1,
  OutDone2,
>(
  channel: Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (d: OutDone) => Channel<Env1, InErr1, InElem1, InDone1, OutErr1, OutElem1, OutDone2>,
): Channel<
  Env & Env1,
  InErr & InErr1,
  InElem & InElem1,
  InDone & InDone1,
  OutErr | OutErr1,
  OutElem | OutElem1,
  OutDone2
> {
  return new Fold<
    Env & Env1,
    InErr & InErr1,
    InElem & InElem1,
    InDone & InDone1,
    OutErr | OutErr1,
    OutErr | OutErr1,
    OutElem | OutElem1,
    OutDone,
    OutDone2
  >(channel, new ContinuationK(f, Channel.failCauseNow));
}

/**
 * Returns a new channel that is the sequential composition of this channel and the specified
 * channel. The returned channel terminates with a tuple of the terminal values of both channels.
 *
 * @tsplus fluent fncts.control.Channel cross
 */
export function cross_<
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
  OutErr | OutErr1,
  OutElem | OutElem1,
  readonly [OutDone, OutDone1]
> {
  return self.flatMap((z) => that.map((z2) => tuple(z, z2)));
}

/**
 * Returns a new channel that is the sequential composition of this channel and the specified
 * channel. The returned channel terminates with the terminal value of this channel.
 *
 * @tsplus fluent fncts.control.Channel apFirst
 */
export function apFirst_<
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
  OutErr | OutErr1,
  OutElem | OutElem1,
  OutDone
> {
  return self.flatMap((a) => that.map(() => a));
}

/**
 * Returns a new channel that is the sequential composition of this channel and the specified
 * channel. The returned channel terminates with the terminal value of the other channel.
 *
 * @tsplus fluent fncts.control.Channel apSecond
 */
export function apSecond_<
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
  OutErr1 | OutErr,
  OutElem1 | OutElem,
  OutDone1
> {
  return self.flatMap(() => that);
}
