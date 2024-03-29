import type { Atomic as Atomic_ } from "./Atomic.js";
import type * as Synchro from "./Synchronized/definition.js";

export const RefVariance = Symbol.for("fncts.io.Ref.Variance");
export type RefVariance = typeof RefVariance;

export const RefTypeId = Symbol.for("fncts.io.Ref");
export type RefTypeId = typeof RefTypeId;

/**
 * @tsplus type fncts.io.Ref
 */
export interface PRef<RA, RB, EA, EB, A, B> {
  readonly [RefTypeId]: RefTypeId;
  readonly [RefVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _RB: (_: never) => RB;
    readonly _EA: (_: never) => EA;
    readonly _EB: (_: never) => EB;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => B;
  };
}

export type Ref<A> = PRef<never, never, never, never, A, A>;
export type ERef<E, A> = PRef<unknown, unknown, E, E, A, A>;

export declare namespace PRef {
  export type Synchronized<RA, RB, EA, EB, A, B> = Synchro.PSynchronized<RA, RB, EA, EB, A, B>;
}

export declare namespace ERef {
  export type Synchronized<E, A> = Synchro.PSynchronized<never, never, E, E, A, A>;
}

export declare namespace Ref {
  export type Atomic<A> = Atomic_<A>;
  export type Synchronized<A> = Synchro.PSynchronized<never, never, never, never, A, A>;
}

/**
 * @tsplus type fncts.io.RefOps
 */
export interface RefOps {}

export const Ref: RefOps = {};

export interface ReadableRef<RB, EB, B> {
  readonly [RefVariance]: {
    readonly _RB: (_: never) => RB;
    readonly _EB: (_: never) => EB;
    readonly _B: (_: never) => B;
  };
  readonly get: IO<RB, EB, B>;
}

export interface WritableRef<RA, EA, A> {
  readonly [RefVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _EA: (_: never) => EA;
    readonly _A: (_: A) => void;
  };
  set(a: A, __tsplusTrace?: string): IO<RA, EA, void>;
}

export interface ModifiableRef<RA, RB, EA, EB, A, B> {
  readonly [RefVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _RB: (_: never) => RB;
    readonly _EA: (_: never) => EA;
    readonly _EB: (_: never) => EB;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => B;
  };
  modify<C>(f: (b: B) => readonly [C, A], __tsplusTrace?: string): IO<RA | RB, EA | EB, C>;
}

export abstract class RefInternal<RA, RB, EA, EB, A, B>
  implements
    PRef<RA, RB, EA, EB, A, B>,
    ReadableRef<RB, EB, B>,
    WritableRef<RA, EA, A>,
    ModifiableRef<RA, RB, EA, EB, A, B>
{
  readonly [RefTypeId]: RefTypeId = RefTypeId;
  declare [RefVariance]: {
    readonly _RA: (_: never) => RA;
    readonly _RB: (_: never) => RB;
    readonly _EA: (_: never) => EA;
    readonly _EB: (_: never) => EB;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => B;
  };

  /**
   * Folds over the error and value types of the `Ref`. This is a highly
   * polymorphic method that is capable of arbitrarily transforming the error
   * and value types of the `Ref`. For most use cases one of the more specific
   * combinators implemented in terms of `match` will be more ergonomic but this
   * method is extremely useful for implementing new combinators.
   */
  abstract match<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ca: (_: C) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
  ): PRef<RA, RB, EC, ED, C, D>;

  /**
   * Folds over the error and value types ofthe `Ref`, allowing access to
   * the state in transforming the `set` value. This is a more powerful version
   * of `match` but requires unifying the error types.
   */
  abstract matchAll<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ec: (_: EB) => EC,
    ca: (_: C) => (_: B) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
  ): PRef<RA | RB, RB, EC, ED, C, D>;

  /**
   * Reads the value from the `Ref`.
   */
  abstract get get(): IO<RB, EB, B>;

  /**
   * Writes a new value to the `Ref`, with a guarantee of immediate
   * consistency (at some cost to performance).
   */
  abstract set(a: A, __tsplusTrace?: string): IO<RA, EA, void>;

  /**
   * Atomically modifies the `Ref` with the specified function, which
   * computes a return value for the modification. This is a more powerful
   * version of `update`.
   */
  abstract modify<C>(f: (a: B) => readonly [C, A], __tsplusTrace?: string): IO<RA | RB, EA | EB, C>;
}

/**
 * @tsplus macro remove
 */
export function concrete<RA, RB, EA, EB, A, B>(
  _: PRef<RA, RB, EA, EB, A, B>,
): asserts _ is RefInternal<RA, RB, EA, EB, A, B> {
  //
}
