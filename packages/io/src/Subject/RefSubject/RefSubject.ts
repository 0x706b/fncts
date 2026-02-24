import type {
  MappableRef,
  MappableSynchronized,
  ModifiableRef,
  ModifiableSynchronized,
  PSynchronized,
  ReadableRef,
  WritableRef,
} from "../../Ref.js";
import type { IO } from "@fncts/io/IO";

import { RefTypeId, RefVariance, SynchronizedTypeId } from "../../Ref.js";
import { PSubject } from "../definition.js";

/**
 * @tsplus type fncts.io.RefSubject.RefSubject
 * @tsplus companion fncts.io.RefSubject.RefSubjectOps
 */
export interface RefSubject<R, E, A> extends PRefSubject<R, R, E, E, E, A, A> {}

/**
 * @tsplus type fncts.io.RefSubject.PRefSubject
 * @tsplus companion fncts.io.RefSubject.PRefSubjectOps
 */
export abstract class PRefSubject<EnvIn, EnvOut, ErrIn, ErrOut, ErrInRef, In, Out>
  extends PSubject<EnvIn, EnvOut, ErrIn, ErrOut, In, Out>
  implements
    PRef<EnvIn, EnvOut, ErrInRef, ErrOut, In, Out>,
    PSynchronized<EnvIn, EnvOut, ErrInRef, ErrOut, In, Out>,
    ReadableRef<EnvOut, ErrOut, Out>,
    WritableRef<EnvIn, ErrInRef, In>,
    ModifiableRef<EnvIn, EnvOut, ErrInRef, ErrOut, In, Out>,
    MappableRef<EnvIn, EnvOut, ErrInRef, ErrOut, In, Out>,
    ModifiableSynchronized<EnvIn, EnvOut, ErrInRef, ErrOut, In, Out>,
    MappableSynchronized<EnvIn, EnvOut, ErrInRef, ErrOut, In, Out>
{
  readonly [SynchronizedTypeId]: SynchronizedTypeId = SynchronizedTypeId;
  readonly [RefTypeId]: RefTypeId                   = RefTypeId;
  declare [RefVariance]: {
    readonly _RA: (_: never) => EnvIn;
    readonly _RB: (_: never) => EnvOut;
    readonly _EA: (_: never) => ErrInRef;
    readonly _EB: (_: never) => ErrOut;
    readonly _A: (_: In) => void;
    readonly _B: (_: never) => Out;
  };

  abstract get: IO<EnvOut, ErrOut, Out>;

  abstract set(a: In, __tsplusTrace?: string): IO<EnvIn, ErrInRef, void>;

  abstract modify<C>(f: (b: Out) => readonly [C, In], __tsplusTrace?: string): IO<EnvIn | EnvOut, ErrOut | ErrInRef, C>;

  abstract modifyIO<R1, E1, C>(
    f: (b: Out) => IO<R1, E1, readonly [C, In]>,
    __tsplusTrace?: string,
  ): IO<EnvIn | EnvOut | R1, ErrOut | ErrInRef | E1, C>;

  abstract match<EC, ED, C, D>(
    ea: (_: ErrInRef) => EC,
    eb: (_: ErrOut) => ED,
    ca: (_: C) => Either<EC, In>,
    bd: (_: Out) => Either<ED, D>,
  ): PRef<EnvIn, EnvOut, EC, ED, C, D>;

  abstract matchAll<EC, ED, C, D>(
    ea: (_: ErrInRef) => EC,
    eb: (_: ErrOut) => ED,
    ec: (_: ErrOut) => EC,
    ca: (_: C) => (_: Out) => Either<EC, In>,
    bd: (_: Out) => Either<ED, D>,
  ): PRef<EnvIn | EnvOut, EnvOut, EC, ED, C, D>;

  abstract matchIO<RC, RD, EC, ED, C, D>(
    mapSetError: (_: ErrInRef) => EC,
    mapGetError: (_: ErrOut) => ED,
    mapSet: (_: C) => IO<RC, EC, In>,
    mapGet: (_: Out) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronized<EnvIn | RC, EnvOut | RD, EC, ED, C, D>;

  abstract matchAllIO<RC, RD, EC, ED, C, D>(
    mapSetError: (_: ErrInRef) => EC,
    mapGetError: (_: ErrOut) => ED,
    mapSetGetError: (_: ErrOut) => EC,
    mapSet: (_: C) => (_: Out) => IO<RC, EC, In>,
    mapGet: (_: Out) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronized<EnvIn | EnvOut | RC, EnvOut | RD, EC, ED, C, D>;

  abstract matchIOSubject<RC, RD, EI, EC, ED, C, D>(
    mapSetError: (_: ErrInRef) => EC,
    mapGetError: (_: ErrOut) => ED,
    mapErrorInput: (_: EI) => ErrIn,
    mapSetErrorInput: (_: EC) => ErrInRef,
    mapSet: (_: C) => IO<RC, EC, In>,
    mapGet: (_: Out) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PRefSubject<EnvIn | RC, EnvOut | RD, EI, ED, EC, C, D>;
}
