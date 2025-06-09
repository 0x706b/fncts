import type { FiberStatus } from "../FiberStatus.js";
import type { FiberRuntime } from "./FiberRuntime.js";

export const enum FiberMessageTag {
  InterruptSignal,
  Stateful,
  Resume,
}

export type FiberMessage = InterruptSignal | Stateful | Resume;

/**
 * @tsplus type fncts.io.FiberMessageOps
 */
export interface FiberMessageOps {}

export const FiberMessage: FiberMessageOps = {};

export class InterruptSignal {
  readonly _tag = FiberMessageTag.InterruptSignal;
  constructor(readonly cause: Cause<never>) {}
}

/**
 * @tsplus static fncts.io.FiberMessageOps InterruptSignal
 */
export function interruptSignal(cause: Cause<never>): FiberMessage {
  return new InterruptSignal(cause);
}

export class Stateful {
  readonly _tag = FiberMessageTag.Stateful;
  constructor(readonly onFiber: (fiber: FiberRuntime<any, any>) => void) {}
}

/**
 * @tsplus static fncts.io.FiberMessageOps Stateful
 */
export function stateful(onFiber: (fiber: FiberRuntime<any, any>) => void): FiberMessage {
  return new Stateful(onFiber);
}

export class Resume {
  readonly _tag = FiberMessageTag.Resume;
  constructor(readonly cont: IO<any, any, any>) {}
}

/**
 * @tsplus static fncts.io.FiberMessageOps Resume
 */
export function resume(cont: IO<any, any, any>): FiberMessage {
  return new Resume(cont);
}
