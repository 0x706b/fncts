import type { Interval } from "./Interval";

export const enum DecisionTag {
  Continue = "Continue",
  Done = "Done",
}

export class Continue {
  readonly _tag = DecisionTag.Continue;
  constructor(readonly interval: Interval) {}
}

export class Done {
  readonly _tag = DecisionTag.Done;
}

/**
 * @tsplus type fncts.control.Schedule.Decision
 */
export type Decision = Continue | Done;

/**
 * @tsplus type fncts.control.Schedule.DecisionOps
 */
export interface DecisionOps {}

export const Decision: DecisionOps = {};

/**
 * @tsplus static fncts.control.Schedule.DecisionOps Done
 */
export const done: Decision = new Done();

/**
 * @tsplus static fncts.control.Schedule.DecisionOps Continue
 */
export function continue_(interval: Interval): Decision {
  return new Continue(interval);
}

/**
 * @tsplus fluent fncts.control.Schedule.Decision match
 */
export function match_<A, B>(
  self: Decision,
  onDone: () => A,
  onContinue: (interval: Interval) => B,
): A | B {
  switch (self._tag) {
    case DecisionTag.Continue:
      return onContinue(self.interval);
    case DecisionTag.Done:
      return onDone();
  }
}
