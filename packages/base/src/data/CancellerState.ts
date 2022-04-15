export const enum CancellerStateTag {
  Empty = "Empty",
  Pending = "Pending",
  Registered = "Registered",
}

export class Empty {
  readonly _tag = CancellerStateTag.Empty;
}

export class Pending {
  readonly _tag = CancellerStateTag.Pending;
}

export class Registered {
  readonly _tag = CancellerStateTag.Registered;
  constructor(readonly asyncCanceller: IO<any, any, any>) {}
}

/**
 * @tsplus type fncts.CancellerState
 */
export type CancellerState = Empty | Pending | Registered;

/**
 * @tsplus type fncts.CancellerStateOps
 */
export interface CancellerStateOps {}

export const CancellerState: CancellerStateOps = {};

/**
 * @tsplus static fncts.CancellerStateOps empty
 */
export const empty = new Empty();

/**
 * @tsplus static fncts.CancellerStateOps pending
 */
export const pending = new Pending();

/**
 * @tsplus static fncts.CancellerStateOps registered
 */
export function registered(asyncCanceller: IO<any, any, any>): CancellerState {
  return new Registered(asyncCanceller);
}
