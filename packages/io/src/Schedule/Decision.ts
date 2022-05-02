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
export function continue_(interval: Interval): Decision {
  return new Continue(interval);
}

/**
 * @tsplus fluent fncts.io.Schedule.Decision match
 */
export function match_<A, B>(self: Decision, onDone: () => A, onContinue: (interval: Interval) => B): A | B {
  switch (self._tag) {
    case DecisionTag.Continue:
      return onContinue(self.interval);
    case DecisionTag.Done:
      return onDone();
  }
}
