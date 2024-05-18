import { Failure, Success } from "./definition.js";

/**
 * @tsplus static fncts.ExitOps halt
 */
export function halt(defect: unknown, __tsplusTrace?: string): Exit<never, never> {
  return failCause(Cause.halt(defect));
}

/**
 * @tsplus static fncts.ExitOps fail
 */
export function fail<E = never, A = never>(e: E, __tsplusTrace?: string): Exit<E, A> {
  return failCause(Cause.fail(e));
}

/**
 * @tsplus static fncts.ExitOps fromEither
 */
export function fromEither<E = never, A = never>(e: Either<E, A>): Exit<E, A> {
  return e.match(fail, succeed);
}

/**
 * @tsplus static fncts.ExitOps fromMaybe
 */
export function fromMaybe<E, A>(fa: Maybe<A>, onNothing: () => E): Exit<E, A> {
  return fa.match(() => fail(onNothing()), succeed);
}

/**
 * @tsplus static fncts.ExitOps failCause
 */
export function failCause<E = never, A = never>(cause: Cause<E>, __tsplusTrace?: string): Exit<E, A> {
  return new Failure(cause, __tsplusTrace);
}

/**
 * @tsplus static fncts.ExitOps interrupt
 */
export function interrupt(id: FiberId, __tsplusTrace?: string): Exit<never, never> {
  return failCause(Cause.interrupt(id));
}

/**
 * @tsplus static fncts.ExitOps succeed
 */
export function succeed<E = never, A = never>(value: A, __tsplusTrace?: string): Exit<E, A> {
  return new Success(value, __tsplusTrace);
}

/**
 * @tsplus static fncts.ExitOps unit
 */
export const unit: Exit<never, void> = Exit.succeed(undefined);
