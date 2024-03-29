import type { HandoffSignal } from "./Handoff.js";

export const enum DebounceStateTag {
  NotStarted = "NotStarted",
  Previous = "Previous",
  Current = "Current",
}

export const NotStartedTag = Symbol();
export type NotStartedTag = typeof NotStartedTag;
export class NotStarted {
  readonly _tag = DebounceStateTag.NotStarted;
}

export const PreviousTag = Symbol();
export type PreviousTag = typeof PreviousTag;
export class Previous<A> {
  readonly _tag = DebounceStateTag.Previous;
  constructor(readonly fiber: Fiber<never, Conc<A>>) {}
}

export const CurrentTag = Symbol();
export type CurrentTag = typeof CurrentTag;
export class Current<E, A> {
  readonly _tag = DebounceStateTag.Current;
  constructor(readonly fiber: Fiber<E, HandoffSignal<E, A>>) {}
}

/**
 * @tsplus type fncts.io.Stream.DebounceState
 */
export type DebounceState<E, A> = NotStarted | Previous<A> | Current<E, A>;

/**
 * @tsplus type fncts.io.Stream.DebounceStateOps
 */
export interface DebounceStateOps {}

export const DebounceState: DebounceStateOps = {};

/**
 * @tsplus static fncts.io.Stream.DebounceStateOps NotStarted
 */
export const notStarted: DebounceState<never, never> = new NotStarted();

/**
 * @tsplus static fncts.io.Stream.DebounceStateOps Previous
 */
export function previous<A>(fiber: Fiber<never, Conc<A>>): DebounceState<never, A> {
  return new Previous(fiber);
}

/**
 * @tsplus static fncts.io.Stream.DebounceStateOps Current
 */
export function current<E, A>(fiber: Fiber<E, HandoffSignal<E, A>>): DebounceState<E, A> {
  return new Current(fiber);
}

/**
 * @tsplus pipeable fncts.io.Stream.DebounceState match
 */
export function match<E, A, B, C, D>(cases: {
  NotStarted: (_: NotStarted) => B;
  Current: (_: Current<E, A>) => C;
  Previous: (_: Previous<A>) => D;
}) {
  return (ds: DebounceState<E, A>): B | C | D => {
    switch (ds._tag) {
      case DebounceStateTag.NotStarted:
        return cases.NotStarted(ds);
      case DebounceStateTag.Current:
        return cases.Current(ds);
      case DebounceStateTag.Previous:
        return cases.Previous(ds);
    }
  };
}
