import type { _A, _E, _R } from "@fncts/base/types";

export const StreamTypeId = Symbol.for("@principia/base/IO/Stream");
export type StreamTypeId = typeof StreamTypeId;

/**
 * A `Stream<R, E, A>` is a description of a program that, when evaluated,
 * may emit 0 or more values of type `A`, may fail with errors of type `E`
 * and uses an environment of type `R`.
 * One way to think of `Stream` is as a `Effect` program that could emit multiple values.
 *
 * `Stream` is a purely functional *pull* based stream. Pull based streams offer
 * inherent laziness and backpressure, relieving users of the need to manage buffers
 * between operators. As an optimization `Stream` does not emit single values, but
 * rather an array of values. This allows the cost of effect evaluation to be
 * amortized.
 *
 * `Stream` forms a monad on its `A` type parameter, and has error management
 * facilities for its `E` type parameter, modeled similarly to `Effect` (with some
 * adjustments for the multiple-valued nature of `Stream`). These aspects allow
 * for rich and expressive composition of streams.
 *
 * @tsplus type fncts.control.Stream
 * @tsplus companion fncts.control.StreamOps
 */
export class Stream<R, E, A> {
  readonly [StreamTypeId]: StreamTypeId = StreamTypeId;
  readonly _R!: (_: R) => void;
  readonly _E!: () => E;
  readonly _A!: () => A;

  constructor(readonly channel: Channel<R, unknown, unknown, unknown, E, Conc<A>, unknown>) {}
}

/**
 * @tsplus unify fncts.control.Stream
 */
export function unifyStream<X extends Stream<any, any, any>>(_: X): Stream<_R<X>, _E<X>, _A<X>> {
  return _;
}

export const DEFAULT_CHUNK_SIZE = 4096;
