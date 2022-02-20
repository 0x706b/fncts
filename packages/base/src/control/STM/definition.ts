import type { FiberId } from "../../data/FiberId";
import type { Journal } from "../../internal/Journal";
import type { _A, _E, _R } from "../../types";

import { hasTypeId } from "../../util/predicates";

export const enum STMTag {
  Effect = "Effect",
  OnFailure = "OnFailure",
  OnRetry = "OnRetry",
  OnSuccess = "OnSuccess",
  Succeed = "Succeed",
  SucceedNow = "SucceedNow",
  Gives = "Gives",
}

export const STMTypeId = Symbol.for("fncts.control.STM");
export type STMTypeId = typeof STMTypeId;

/**
 * @tsplus type fncts.control.STM
 * @tsplus companion fncts.control.STMOps
 */
export abstract class STM<R, E, A> {
  readonly _typeId: STMTypeId = STMTypeId;
  readonly _R!: (_: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => A;
}

/**
 * @tsplus unify fncts.control.STM
 */
export function unifySTM<X extends STM<any, any, any>>(
  self: X
): STM<_R<X>, _E<X>, _A<X>> {
  return self;
}

/**
 * @tsplus type fncts.control.STM
 */
export interface USTM<A> extends STM<unknown, never, A> {}

export class Effect<R, E, A> extends STM<R, E, A> {
  readonly _tag = STMTag.Effect;
  constructor(readonly f: (journal: Journal, fiberId: FiberId, r: R) => A) {
    super();
  }
}

export class OnFailure<R, E, A, E1> extends STM<R, E1, A> {
  readonly _tag = STMTag.OnFailure;
  constructor(
    readonly stm: STM<R, E, A>,
    readonly onFailure: (e: E) => STM<R, E1, A>
  ) {
    super();
  }
  apply(a: A): STM<R, E, A> {
    return new SucceedNow(a);
  }
}

export class OnRetry<R, E, A> extends STM<R, E, A> {
  readonly _tag = STMTag.OnRetry;
  constructor(readonly stm: STM<R, E, A>, readonly onRetry: STM<R, E, A>) {
    super();
  }
  apply(a: A): STM<R, E, A> {
    return new SucceedNow(a);
  }
}

export class OnSuccess<R, E, A, B> extends STM<R, E, B> {
  readonly _tag = STMTag.OnSuccess;
  constructor(
    readonly stm: STM<R, E, A>,
    readonly apply: (a: A) => STM<R, E, B>
  ) {
    super();
  }
}

export class Succeed<A> extends STM<unknown, never, A> {
  readonly _tag = STMTag.Succeed;
  constructor(readonly a: () => A) {
    super();
  }
}

export class SucceedNow<A> extends STM<unknown, never, A> {
  readonly _tag = STMTag.SucceedNow;
  constructor(readonly a: A) {
    super();
  }
}

export class Gives<R, E, A, R0> extends STM<R0, E, A> {
  readonly _tag = STMTag.Gives;
  constructor(readonly stm: STM<R, E, A>, readonly f: (_: R0) => R) {
    super();
  }
}

export function concrete<R, E, A>(
  _: STM<R, E, A>
): asserts _ is
  | Effect<R, E, A>
  | OnFailure<R, unknown, A, E>
  | OnSuccess<R, E, unknown, A>
  | OnRetry<R, E, A>
  | Succeed<A>
  | SucceedNow<A>
  | Gives<unknown, E, A, R> {
  //
}

export const FailExceptionTypeId = Symbol.for(
  "fncta.control.STM.FailException"
);
export type FailExceptionTypeId = typeof FailExceptionTypeId;

export class FailException<E> {
  readonly _typeId: FailExceptionTypeId = FailExceptionTypeId;
  constructor(readonly e: E) {}
}

export function isFailException(u: unknown): u is FailException<unknown> {
  return hasTypeId(u, FailExceptionTypeId);
}

export const HaltExceptionTypeId = Symbol.for(
  "fncts.control.STM.HaltException"
);
export type HaltExceptionTypeId = typeof HaltExceptionTypeId;

export class HaltException<E> {
  readonly _typeId: HaltExceptionTypeId = HaltExceptionTypeId;
  constructor(readonly e: E) {}
}

export function isHaltException(u: unknown): u is HaltException<unknown> {
  return hasTypeId(u, HaltExceptionTypeId);
}

export const InterruptExceptionTypeId = Symbol.for(
  "fncts.control.STM.InterruptException"
);
export type InterruptExceptionTypeId = typeof InterruptExceptionTypeId;

export class InterruptException {
  readonly _typeId: InterruptExceptionTypeId = InterruptExceptionTypeId;
  constructor(readonly fiberId: FiberId) {}
}

export function isInterruptException(u: unknown): u is InterruptException {
  return hasTypeId(u, InterruptExceptionTypeId);
}

export const RetryExceptionTypeId = Symbol.for(
  "fncts.control.STM.RetryException"
);
export type RetryExceptionTypeId = typeof RetryExceptionTypeId;

export class RetryException {
  readonly _typeId: RetryExceptionTypeId = RetryExceptionTypeId;
}

export function isRetryException(u: unknown): u is RetryException {
  return hasTypeId(u, RetryExceptionTypeId);
}
