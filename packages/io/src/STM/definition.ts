import type { Journal } from "./internal/Journal.js";
import type { _A, _E, _R } from "@fncts/base/types";

import { IOTag, IOTypeId, IOVariance } from "@fncts/io/IO/definition";

export const enum STMTag {
  Effect = "Effect",
  OnFailure = "OnFailure",
  OnRetry = "OnRetry",
  OnSuccess = "OnSuccess",
  Succeed = "Succeed",
  SucceedNow = "SucceedNow",
  ContramapEnvironment = "ContramapEnvironment",
}

export const STMVariance = Symbol.for("fncts.io.STM.Variance");
export type STMVariance = typeof STMVariance;

export const STMTypeId = Symbol.for("fncts.io.STM");
export type STMTypeId = typeof STMTypeId;

/**
 * @tsplus type fncts.io.STM
 * @tsplus companion fncts.io.STMOps
 */
export abstract class STM<R, E, A> {
  readonly [IOTypeId]: IOTypeId = IOTypeId;
  readonly _ioOpCode            = IOTag.Commit;
  readonly trace?: string;
  readonly [STMTypeId]: STMTypeId = STMTypeId;
  declare [IOVariance]: {
    _R: () => R;
    _E: () => E;
    _A: () => A;
  };
  declare [STMVariance]: {
    _R: () => R;
    _E: () => E;
    _A: () => A;
  };
}

export declare namespace STM {
  type EnvironmentOf<X> = [X] extends [{ [STMVariance]: { _R: () => infer R } }] ? R : never;
  type ErrorOf<X> = [X] extends [{ [STMVariance]: { _E: () => infer E } }] ? E : never;
  type ValueOf<X> = [X] extends [{ [STMVariance]: { _A: () => infer A } }] ? A : never;
}

/**
 * @tsplus unify fncts.io.STM
 */
export function unifySTM<X extends STM<any, any, any>>(self: X): STM<_R<X>, _E<X>, _A<X>> {
  return self;
}

/**
 * @tsplus type fncts.io.STM
 */
export interface USTM<A> extends STM<never, never, A> {}

export class Effect<R, E, A> extends STM<R, E, A> {
  readonly stmOpCode = STMTag.Effect;
  constructor(readonly f: (journal: Journal, fiberId: FiberId, r: Environment<R>) => A) {
    super();
  }
}

export class OnFailure<R, E, A, E1> extends STM<R, E1, A> {
  readonly stmOpCode = STMTag.OnFailure;
  constructor(
    readonly stm: STM<R, E, A>,
    readonly onFailure: (e: E) => STM<R, E1, A>,
  ) {
    super();
  }
  apply(a: A): STM<R, E, A> {
    return new SucceedNow(a);
  }
}

export class OnRetry<R, E, A> extends STM<R, E, A> {
  readonly stmOpCode = STMTag.OnRetry;
  constructor(
    readonly stm: STM<R, E, A>,
    readonly onRetry: STM<R, E, A>,
  ) {
    super();
  }
  apply(a: A): STM<R, E, A> {
    return new SucceedNow(a);
  }
}

export class OnSuccess<R, E, A, B> extends STM<R, E, B> {
  readonly stmOpCode = STMTag.OnSuccess;
  constructor(
    readonly stm: STM<R, E, A>,
    readonly apply: (a: A) => STM<R, E, B>,
  ) {
    super();
  }
}

export class Succeed<A> extends STM<never, never, A> {
  readonly stmOpCode = STMTag.Succeed;
  constructor(readonly a: () => A) {
    super();
  }
}

export class SucceedNow<A> extends STM<never, never, A> {
  readonly stmOpCode = STMTag.SucceedNow;
  constructor(readonly a: A) {
    super();
  }
}

export class ContramapEnvironment<R, E, A, R0> extends STM<R0, E, A> {
  readonly stmOpCode = STMTag.ContramapEnvironment;
  constructor(
    readonly stm: STM<R, E, A>,
    readonly f: (_: Environment<R0>) => Environment<R>,
  ) {
    super();
  }
}

export function concrete<R, E, A>(
  _: STM<R, E, A>,
): asserts _ is
  | Effect<R, E, A>
  | OnFailure<R, unknown, A, E>
  | OnSuccess<R, E, unknown, A>
  | OnRetry<R, E, A>
  | Succeed<A>
  | SucceedNow<A>
  | ContramapEnvironment<unknown, E, A, R> {
  //
}

export const FailExceptionTypeId = Symbol.for("fncta.control.STM.FailException");
export type FailExceptionTypeId = typeof FailExceptionTypeId;

export class FailException<E> {
  readonly [FailExceptionTypeId]: FailExceptionTypeId = FailExceptionTypeId;
  constructor(readonly e: E) {}
}

export function isFailException(u: unknown): u is FailException<unknown> {
  return isObject(u) && FailExceptionTypeId in u;
}

export const HaltExceptionTypeId = Symbol.for("fncts.io.STM.HaltException");
export type HaltExceptionTypeId = typeof HaltExceptionTypeId;

export class HaltException<E> {
  readonly [HaltExceptionTypeId]: HaltExceptionTypeId = HaltExceptionTypeId;
  constructor(readonly e: E) {}
}

export function isHaltException(u: unknown): u is HaltException<unknown> {
  return isObject(u) && HaltExceptionTypeId in u;
}

export const InterruptExceptionTypeId = Symbol.for("fncts.io.STM.InterruptException");
export type InterruptExceptionTypeId = typeof InterruptExceptionTypeId;

export class InterruptException {
  readonly [InterruptExceptionTypeId]: InterruptExceptionTypeId = InterruptExceptionTypeId;
  constructor(readonly fiberId: FiberId) {}
}

export function isInterruptException(u: unknown): u is InterruptException {
  return isObject(u) && InterruptExceptionTypeId in u;
}

export const RetryExceptionTypeId = Symbol.for("fncts.io.STM.RetryException");
export type RetryExceptionTypeId = typeof RetryExceptionTypeId;

export class RetryException {
  readonly [RetryExceptionTypeId]: RetryExceptionTypeId = RetryExceptionTypeId;
}

export function isRetryException(u: unknown): u is RetryException {
  return isObject(u) && RetryExceptionTypeId in u;
}
