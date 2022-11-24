export const MVarTypeId = Symbol.for("fncts.io.MVar");
export type MVarTypeId = typeof MVarTypeId;

/**
 * An `MVar[A]` is a mutable location that is either empty or contains a value
 * of type `A`. It has two fundamental operations: `put` which fills an `MVar`
 * if it is empty and blocks otherwise, and `take` which empties an `MVar` if it
 * is full and blocks otherwise. They can be used in multiple different ways:
 *
 *   - As synchronized mutable variables,
 *   - As channels, with `take` and `put` as `receive` and `send`, and
 *   - As a binary semaphore `MVar[Unit]`, with `take` and `put` as `wait` and
 *     `signal`.
 *
 * They were introduced in the paper "Concurrent Haskell" by Simon Peyton Jones,
 * Andrew Gordon and Sigbjorn Finne.
 *
 * @tsplus type fncts.io.MVar
 * @tsplus companion fncts.io.MVarOps
 */
export interface MVar<in out A> {
  readonly _A: (_: A) => A;
  readonly _typeId: MVarTypeId;
}

export class MVarInternal<in out A> implements MVar<A> {
  readonly _typeId: MVarTypeId = MVarTypeId;
  declare _A: (_: A) => A;
  constructor(readonly content: TRef<Maybe<A>>) {}
}

/**
 * @tsplus static fncts.io.MVarOps concrete
 * @tsplus macro remove
 */
export function concrete<A>(_: MVar<A>): asserts _ is MVarInternal<A> {
  //
}
