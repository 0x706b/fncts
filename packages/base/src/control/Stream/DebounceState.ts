import type { Conc } from "../../collection/immutable/Conc";
import type { Fiber } from "../Fiber";
import type { HandoffSignal } from "./Handoff";

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
  constructor(readonly fiber: Fiber<E, HandoffSignal<void, E, A>>) {}
}

/**
 * @tsplus type fncts.control.Stream.DebounceState
 */
export type DebounceState<E, A> = NotStarted | Previous<A> | Current<E, A>;

/**
 * @tsplus type fncts.control.Stream.DebounceStateOps
 */
export interface DebounceStateOps {}

export const DebounceState: DebounceStateOps = {};

/**
 * @tsplus static fncts.control.Stream.DebounceStateOps NotStarted
 */
export const notStarted: DebounceState<never, never> = new NotStarted();

/**
 * @tsplus static fncts.control.Stream.DebounceStateOps Previous
 */
export function previous<A>(fiber: Fiber<never, Conc<A>>): DebounceState<never, A> {
  return new Previous(fiber);
}

/**
 * @tsplus static fncts.control.Stream.DebounceStateOps Current
 */
export function current<E, A>(fiber: Fiber<E, HandoffSignal<void, E, A>>): DebounceState<E, A> {
  return new Current(fiber);
}

/**
 * @tsplus fluent fncts.control.Stream.DebounceState match
 */
export function match_<E, A, B, C, D>(
  ds: DebounceState<E, A>,
  cases: {
    NotStarted: (_: NotStarted) => B;
    Current: (_: Current<E, A>) => C;
    Previous: (_: Previous<A>) => D;
  },
): B | C | D {
  switch (ds._tag) {
    case DebounceStateTag.NotStarted:
      return cases.NotStarted(ds);
    case DebounceStateTag.Current:
      return cases.Current(ds);
    case DebounceStateTag.Previous:
      return cases.Previous(ds);
  }
}
