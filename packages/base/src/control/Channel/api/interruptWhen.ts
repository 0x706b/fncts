import type { Future } from "../../Future";

import { IO } from "../../IO";
import { Channel } from "../definition";
import { MergeDecision } from "../internal/MergeDecision";

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
