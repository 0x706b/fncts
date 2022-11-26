import * as P from "../../typeclass.js";

export const ExitVariance = Symbol.for("fncts.Exit");
export type ExitVariance = typeof ExitVariance;

export const ExitTypeId = Symbol.for("fncts.Exit");
export type ExitTypeId = typeof ExitTypeId;

/**
 * @tsplus type fncts.Exit
 */
export type Exit<E, A> = Success<A> | Failure<E>;

/**
 * @tsplus type fncts.ExitOps
 */
export interface ExitOps {}

export const Exit: ExitOps = {};

export const enum ExitTag {
  Success = "Success",
  Failure = "Failure",
}

const _failureHash = Hashable.string("fncts.Exit.Failure");
const _successHash = Hashable.string("fncts.Exit.Success");

/**
 * @tsplus type fncts.Exit.Failure
 * @tsplus companion fncts.Exit.FailureOps
 */
export class Failure<E> {
  readonly [ExitTypeId]: ExitTypeId = ExitTypeId;
  declare [ExitVariance]: {
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => never;
  };
  readonly _tag = ExitTag.Failure;
  constructor(readonly cause: Cause<E>) {}

  get [Symbol.hash](): number {
    return Hashable.combine(_failureHash, Hashable.unknown(this.cause));
  }
  [Symbol.equals](that: unknown): boolean {
    return isExit(that) && isFailure(that) && P.Equatable.strictEquals(this.cause, that.cause);
  }
}

/**
 * @tsplus type fncts.Exit.Success
 * @tsplus companion fncts.Exit.SuccessOps
 */
export class Success<A> implements P.Hashable, P.Equatable {
  readonly [ExitTypeId]: ExitTypeId = ExitTypeId;
  declare [ExitVariance]: {
    readonly _E: (_: never) => never;
    readonly _A: (_: never) => A;
  };
  readonly _tag = ExitTag.Success;
  constructor(readonly value: A) {}

  get [Symbol.hash](): number {
    return Hashable.combine(_successHash, Hashable.unknown(this.value));
  }
  [Symbol.equals](that: unknown): boolean {
    return isExit(that) && isSuccess(that) && P.Equatable.strictEquals(this.value, that.value);
  }
}

/**
 * @tsplus static fncts.ExitOps isExit
 */
export function isExit(u: unknown): u is Exit<unknown, unknown> {
  return isObject(u) && ExitTypeId in u;
}

/**
 * @tsplus fluent fncts.Exit isFailure
 */
export function isFailure<E, A>(exit: Exit<E, A>): exit is Failure<E> {
  return exit._tag === ExitTag.Failure;
}

/**
 * @tsplus fluent fncts.Exit isInterrupt
 */
export function isInterrupt<E, A>(exit: Exit<E, A>): exit is Failure<E> {
  return exit.isFailure() ? exit.cause.interrupted : false;
}

/**
 * @tsplus fluent fncts.Exit isSuccess
 */
export function isSuccess<E, A>(exit: Exit<E, A>): exit is Success<A> {
  return exit._tag === ExitTag.Success;
}

/**
 * @tsplus unify fncts.Exit
 */
export function unifyExit<X extends Exit<any, any>>(
  _: X,
): Exit<[X] extends [Exit<infer E, any>] ? E : never, [X] extends [Exit<any, infer A>] ? A : never> {
  return _;
}
