import type { Signal } from "@fncts/callbag/Signal";

import { unsafeCoerce } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.observable.Talkback
 */
export interface Talkback<Err> {
  (signal: Signal.Start): void;
  (signal: Signal.Data): void;
  (signal: Signal.End, cause?: Cause<Err>): void;
}

/**
 * @tsplus type fncts.observable.TalkbackOps
 */
export interface TalkbackOps {}

export const Talkback: TalkbackOps = {};

export type MakeTalkback<Err> =
  | [signal: Signal.Start, _?: void]
  | [signal: Signal.Data, _?: void]
  | [signal: Signal.End, cause?: Cause<Err>];

/**
 * @tsplus static fncts.observable.TalkbackOps __call
 * @tsplus macro identity
 */
export function makeTalkback<Err>(_: (...params: MakeTalkback<Err>) => void): Talkback<Err> {
  return unsafeCoerce(_);
}

/**
 * @tsplus getter fncts.observable.Talkback merged
 * @tsplus macro identity
 */
export function mergedTalkback<Err>(_: Talkback<Err>): (signal: Signal, param?: Cause<Err> | void) => void {
  return unsafeCoerce(_);
}
