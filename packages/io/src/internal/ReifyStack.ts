export const enum ReifyStackTag {
  AsyncJump,
  Trampoline,
  GenerateTrace,
}

export const ReifyStackTypeId = Symbol.for("@fncts.io.ReifyStack");
export type ReifyStackTypeId = typeof ReifyStackTypeId;

export type ReifyStack = AsyncJump | Tramoline | GenerateTrace;

/**
 * @tsplus type fncts.io.ReifyStackOps
 */
export interface ReifyStackOps {}

export const ReifyStack: ReifyStackOps = {};

export interface AsyncJump {
  readonly _typeId: ReifyStackTypeId;
  readonly _tag: ReifyStackTag.AsyncJump;
}

/**
 * @tsplus static fncts.io.ReifyStackOps AsyncJump
 */
export const AsyncJump: ReifyStack = {
  _typeId: ReifyStackTypeId,
  _tag: ReifyStackTag.AsyncJump,
};

export class Tramoline {
  readonly _typeId: ReifyStackTypeId = ReifyStackTypeId;
  readonly _tag = ReifyStackTag.Trampoline;
  constructor(readonly effect: IO<any, any, any>, readonly forceYield: boolean) {}
}

/**
 * @tsplus static fncts.io.ReifyStackOps Trampoline
 */
export function mkTrampoline(effect: IO<any, any, any>, forceYield: boolean): ReifyStack {
  return new Tramoline(effect, forceYield);
}

export interface GenerateTrace {
  readonly _typeId: ReifyStackTypeId;
  readonly _tag: ReifyStackTag.GenerateTrace;
}

/**
 * @tsplus static fncts.io.ReifyStackOps GenerateTrace
 */
export const GenerateTrace: ReifyStack = {
  _typeId: ReifyStackTypeId,
  _tag: ReifyStackTag.GenerateTrace,
};

export function isReifyStack(u: unknown): u is ReifyStack {
  return hasTypeId(u, ReifyStackTypeId);
}
