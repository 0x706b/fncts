import type { Cause } from "@fncts/base/data/Cause";
import type { Signal } from "@fncts/callbag/Signal";
import type { Talkback } from "@fncts/callbag/Talkback";

import { unsafeCoerce } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.callbag.Sink
 */
export interface Sink<ErrIn, ErrOut, A> {
  (signal: Signal.Start, talkback: Talkback<ErrOut>): void;
  (signal: Signal.Data, data: A): void;
  (signal: Signal.End, cause?: Cause<ErrIn>): void;
}

/**
 * @tsplus type fncts.callbag.SinkOps
 */
export interface SinkOps {}

export const Sink: SinkOps = {};

type SinkParams<ErrIn, ErrOut, A> =
  | [signal: Signal.Start, talkback: Talkback<ErrOut>]
  | [signal: Signal.Data, data: A]
  | [signal: Signal.End, cause: Cause<ErrIn>];

export type MakeSink<ErrIn, ErrOut, A> = (...params: SinkParams<ErrIn, ErrOut, A>) => void;

/**
 * @tsplus static fncts.callbag.SinkOps __call
 * @tsplus macro identity
 */
export function makeSink<ErrIn, ErrOut, A>(_: MakeSink<ErrIn, ErrOut, A>): Sink<ErrIn, ErrOut, A> {
  return _ as Sink<ErrIn, ErrOut, A>;
}

/**
 * @tsplus getter fncts.callbag.Sink merged
 * @tsplus macro identity
 */
export function mergedSink<InErr, OutErr, A>(
  _: Sink<InErr, OutErr, A>,
): (signal: Signal, param?: Talkback<OutErr> | A | Cause<InErr> | void) => void {
  return unsafeCoerce(_);
}
