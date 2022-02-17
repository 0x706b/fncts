import type { Cause } from "../Cause";

import * as P from "../../prelude";
import { hasTypeId } from "../../util/predicates";

export const ExitTypeId = Symbol.for("fncts.data.Exit");
export type ExitTypeId = typeof ExitTypeId;

/**
 * @tsplus type fncts.data.Exit
 */
export type Exit<E, A> = Success<A> | Failure<E>;

/**
 * @tsplus type fncts.data.ExitOps
 */
export interface ExitOps {}

export const Exit: ExitOps = {};

export const enum ExitTag {
  Success = "Success",
  Failure = "Failure",
}

/**
 * @tsplus type fncts.data.Exit.Failure
 * @tsplus companion fncts.data.Exit.FailureOps
 */
export class Failure<E> {
  readonly _E!: () => E;
  readonly _A!: () => never;

  readonly _typeId: ExitTypeId = ExitTypeId;
  readonly _tag                = ExitTag.Failure;
  constructor(readonly cause: Cause<E>) {}

  get [Symbol.hashable](): number {
    return P.Hashable.hash(this.cause);
  }
  [Symbol.equatable](that: unknown): boolean {
    return (
      isExit(that) &&
      isFailure(that) &&
      P.Equatable.strictEquals(this.cause, that.cause)
    );
  }
}

/**
 * @tsplus type fncts.data.Exit.Success
 * @tsplus companion fncts.data.Exit.SuccessOps
 */
export class Success<A> implements P.Hashable, P.Equatable {
  readonly _E!: () => never;
  readonly _A!: () => A;

  readonly _typeId: ExitTypeId = ExitTypeId;
  readonly _tag                = ExitTag.Success;
  constructor(readonly value: A) {}

  get [Symbol.hashable](): number {
    return P.Hashable.hash(this.value);
  }
  [Symbol.equatable](that: unknown): boolean {
    return (
      isExit(that) &&
      isSuccess(that) &&
      P.Equatable.strictEquals(this.value, that.value)
    );
  }
}

/**
 * @tsplus static fncts.data.ExitOps isExit
 */
export function isExit(u: unknown): u is Exit<unknown, unknown> {
  return hasTypeId(u, ExitTypeId);
}

/**
 * @tsplus fluent fncts.data.Exit isFailure
 */
export function isFailure<E, A>(exit: Exit<E, A>): exit is Failure<E> {
  return exit._tag === ExitTag.Failure;
}

/**
 * @tsplus fluent fncts.data.Exit isInterrupt
 */
export function isInterrupt<E, A>(exit: Exit<E, A>): exit is Failure<E> {
  return exit.isFailure() ? exit.cause.interrupted : false;
}

/**
 * @tsplus fluent fncts.data.Exit isSuccess
 */
export function isSuccess<E, A>(exit: Exit<E, A>): exit is Success<A> {
  return exit._tag === ExitTag.Success;
}
