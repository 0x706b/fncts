import type { FiberStatus } from "../FiberStatus.js";
import type { FiberRuntime } from "./FiberRuntime.js";

export const enum FiberMessageTag {
  InterruptSignal,
  GenStackTrace,
  Stateful,
  Resume,
  YieldNow,
}

export type FiberMessage = InterruptSignal | GenStackTrace | Stateful | Resume | YieldNow;

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
export function mkInterruptSignal(cause: Cause<never>): FiberMessage {
  return new InterruptSignal(cause);
}

export class GenStackTrace {
  readonly _tag = FiberMessageTag.GenStackTrace;
  constructor(readonly onTrace: (trace: Trace) => void) {}
}

/**
 * @tsplus static fncts.io.FiberMessageOps GenStackTrace
 */
export function mkGenStackTrace(onTrace: (trace: Trace) => void): FiberMessage {
  return new GenStackTrace(onTrace);
}

export class Stateful {
  readonly _tag = FiberMessageTag.Stateful;
  constructor(readonly onFiber: (fiber: FiberRuntime<any, any>, status: FiberStatus) => void) {}
}

/**
 * @tsplus static fncts.io.FiberMessageOps Stateful
 */
export function mkStateful(onFiber: (fiber: FiberRuntime<any, any>, status: FiberStatus) => void): FiberMessage {
  return new Stateful(onFiber);
}

export interface Resume {
  readonly _tag: FiberMessageTag.Resume;
}

/**
 * @tsplus static fncts.io.FiberMessageOps Resume
 */
export const Resume: FiberMessage = {
  _tag: FiberMessageTag.Resume,
};

export interface YieldNow {
  readonly _tag: FiberMessageTag.YieldNow;
}

/**
 * @tsplus static fncts.io.FiberMessageOps YieldNow
 */
export const YieldNow: FiberMessage = {
  _tag: FiberMessageTag.YieldNow,
};
