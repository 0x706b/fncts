import { Failure, Success } from "./definition.js";

/**
 * @tsplus static fncts.ExitOps halt
 */
export function halt(defect: unknown): Exit<never, never> {
  return failCause(Cause.halt(defect));
}

/**
 * @tsplus static fncts.ExitOps fail
 */
export function fail<E = never, A = never>(e: E): Exit<E, A> {
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
export function fromMaybe_<E, A>(fa: Maybe<A>, onNothing: () => E): Exit<E, A> {
  return fa.match(() => fail(onNothing()), succeed);
}

/**
 * @tsplus static fncts.ExitOps failCause
 */
export function failCause<E = never, A = never>(cause: Cause<E>): Exit<E, A> {
  return new Failure(cause);
}

/**
 * @tsplus static fncts.ExitOps interrupt
 */
export function interrupt(id: FiberId) {
  return failCause(Cause.interrupt(id));
}

/**
 * @tsplus static fncts.ExitOps succeed
 */
export function succeed<E = never, A = never>(value: A): Exit<E, A> {
  return new Success(value);
}

/**
 * @tsplus static fncts.ExitOps unit
 */
export const unit: Exit<never, void> = Exit.succeed(undefined);
