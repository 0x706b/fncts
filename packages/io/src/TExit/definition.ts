import * as P from "@fncts/base/typeclass";
import { hasTypeId } from "@fncts/base/util/predicates";

/**
 * @tsplus type fncts.TExit
 */
export type TExit<E, A> = Fail<E> | Succeed<A> | Retry | Halt | Interrupt;

/**
 * @tsplus type fncts.TExitOps
 */
export interface TExitOps {}

export const TExit: TExitOps = {};

export const TExitTypeId = Symbol.for("fncts.TExit");
export type TExitTypeId = typeof TExitTypeId;

export const enum TExitTag {
  Fail = "Fail",
  Succeed = "Succeed",
  Halt = "Halt",
  Interrupt = "Interrupt",
  Retry = "Retry",
}

export const FailTypeId = Symbol.for("fncts.TExit.Fail");
export type FailTypeId = typeof FailTypeId;

const _failHash = Hashable.string("fncts.TExit.Fail");

/**
 * @tsplus static fncts.TExitOps isTExit
 */
export function isTExit(u: unknown): u is TExit<unknown, unknown> {
  return hasTypeId(u, TExitTypeId);
}

export class Fail<E> {
  readonly _typeId: TExitTypeId = TExitTypeId;
  readonly _tag                 = TExitTag.Fail;
  constructor(readonly value: E) {}

  get [Symbol.hash](): number {
    return Hashable.combine(_failHash, Hashable.unknown(this.value));
  }

  [Symbol.equals](that: unknown): boolean {
    return isTExit(that) && isFail(that) && Equatable.strictEquals(this.value, that.value);
  }
}

/**
 * @tsplus fluent fncts.TExit isFail
 */
export function isFail<E, A>(self: TExit<E, A>): self is Fail<E> {
  return self._tag === TExitTag.Fail;
}

const _succeedHash = P.Hashable.string("fncts.TExit.Succeed");

export class Succeed<A> {
  readonly _typeId: TExitTypeId = TExitTypeId;
  readonly _tag                 = TExitTag.Succeed;
  constructor(readonly value: A) {}

  get [Symbol.hash](): number {
    return P.Hashable.combine(_succeedHash, Hashable.unknown(this.value));
  }

  [Symbol.equals](that: unknown): boolean {
    return isTExit(that) && isSucceed(that) && P.Equatable.strictEquals(this.value, that.value);
  }
}

/**
 * @tsplus fluent fncts.TExit isSucceed
 */
export function isSucceed<E, A>(self: TExit<E, A>): self is Succeed<A> {
  return self._tag === TExitTag.Succeed;
}

const _haltHash = Hashable.string("fncts.TExit.Halt");

export class Halt {
  readonly _typeId: TExitTypeId = TExitTypeId;
  readonly _tag                 = TExitTag.Halt;
  constructor(readonly value: unknown) {}

  get [Symbol.hash](): number {
    return Hashable.combine(_haltHash, Hashable.unknown(this.value));
  }

  [Symbol.equals](that: unknown): boolean {
    return isTExit(that) && isHalt(that) && P.Equatable.strictEquals(this.value, that.value);
  }
}

/**
 * @tsplus fluent fncts.TExit isHalt
 */
export function isHalt<E, A>(self: TExit<E, A>): self is Halt {
  return self._tag === TExitTag.Halt;
}

const _interruptHash = Hashable.string("fncts.dete.TExit.Interrupt");

export class Interrupt {
  readonly _typeId = TExitTypeId;
  readonly _tag    = TExitTag.Interrupt;
  constructor(readonly fiberId: FiberId) {}

  get [Symbol.hash](): number {
    return Hashable.combine(_interruptHash, Hashable.unknown(this.fiberId));
  }

  [Symbol.equals](that: unknown): boolean {
    return isTExit(that) && isInterrupt(that) && P.Equatable.strictEquals(this.fiberId, that.fiberId);
  }
}

/**
 * @tsplus fluent fncts.TExit isInterrupt
 */
export function isInterrupt<E, A>(self: TExit<E, A>): self is Interrupt {
  return self._tag === TExitTag.Interrupt;
}

const _retryHash = Hashable.string("fncts.TExit.Retry");

export class Retry {
  readonly _typeId: TExitTypeId = TExitTypeId;
  readonly _tag                 = TExitTag.Retry;
  get [Symbol.hash](): number {
    return _retryHash;
  }
  [Symbol.equals](that: unknown): boolean {
    return isTExit(that) && isRetry(that);
  }
}

/**
 * @tsplus fluent fncts.TExit isRetry
 */
export function isRetry<E, A>(self: TExit<E, A>): self is Retry {
  return self._tag === TExitTag.Retry;
}
