import type { Maybe } from "../../../data/Maybe";
import type { UIO } from "../definition";

import { Just, Nothing } from "../../../data/Maybe";
import { FiberRef } from "../../FiberRef";
import { IO } from "../definition";

/**
 * The number of fibers used for concurrent operators.
 */
export const Concurrency: FiberRef.Runtime<Maybe<number>> = FiberRef.unsafeMake(Nothing());

/**
 * Retrieves the maximum number of fibers for concurrent operators or `Nothing` if
 * it is unbounded.
 *
 * @tsplus static fncts.control.IOOps concurrency
 */
export const concurrency: UIO<Maybe<number>> = Concurrency.get;

/**
 * Retrieves the current maximum number of fibers for concurrent operators and
 * uses it to run the specified effect.
 *
 * @tsplus static fncts.control.IOOps concurrencyWith
 */
export function concurrencyWith<R, E, A>(f: (concurrency: Maybe<number>) => IO<R, E, A>): IO<R, E, A> {
  return Concurrency.getWith(f);
}

/**
 * Runs the specified effect with the specified maximum number of fibers for
 * concurrent operators.
 *
 * @tsplus fluent fncts.control.IO withConcurrency
 */
export function withConcurrency_<R, E, A>(ma: IO<R, E, A>, n: number): IO<R, E, A> {
  return IO.defer(Concurrency.locally(Just(n))(ma));
}

/**
 * Runs the specified effect with an unbounded maximum number of fibers for
 * concurrent operators.
 *
 * @tsplus getter fncts.control.IO withConcurrencyUnbounded
 */
export function withConcurrencyUnbounded<R, E, A>(ma: IO<R, E, A>): IO<R, E, A> {
  return IO.defer(Concurrency.locally(Nothing())(ma));
}