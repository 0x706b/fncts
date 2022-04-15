import type { Atomic as Atomic_ } from "./Atomic/Atomic.js";
import type { Derived } from "./Derived.js";
import type { DerivedAll } from "./DerivedAll.js";
import type * as Synchro from "./Synchronized/definition.js";

export const RefTypeId = Symbol.for("fncts.control.Ref");
export type RefTypeId = typeof RefTypeId;

/**
 * @tsplus type fncts.control.Ref
 */
export interface PRef<RA, RB, EA, EB, A, B> {
  readonly _U: RefTypeId;
  readonly _RA: (_: RA) => void;
  readonly _RB: (_: RB) => void;
  readonly _EA: () => EA;
  readonly _EB: () => EB;
  readonly _A: (_: A) => void;
  readonly _B: () => B;
}

export type Ref<A> = PRef<unknown, unknown, never, never, A, A>;
export type ERef<E, A> = PRef<unknown, unknown, E, E, A, A>;

export declare namespace PRef {
  export type Synchronized<RA, RB, EA, EB, A, B> = Synchro.PSynchronized<RA, RB, EA, EB, A, B>;
}

export declare namespace ERef {
  export type Synchronized<E, A> = Synchro.PSynchronized<unknown, unknown, E, E, A, A>;
}

export declare namespace Ref {
  export type Atomic<A> = Atomic_<A>;
  export type Synchronized<A> = Synchro.PSynchronized<unknown, unknown, never, never, A, A>;
}

/**
 * @tsplus type fncts.control.RefOps
 */
export interface RefOps {}

export const Ref: RefOps = {};

export abstract class RefInternal<RA, RB, EA, EB, A, B> implements PRef<RA, RB, EA, EB, A, B> {
  readonly _U!: RefTypeId;
  readonly _RA!: (_: RA) => void;
  readonly _RB!: (_: RB) => void;
  readonly _EA!: () => EA;
  readonly _EB!: () => EB;
  readonly _A!: (_: A) => void;
  readonly _B!: () => B;

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
  ): PRef<RA & RB, RB, EC, ED, C, D>;

  /**
   * Reads the value from the `Ref`.
   */
  abstract get get(): IO<RB, EB, B>;

  /**
   * Writes a new value to the `Ref`, with a guarantee of immediate
   * consistency (at some cost to performance).
   */
  abstract set(a: A): IO<RA, EA, void>;
}

/**
 * @tsplus macro remove
 */
export function concrete<RA, RB, EA, EB, A, B>(
  _: PRef<RA, RB, EA, EB, A, B>,
): asserts _ is  // @ts-expect-error
  | Atomic_<A | B>
  | Derived<EA, EB, A, B>
  | DerivedAll<EA, EB, A, B>
  | Synchro.PSynchronizedInternal<RA, RB, EA, EB, A, B> {
  //
}
