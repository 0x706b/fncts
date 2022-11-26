export const FiberIdTypeId = Symbol.for("fncts.FiberId");
export type FiberIdTypeId = typeof FiberIdTypeId;

const _hashNone = Hashable.string("fncts.FiberId.None");

export class None implements Hashable, Equatable {
  readonly [FiberIdTypeId]: FiberIdTypeId = FiberIdTypeId;
  readonly _tag = "None";
  [Symbol.equals](that: unknown) {
    return isFiberId(that) && isNone(that);
  }
  get [Symbol.hash]() {
    return _hashNone;
  }
}

const _hashRuntime = Hashable.string("fncts.FiberId.Runtime");

export class Runtime implements Hashable, Equatable {
  readonly [FiberIdTypeId]: FiberIdTypeId = FiberIdTypeId;
  readonly _tag = "Runtime";
  constructor(readonly id: number, readonly startTime: number, readonly location?: string) {}
  get [Symbol.hash]() {
    return Hashable.combine(Hashable.combine(_hashRuntime, Hashable.number(this.id)), Hashable.unknown(this.location));
  }
  [Symbol.equals](that: unknown): boolean {
    return isFiberId(that) && isRuntime(that) && this.id === that.id && this.startTime === that.startTime;
  }
}

const _hashComposite = Hashable.string("fncts.FiberId.Composite");

export class Composite implements Hashable, Equatable {
  readonly [FiberIdTypeId]: FiberIdTypeId = FiberIdTypeId;
  readonly _tag = "Composite";
  constructor(readonly fiberIds: HashSet<Runtime>) {}
  [Symbol.equals](that: unknown) {
    return isFiberId(that) && isComposite(that) && this.fiberIds == that.fiberIds;
  }
  get [Symbol.hash]() {
    return Hashable.combine(_hashComposite, Hashable.unknown(this.fiberIds));
  }
}

/**
 * @tsplus type fncts.FiberId
 */
export type FiberId = None | Runtime | Composite;

/**
 * @tsplus type fncts.FiberIdOps
 */
export interface FiberIdOps {}

export const FiberId: FiberIdOps = {};

type RuntimeFiberId = Runtime;

export declare namespace FiberId {
  type Runtime = RuntimeFiberId;
}

/**
 * @tsplus static fncts.FiberIdOps isFiberId
 */
export function isFiberId(u: unknown): u is FiberId {
  return isObject(u) && FiberIdTypeId in u;
}

/**
 * @tsplus static fncts.FiberIdOps isNone
 * @tsplus fluent fncts.FiberId isNone
 */
export function isNone(fiberId: FiberId): fiberId is None {
  return fiberId._tag === "None";
}

/**
 * @tsplus static fncts.FiberIdOps isRuntime
 * @tsplus fluent fncts.FiberId isRuntime
 */
export function isRuntime(fiberId: FiberId): fiberId is Runtime {
  return fiberId._tag === "Runtime";
}

/**
 * @tsplus static fncts.FiberIdOps isComposite
 * @tsplus fluent fncts.FiberId isComposite
 */
export function isComposite(fiberId: FiberId): fiberId is Composite {
  return fiberId._tag === "Composite";
}
