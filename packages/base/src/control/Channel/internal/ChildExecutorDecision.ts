export interface Continue {
  readonly _tag: "Continue";
}

/**
 * @tsplus static fncts.control.Channel.ChildExecutorDecisionOps Continue
 */
export const Continue: ChildExecutorDecision = {
  _tag: "Continue",
};

export interface Close {
  readonly _tag: "Close";
  readonly value: any;
}

/**
 * @tsplus static fncts.control.Channel.ChildExecutorDecisionOps Close
 */
export function Close(value: any): ChildExecutorDecision {
  return {
    _tag: "Close",
    value,
  };
}

export interface Yield {
  readonly _tag: "Yield";
}

/**
 * @tsplus static fncts.control.Channel.ChildExecutorDecisionOps Yield
 */
export const Yield: ChildExecutorDecision = {
  _tag: "Yield",
};

/**
 * @tsplus type fncts.control.Channel.ChildExecutorDecision
 */
export type ChildExecutorDecision = Continue | Close | Yield;

/**
 * @tsplus type fncts.control.Channel.ChildExecutorDecisionOps
 */
export interface ChildExecutorDecisionOps {}

export const ChildExecutorDecision: ChildExecutorDecisionOps = {};

/**
 * @tsplus fluent fncts.control.Channel.ChildExecutorDecision match
 */
export function match_<A, B, C>(d: ChildExecutorDecision, onContinue: () => A, onClose: (value: any) => B, onYield: () => C): A | B | C {
  switch (d._tag) {
    case "Continue": {
      return onContinue();
    }
    case "Close": {
      return onClose(d.value);
    }
    case "Yield": {
      return onYield();
    }
  }
}

export function match<A, B, C>(onContinue: () => A, onClose: (value: any) => B, onYield: () => C): (d: ChildExecutorDecision) => A | B | C {
  return (d) => match_(d, onContinue, onClose, onYield);
}
