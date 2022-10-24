import type { Queue } from "../../Queue.js";
import type { Take } from "./Take.js";

export type Pull<R, E, A> = IO<R, Maybe<E>, Conc<A>>;

/**
 * @tsplus type fncts.io.Stream.PullOps
 */
export interface PullOps {}

export const Pull: PullOps = {};

/**
 * @tsplus static fncts.io.Stream.PullOps emit
 */
export function emit<A>(a: A): UIO<Conc<A>> {
  return IO.succeedNow(Conc.single(a));
}

/**
 * @tsplus static fncts.io.Stream.PullOps emitChunk
 */
export function emitChunk<A>(as: Conc<A>): UIO<Conc<A>> {
  return IO.succeedNow(as);
}

/**
 * @tsplus static fncts.io.Stream.PullOps fromQueue
 */
export function fromQueue<E, A>(d: Queue.Dequeue<Take<E, A>>): FIO<Maybe<E>, Conc<A>> {
  return d.take.flatMap((take) => take.done);
}

/**
 * @tsplus static fncts.io.Stream.PullOps fail
 */
export function fail<E>(e: E): FIO<Maybe<E>, never> {
  return IO.failNow(Just(e));
}

/**
 * @tsplus static fncts.io.Stream.PullOps failCause
 */
export function failCause<E>(c: Cause<E>): FIO<Maybe<E>, never> {
  return IO.failCauseNow(c).mapError(Maybe.just);
}

/**
 * @tsplus static fncts.io.Stream.PullOps empty
 */
export function empty<A>(): FIO<never, Conc<A>> {
  return IO.succeedNow(Conc.empty<A>());
}

/**
 * @tsplus static fncts.io.Stream.PullOps end
 */
export const end: FIO<Maybe<never>, never> = IO.failNow(Nothing());
