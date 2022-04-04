import { hasTypeId } from "../../util/predicates.js";

export const FiberIdTypeId = Symbol.for("fncts.data.FiberId");
export type FiberIdTypeId = typeof FiberIdTypeId;

const _hashNone = Hashable.hashString("fncts.data.FiberId.None");

export class None {
  readonly _typeId: FiberIdTypeId = FiberIdTypeId;
  readonly _tag                   = "None";
  [Symbol.equatable](that: unknown) {
    return isFiberId(that) && isNone(that);
  }
  get [Symbol.hashable]() {
    return _hashNone;
  }
}

const _hashRuntime = Hashable.hashString("fncts.data.FiberId.Runtime");

export class Runtime {
  readonly _typeId: FiberIdTypeId = FiberIdTypeId;
  readonly _tag                   = "Runtime";
  constructor(readonly seqNumber: number, readonly startTime: number) {}
  [Symbol.equatable](that: unknown): boolean {
    return (
      isFiberId(that) &&
      isRuntime(that) &&
      this.seqNumber === that.seqNumber &&
      this.startTime === that.startTime
    );
  }
}

const _hashComposite = Hashable.hashString("fncts.data.FiberId.Composite");

export class Composite {
  readonly _typeId: FiberIdTypeId = FiberIdTypeId;
  readonly _tag                   = "Composite";
  constructor(readonly fiberIds: HashSet<Runtime>) {}
  [Symbol.equatable](that: unknown) {
    return (
      isFiberId(that) && isComposite(that) && Equatable.strictEquals(this.fiberIds, that.fiberIds)
    );
  }
  get [Symbol.hashable]() {
    return Hashable.combineHash(_hashComposite, Hashable.hash(this.fiberIds));
  }
}

/**
 * @tsplus type fncts.data.FiberId
 */
export type FiberId = None | Runtime | Composite;

/**
 * @tsplus type fncts.data.FiberIdOps
 */
export interface FiberIdOps {}

export const FiberId: FiberIdOps = {};

/**
 * @tsplus static fncts.data.FiberIdOps isFiberId
 */
export function isFiberId(u: unknown): u is FiberId {
  return hasTypeId(u, FiberIdTypeId);
}

/**
 * @tsplus static fncts.data.FiberIdOps isNone
 */
export function isNone(fiberId: FiberId): fiberId is None {
  return fiberId._tag === "None";
}

/**
 * @tsplus static fncts.data.FiberIdOps isRuntime
 */
export function isRuntime(fiberId: FiberId): fiberId is Runtime {
  return fiberId._tag === "Runtime";
}

/**
 * @tsplus static fncts.data.FiberIdOps isComposite
 */
export function isComposite(fiberId: FiberId): fiberId is Composite {
  return fiberId._tag === "Composite";
}
