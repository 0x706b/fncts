export const enum DecisionTag {
  Continue = "Continue",
  Done = "Done",
}

export class Continue {
  readonly _tag = DecisionTag.Continue;
  constructor(readonly interval: Intervals) {}
}

export class Done {
  readonly _tag = DecisionTag.Done;
}

/**
 * @tsplus type fncts.io.Schedule.Decision
 */
export type Decision = Continue | Done;

/**
 * @tsplus type fncts.io.Schedule.DecisionOps
 */
export interface DecisionOps {}

export const Decision: DecisionOps = {};

/**
 * @tsplus static fncts.io.Schedule.DecisionOps Done
 */
export const done: Decision = new Done();

/**
 * @tsplus static fncts.io.Schedule.DecisionOps Continue
 */
export function continue_(interval: Intervals): Decision {
  return new Continue(interval);
}

/**
 * @tsplus static fncts.io.Schedule.DecisionOps continueWith
 */
export function continueWith(interval: Interval): Decision {
  return new Continue(Intervals(List(interval)));
}

/**
 * @tsplus fluent fncts.io.Schedule.Decision match
 */
export function match_<A, B>(self: Decision, onDone: () => A, onContinue: (interval: Intervals) => B): A | B {
  switch (self._tag) {
    case DecisionTag.Continue:
      return onContinue(self.interval);
    case DecisionTag.Done:
      return onDone();
  }
}
