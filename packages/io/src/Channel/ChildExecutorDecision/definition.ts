export interface Continue {
  readonly _tag: "Continue";
}

/**
 * @tsplus static fncts.io.Channel.ChildExecutorDecisionOps Continue
 */
export const Continue: ChildExecutorDecision = {
  _tag: "Continue",
};

export interface Close {
  readonly _tag: "Close";
  readonly value: any;
}

/**
 * @tsplus static fncts.io.Channel.ChildExecutorDecisionOps Close
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
 * @tsplus static fncts.io.Channel.ChildExecutorDecisionOps Yield
 */
export const Yield: ChildExecutorDecision = {
  _tag: "Yield",
};

/**
 * @tsplus type fncts.io.Channel.ChildExecutorDecision
 */
export type ChildExecutorDecision = Continue | Close | Yield;

/**
 * @tsplus type fncts.io.Channel.ChildExecutorDecisionOps
 */
export interface ChildExecutorDecisionOps {}

export const ChildExecutorDecision: ChildExecutorDecisionOps = {};
