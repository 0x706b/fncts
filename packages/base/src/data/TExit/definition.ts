import type { FiberId } from "../FiberId";

import * as P from "../../prelude";
import { hasTypeId } from "../../util/predicates";

/**
 * @tsplus type fncts.data.TExit
 */
export type TExit<E, A> = Fail<E> | Succeed<A> | Retry | Halt | Interrupt;

/**
 * @tsplus type fncts.data.TExitOps
 */
export interface TExitOps {}

export const TExit: TExitOps = {};

export const TExitTypeId = Symbol.for("fncts.data.TExit");
export type TExitTypeId = typeof TExitTypeId;

export const enum TExitTag {
  Fail = "Fail",
  Succeed = "Succeed",
  Halt = "Halt",
  Interrupt = "Interrupt",
  Retry = "Retry",
}

export const FailTypeId = Symbol.for("fncts.data.TExit.Fail");
export type FailTypeId = typeof FailTypeId;

const _failHash = P.Hashable.hashString("fncts.data.TExit.Fail");

/**
 * @tsplus static fncts.data.TExitOps isTExit
 */
export function isTExit(u: unknown): u is TExit<unknown, unknown> {
  return hasTypeId(u, TExitTypeId);
}

export class Fail<E> {
  readonly _typeId: TExitTypeId = TExitTypeId;
  readonly _tag                 = TExitTag.Fail;
  constructor(readonly value: E) {}

  get [Symbol.hashable](): number {
    return P.Hashable.combineHash(_failHash, P.Hashable.hash(this.value));
  }

  [Symbol.equatable](that: unknown): boolean {
    return isTExit(that) && isFail(that) && P.Equatable.strictEquals(this.value, that.value);
  }
}

/**
 * @tsplus fluent fncts.data.TExit isFail
 */
export function isFail<E, A>(self: TExit<E, A>): self is Fail<E> {
  return self._tag === TExitTag.Fail;
}

const _succeedHash = P.Hashable.hashString("fncts.data.TExit.Succeed");

export class Succeed<A> {
  readonly _typeId: TExitTypeId = TExitTypeId;
  readonly _tag                 = TExitTag.Succeed;
  constructor(readonly value: A) {}

  get [Symbol.hashable](): number {
    return P.Hashable.combineHash(_succeedHash, P.Hashable.hash(this.value));
  }

  [Symbol.equatable](that: unknown): boolean {
    return isTExit(that) && isSucceed(that) && P.Equatable.strictEquals(this.value, that.value);
  }
}

/**
 * @tsplus fluent fncts.data.TExit isSucceed
 */
export function isSucceed<E, A>(self: TExit<E, A>): self is Succeed<A> {
  return self._tag === TExitTag.Succeed;
}

const _haltHash = P.Hashable.hashString("fncts.data.TExit.Halt");

export class Halt {
  readonly _typeId: TExitTypeId = TExitTypeId;
  readonly _tag                 = TExitTag.Halt;
  constructor(readonly value: unknown) {}

  get [Symbol.hashable](): number {
    return P.Hashable.combineHash(_haltHash, P.Hashable.hash(this.value));
  }

  [Symbol.equatable](that: unknown): boolean {
    return isTExit(that) && isHalt(that) && P.Equatable.strictEquals(this.value, that.value);
  }
}

/**
 * @tsplus fluent fncts.data.TExit isHalt
 */
export function isHalt<E, A>(self: TExit<E, A>): self is Halt {
  return self._tag === TExitTag.Halt;
}

const _interruptHash = P.Hashable.hashString("fncts.dete.TExit.Interrupt");

export class Interrupt {
  readonly _typeId = TExitTypeId;
  readonly _tag    = TExitTag.Interrupt;
  constructor(readonly fiberId: FiberId) {}

  get [Symbol.hashable](): number {
    return P.Hashable.combineHash(_interruptHash, P.Hashable.hash(this.fiberId));
  }

  [Symbol.equatable](that: unknown): boolean {
    return (
      isTExit(that) && isInterrupt(that) && P.Equatable.strictEquals(this.fiberId, that.fiberId)
    );
  }
}

/**
 * @tsplus fluent fncts.data.TExit isInterrupt
 */
export function isInterrupt<E, A>(self: TExit<E, A>): self is Interrupt {
  return self._tag === TExitTag.Interrupt;
}

const _retryHash = P.Hashable.hashString("fncts.data.TExit.Retry");

export class Retry {
  readonly _typeId: TExitTypeId = TExitTypeId;
  readonly _tag                 = TExitTag.Retry;
  get [Symbol.hashable](): number {
    return _retryHash;
  }
  [Symbol.equatable](that: unknown): boolean {
    return isTExit(that) && isRetry(that);
  }
}

/**
 * @tsplus fluent fncts.data.TExit isRetry
 */
export function isRetry<E, A>(self: TExit<E, A>): self is Retry {
  return self._tag === TExitTag.Retry;
}
